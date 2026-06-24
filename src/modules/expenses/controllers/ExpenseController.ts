import { Request, Response } from 'express';

import { ExpenseService } from '../services/ExpenseService';

export class ExpenseController {
    constructor(private readonly expenseService: ExpenseService) { }

    addManualExpense = async (req: Request, res: Response): Promise<void> => {
        const expense = await this.expenseService.addManualExpense({
            ...req.body,
            cycleId: req.params.cycleId,
        });

        res.status(201).json({ success: true, data: expense });
    };

    listByCycle = async (req: Request, res: Response): Promise<void> => {
        const expenses = await this.expenseService.listExpensesByCycle(
            req.params.cycleId,
        );

        res.status(200).json({ success: true, data: expenses });
    };

    getBreakdownByCycle = async (req: Request, res: Response): Promise<void> => {
        const breakdown = await this.expenseService.getExpensesBreakdownByCycle(
            req.params.cycleId,
        );

        res.status(200).json({ success: true, data: breakdown });
    };
}