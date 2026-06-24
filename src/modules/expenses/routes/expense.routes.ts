import { Router } from 'express';
import { z } from 'zod';

import { validateRequest } from '../../../shared/http/validateRequest';
import { ExpenseController } from '../controllers/ExpenseController';

const addManualExpenseSchema = z.object({
    expenseDate: z.string().datetime().or(z.string().min(1)),
    category: z.enum([
        'CHICKS',
        'FEED',
        'MEDICATION',
        'LABOR',
        'ELECTRICITY',
        'TRANSPORT',
        'MISC',
        'OTHER',
    ]),
    amount: z.number().min(0),
    description: z.string().nullable().optional(),
});

export const createExpenseRouter = (controller: ExpenseController): Router => {
    const router = Router({ mergeParams: true });

    router.post(
        '/',
        validateRequest({ body: addManualExpenseSchema }),
        controller.addManualExpense,
    );

    router.get('/', controller.listByCycle);
    router.get('/breakdown', controller.getBreakdownByCycle);

    return router;
};