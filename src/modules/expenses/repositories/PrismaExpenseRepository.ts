import {
    Prisma,
    PrismaClient,
    type Expense as PrismaExpenseModel,
} from '../../../generated/prisma/client';

import { Expense, ExpenseCategory } from '../domain/Expense';
import { ExpenseRepository } from './ExpenseRepository';

export class PrismaExpenseRepository implements ExpenseRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(expense: Expense): Promise<Expense> {
        const createdExpense = await this.prisma.expense.create({
            data: toPrismaCreateData(expense),
        });

        return toDomainExpense(createdExpense);
    }

    async listByCycle(cycleId: string): Promise<Expense[]> {
        const expenses = await this.prisma.expense.findMany({
            where: {
                cycleId,
            },
            orderBy: {
                expenseDate: 'asc',
            },
        });

        return expenses.map(toDomainExpense);
    }

    async getTotalByCycle(cycleId: string): Promise<number> {
        const result = await this.prisma.expense.aggregate({
            where: {
                cycleId,
            },
            _sum: {
                amount: true,
            },
        });

        return result._sum.amount?.toNumber() ?? 0;
    }

    async getTotalByCycleAndCategory(
        cycleId: string,
        category: ExpenseCategory,
    ): Promise<number> {
        const result = await this.prisma.expense.aggregate({
            where: {
                cycleId,
                category,
            },
            _sum: {
                amount: true,
            },
        });

        return result._sum.amount?.toNumber() ?? 0;
    }
}

function toPrismaCreateData(expense: Expense): Prisma.ExpenseUncheckedCreateInput {
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

function toDomainExpense(expense: PrismaExpenseModel): Expense {
    return {
        id: expense.id,
        cycleId: expense.cycleId,
        expenseDate: toDateString(expense.expenseDate),
        category: expense.category,
        amount: expense.amount.toNumber(),
        description: expense.description,
        sourceType: expense.sourceType,
        sourceId: expense.sourceId,
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
    };
}

function toDateOnly(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function toDateString(value: Date): string {
    return value.toISOString().slice(0, 10);
}