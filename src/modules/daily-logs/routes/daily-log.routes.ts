import { Router } from 'express';
import { z } from 'zod';

import { validateRequest } from '../../../shared/http/validateRequest';
import { DailyLogController } from '../controllers/DailyLogController';

const addDailyLogSchema = z.object({
    date: z.string().datetime().or(z.string().min(1)),
    deaths: z.number().int().min(0),
    feedConsumedKg: z.number().min(0),
    temperature: z.number().nullable().optional(),
    humidity: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
});

export const createDailyLogRouter = (
    controller: DailyLogController,
): Router => {
    const router = Router({ mergeParams: true });

    router.post(
        '/',
        validateRequest({ body: addDailyLogSchema }),
        controller.addDailyLog,
    );

    router.get('/', controller.listByCycle);

    return router;
};