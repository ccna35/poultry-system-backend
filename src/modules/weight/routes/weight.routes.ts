import { Router } from 'express';
import { z } from 'zod';

import { validateRequest } from '../../../shared/http/validateRequest';
import { WeightController } from '../controllers/WeightController';

const addWeightLogSchema = z.object({
    date: z.string().datetime().or(z.string().min(1)),
    sampleSize: z.number().int().positive(),
    averageWeightKg: z.number().positive(),
    notes: z.string().nullable().optional(),
});

export const createWeightRouter = (controller: WeightController): Router => {
    const router = Router({ mergeParams: true });

    router.post(
        '/',
        validateRequest({ body: addWeightLogSchema }),
        controller.addWeightLog,
    );

    router.get('/', controller.listByCycle);

    return router;
};