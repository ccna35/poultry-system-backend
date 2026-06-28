import {
    Prisma,
    PrismaClient,
    type FeedInventoryBalance as PrismaFeedInventoryBalanceModel,
    type FeedPurchase as PrismaFeedPurchaseModel,
} from '../../../generated/prisma/client';

import { Expense } from '../../expenses/domain/Expense';
import { FeedBalance, FeedPurchase } from '../domain/FeedPurchase';
import { FeedRepository } from './FeedRepository';

export class PrismaFeedRepository implements FeedRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(feedPurchase: FeedPurchase): Promise<FeedPurchase> {
        const createdPurchase = await this.prisma.feedPurchase.create({
            data: toPrismaCreateData(feedPurchase),
        });

        return toDomainFeedPurchase(createdPurchase);
    }

    async createWithInventoryAndExpense(
        feedPurchase: FeedPurchase,
        expense: Expense,
    ): Promise<FeedPurchase> {
        const createdPurchase = await this.prisma.$transaction(async (tx) => {
            const createdPurchase = await tx.feedPurchase.create({
                data: toPrismaCreateData(feedPurchase),
            });

            await tx.expense.create({
                data: toPrismaExpenseCreateData(expense),
            });

            await tx.feedInventoryMovement.create({
                data: toPrismaMovementCreateData(feedPurchase),
            });

            await tx.feedInventoryBalance.upsert({
                where: {
                    cycleId_feedType: {
                        cycleId: feedPurchase.cycleId,
                        feedType: feedPurchase.feedType,
                    },
                },
                update: {
                    quantityKg: {
                        increment: new Prisma.Decimal(feedPurchase.quantityKg),
                    },
                },
                create: toPrismaBalanceCreateData(feedPurchase),
            });

            return createdPurchase;
        });

        return toDomainFeedPurchase(createdPurchase);
    }

    async listByCycle(cycleId: string): Promise<FeedPurchase[]> {
        const purchases = await this.prisma.feedPurchase.findMany({
            where: {
                cycleId,
            },
            orderBy: {
                purchaseDate: 'asc',
            },
        });

        return purchases.map(toDomainFeedPurchase);
    }

    async listBalancesByCycle(cycleId: string): Promise<FeedBalance[]> {
        const balances = await this.prisma.feedInventoryBalance.findMany({
            where: {
                cycleId,
            },
            orderBy: {
                feedType: 'asc',
            },
        });

        return balances.map(toDomainFeedBalance);
    }
}

function toPrismaCreateData(
    purchase: FeedPurchase,
): Prisma.FeedPurchaseUncheckedCreateInput {
    return {
        id: purchase.id,
        cycleId: purchase.cycleId,
        purchaseDate: toDateOnly(purchase.purchaseDate),
        feedType: purchase.feedType,
        quantityKg: new Prisma.Decimal(purchase.quantityKg),
        unitPrice: new Prisma.Decimal(purchase.unitPrice),
        createdAt: new Date(purchase.createdAt),
        updatedAt: new Date(purchase.updatedAt),
    };
}

function toPrismaExpenseCreateData(expense: Expense): Prisma.ExpenseUncheckedCreateInput {
    return {
        id: expense.id,
        cycleId: expense.cycleId,
        expenseDate: toDateOnly(expense.expenseDate),
        category: expense.category,
        amount: new Prisma.Decimal(expense.amount),
        description: expense.description ?? null,
        sourceType: expense.sourceType ?? null,
        sourceId: expense.sourceId ?? null,
        createdAt: new Date(expense.createdAt),
        updatedAt: new Date(expense.updatedAt),
    };
}

function toPrismaMovementCreateData(
    purchase: FeedPurchase,
): Prisma.FeedInventoryMovementUncheckedCreateInput {
    return {
        id: purchase.id,
        cycleId: purchase.cycleId,
        movementDate: toDateOnly(purchase.purchaseDate),
        feedType: purchase.feedType,
        movementType: 'PURCHASE',
        quantityKg: new Prisma.Decimal(purchase.quantityKg),
        referenceType: 'FEED_PURCHASE',
        referenceId: purchase.id,
        notes: 'Automatic inventory increase from feed purchase',
        createdAt: new Date(purchase.createdAt),
        updatedAt: new Date(purchase.updatedAt),
    };
}

function toPrismaBalanceCreateData(
    purchase: FeedPurchase,
): Prisma.FeedInventoryBalanceUncheckedCreateInput {
    return {
        cycleId: purchase.cycleId,
        feedType: purchase.feedType,
        quantityKg: new Prisma.Decimal(purchase.quantityKg),
        createdAt: new Date(purchase.createdAt),
        updatedAt: new Date(purchase.updatedAt),
    };
}

function toDomainFeedPurchase(purchase: PrismaFeedPurchaseModel): FeedPurchase {
    return {
        id: purchase.id,
        cycleId: purchase.cycleId,
        purchaseDate: toDateString(purchase.purchaseDate),
        feedType: purchase.feedType,
        quantityKg: purchase.quantityKg.toNumber(),
        unitPrice: purchase.unitPrice.toNumber(),
        createdAt: purchase.createdAt.toISOString(),
        updatedAt: purchase.updatedAt.toISOString(),
    };
}

function toDomainFeedBalance(balance: PrismaFeedInventoryBalanceModel): FeedBalance {
    return {
        feedType: balance.feedType,
        quantityKg: balance.quantityKg.toNumber(),
    };
}

function toDateOnly(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function toDateString(value: Date): string {
    return value.toISOString().slice(0, 10);
}