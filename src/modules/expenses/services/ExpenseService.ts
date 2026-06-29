import { ValidationError } from '../../../shared/errors/ValidationError';
import { nowIso, toDateOnly } from '../../../shared/utils/date';
import { generateId } from '../../../shared/utils/id';
import { CycleService } from '../../cycles/services/CycleService';
import {
    AddManualExpenseInput,
    AddSystemExpenseInput,
    Expense,
    ExpenseCategory,
} from '../domain/Expense';
import { ExpenseRepository } from '../repositories/ExpenseRepository';

export class ExpenseService {
    constructor(
        private readonly expenseRepository: ExpenseRepository,
        private readonly cycleService: CycleService,
    ) { }

    async addManualExpense(input: AddManualExpenseInput): Promise<Expense> {
        await this.cycleService.ensureCycleIsActive(input.cycleId);
        return this.createExpense({
            ...input,
            sourceType: 'MANUAL',
            sourceId: null,
        });
    }

    async addSystemExpense(input: AddSystemExpenseInput): Promise<Expense> {
        await this.cycleService.getCycleById(input.cycleId);
        return this.createExpense(input);
    }

    async listExpensesByCycle(cycleId: string): Promise<Expense[]> {
        await this.cycleService.getCycleById(cycleId);
        return this.expenseRepository.listByCycle(cycleId);
    }

    async getTotalExpensesByCycle(cycleId: string): Promise<number> {
        await this.cycleService.getCycleById(cycleId);
        return this.expenseRepository.getTotalByCycle(cycleId);
    }

    async getExpensesBreakdownByCycle(
        cycleId: string,
    ): Promise<Record<ExpenseCategory, number>> {
        await this.cycleService.getCycleById(cycleId);

        const categories: ExpenseCategory[] = [
            'CHICKS',
            'FEED',
            'MEDICATION',
            'LABOR',
            'ELECTRICITY',
            'TRANSPORT',
            'MISC',
            'OTHER',
        ];

        const totalsByCategory: Partial<Record<ExpenseCategory, number>> = {};

        for (const category of categories) {
            totalsByCategory[category] = await this.expenseRepository.getTotalByCycleAndCategory(
                cycleId,
                category,
            );
        }

        return totalsByCategory as Record<ExpenseCategory, number>;
    }

    async getCategoryTotalByCycle(
        cycleId: string,
        category: ExpenseCategory,
    ): Promise<number> {
        await this.cycleService.getCycleById(cycleId);
        return this.expenseRepository.getTotalByCycleAndCategory(cycleId, category);
    }

    private async createExpense(
        input:
            | (AddManualExpenseInput & { sourceType: 'MANUAL'; sourceId: string | null })
            | AddSystemExpenseInput,
    ): Promise<Expense> {
        if (input.amount < 0) {
            throw new ValidationError('المبلغ لا يمكن أن يكون سالبًا');
        }

        const timestamp = nowIso();

        const expense: Expense = {
            id: generateId(),
            cycleId: input.cycleId,
            expenseDate: toDateOnly(input.expenseDate),
            category: input.category,
            amount: input.amount,
            description: input.description ?? null,
            sourceType: input.sourceType,
            sourceId: input.sourceId ?? null,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        return this.expenseRepository.create(expense);
    }
}
