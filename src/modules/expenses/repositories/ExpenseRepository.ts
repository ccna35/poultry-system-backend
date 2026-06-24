import { Expense, ExpenseCategory } from '../domain/Expense';

export interface ExpenseRepository {
    create(expense: Expense): Promise<Expense>;
    listByCycle(cycleId: string): Promise<Expense[]>;
    getTotalByCycle(cycleId: string): Promise<number>;
    getTotalByCycleAndCategory(cycleId: string, category: ExpenseCategory): Promise<number>;
}
