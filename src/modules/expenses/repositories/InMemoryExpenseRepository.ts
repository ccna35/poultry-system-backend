import { Expense, ExpenseCategory } from '../domain/Expense';
import { ExpenseRepository } from './ExpenseRepository';

export class InMemoryExpenseRepository implements ExpenseRepository {
    private readonly expenses: Expense[];

    constructor(seedData: Expense[] = []) {
        this.expenses = [...seedData];
    }

    async create(expense: Expense): Promise<Expense> {
        this.expenses.push(expense);
        return expense;
    }

    async listByCycle(cycleId: string): Promise<Expense[]> {
        return this.expenses
            .filter((expense) => expense.cycleId === cycleId)
            .sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));
    }

    async getTotalByCycle(cycleId: string): Promise<number> {
        return this.expenses
            .filter((expense) => expense.cycleId === cycleId)
            .reduce((sum, expense) => sum + expense.amount, 0);
    }

    async getTotalByCycleAndCategory(
        cycleId: string,
        category: ExpenseCategory,
    ): Promise<number> {
        return this.expenses
            .filter((expense) => expense.cycleId === cycleId && expense.category === category)
            .reduce((sum, expense) => sum + expense.amount, 0);
    }
}
