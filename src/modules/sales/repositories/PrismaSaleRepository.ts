import {
    Prisma,
    PrismaClient,
    type Sale as PrismaSaleModel,
} from '../../../generated/prisma/client';

import { Sale } from '../domain/Sale';
import { SaleRepository } from './SaleRepository';

export class PrismaSaleRepository implements SaleRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(sale: Sale): Promise<Sale> {
        const createdSale = await this.prisma.sale.create({
            data: toPrismaCreateData(sale),
        });

        return toDomainSale(createdSale);
    }

    async createAndCompleteCycle(sale: Sale): Promise<Sale> {
        const createdSale = await this.prisma.$transaction(async (tx) => {
            const createdSale = await tx.sale.create({
                data: toPrismaCreateData(sale),
            });

            await tx.cycle.update({
                where: {
                    id: sale.cycleId,
                },
                data: {
                    status: 'COMPLETED',
                    endDate: toDateOnly(sale.saleDate),
                },
            });

            return createdSale;
        });

        return toDomainSale(createdSale);
    }

    async findByCycle(cycleId: string): Promise<Sale | null> {
        const sale = await this.prisma.sale.findFirst({
            where: {
                cycleId,
            },
            orderBy: {
                saleDate: 'desc',
            },
        });

        return sale ? toDomainSale(sale) : null;
    }
}

function toPrismaCreateData(sale: Sale): Prisma.SaleUncheckedCreateInput {
    return {
        id: sale.id,
        cycleId: sale.cycleId,
        saleDate: toDateOnly(sale.saleDate),
        birdsSold: sale.birdsSold,
        totalWeightKg: new Prisma.Decimal(sale.totalWeightKg),
        pricePerKg: new Prisma.Decimal(sale.pricePerKg),
        createdAt: new Date(sale.createdAt),
        updatedAt: new Date(sale.updatedAt),
    };
}

function toDomainSale(sale: PrismaSaleModel): Sale {
    return {
        id: sale.id,
        cycleId: sale.cycleId,
        saleDate: toDateString(sale.saleDate),
        birdsSold: sale.birdsSold,
        totalWeightKg: sale.totalWeightKg.toNumber(),
        pricePerKg: sale.pricePerKg.toNumber(),
        createdAt: sale.createdAt.toISOString(),
        updatedAt: sale.updatedAt.toISOString(),
    };
}

function toDateOnly(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function toDateString(value: Date): string {
    return value.toISOString().slice(0, 10);
}