import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../../shared/http/asyncHandler';
import { validateRequest } from '../../../shared/http/validateRequest';
import { DailyLogController } from '../controllers/DailyLogController';

const addDailyLogSchema = z.object({
    date: z.string().datetime().or(z.string().min(1)),
    deaths: z.number().int().min(0),
    feedType: z.enum(['STARTER', 'GROWER', 'FINISHER']),
    feedConsumedKg: z.number().min(0),
    waterConsumedLiters: z.number().min(0),
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
        asyncHandler(controller.addDailyLog),
    );

    router.get('/', asyncHandler(controller.listByCycle));

    return router;
};
