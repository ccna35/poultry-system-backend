import { Prisma, PrismaClient, Cycle as PrismaCycleModel } from '../../../generated/prisma/client';
import { Cycle } from '../domain/Cycle';
import { CycleRepository } from './CycleRepository';

export class PrismaCycleRepository implements CycleRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(cycle: Cycle): Promise<Cycle> {
        const createdCycle = await this.prisma.cycle.create({
            data: toPrismaCreateData(cycle),
        });

        return toDomainCycle(createdCycle);
    }

    async update(cycle: Cycle): Promise<Cycle> {
        const updatedCycle = await this.prisma.cycle.update({
            where: {
                id: cycle.id,
            },
            data: toPrismaUpdateData(cycle),
        });

        return toDomainCycle(updatedCycle);
    }

    async findById(id: string): Promise<Cycle | null> {
        const cycle = await this.prisma.cycle.findUnique({
            where: {
                id,
            },
        });

        return cycle ? toDomainCycle(cycle) : null;
    }

    async findActive(): Promise<Cycle | null> {
        const cycle = await this.prisma.cycle.findFirst({
            where: {
                status: 'ACTIVE',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return cycle ? toDomainCycle(cycle) : null;
    }

    async list(): Promise<Cycle[]> {
        const cycles = await this.prisma.cycle.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        return cycles.map(toDomainCycle);
    }
}

function toPrismaCreateData(cycle: Cycle): Prisma.CycleCreateInput {
    return {
        id: cycle.id,
        name: cycle.name,
        startDate: toDateOnly(cycle.startDate),
        endDate: cycle.endDate ? toDateOnly(cycle.endDate) : null,
        status: cycle.status,
        initialBirds: cycle.initialBirds,

        chickPrice: toDecimal(cycle.chickPrice),
        expectedFinalWeightKg: toDecimal(cycle.expectedFinalWeightKg),
        expectedSellingPricePerKg: toDecimal(cycle.expectedSellingPricePerKg),
        expectedRemainingCost: toDecimal(cycle.expectedRemainingCost ?? 0),

        createdAt: new Date(cycle.createdAt),
        updatedAt: new Date(cycle.updatedAt),
    };
}

function toPrismaUpdateData(cycle: Cycle): Prisma.CycleUpdateInput {
    return {
        name: cycle.name,
        startDate: toDateOnly(cycle.startDate),
        endDate: cycle.endDate ? toDateOnly(cycle.endDate) : null,
        status: cycle.status,
        initialBirds: cycle.initialBirds,

        chickPrice: toDecimal(cycle.chickPrice),
        expectedFinalWeightKg: toDecimal(cycle.expectedFinalWeightKg),
        expectedSellingPricePerKg: toDecimal(cycle.expectedSellingPricePerKg),
        expectedRemainingCost: toDecimal(cycle.expectedRemainingCost ?? 0),

        // No need to set updatedAt manually.
        // Prisma will update it because of @updatedAt.
    };
}

function toDomainCycle(cycle: PrismaCycleModel): Cycle {
    return {
        id: cycle.id,
        name: cycle.name,
        startDate: toDateString(cycle.startDate),
        endDate: cycle.endDate ? toDateString(cycle.endDate) : null,
        status: cycle.status,
        initialBirds: cycle.initialBirds,

        chickPrice: cycle.chickPrice.toNumber(),
        expectedFinalWeightKg: cycle.expectedFinalWeightKg.toNumber(),
        expectedSellingPricePerKg: cycle.expectedSellingPricePerKg.toNumber(),
        expectedRemainingCost: cycle.expectedRemainingCost.toNumber(),

        createdAt: cycle.createdAt.toISOString(),
        updatedAt: cycle.updatedAt.toISOString(),
    };
}

function toDecimal(value: number | string | Prisma.Decimal): Prisma.Decimal {
    return new Prisma.Decimal(value);
}

function toDateOnly(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function toDateString(value: Date): string {
    return value.toISOString().slice(0, 10);
}