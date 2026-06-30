import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../../shared/http/asyncHandler';
import { validateRequest } from '../../../shared/http/validateRequest';
import { CycleController } from '../controllers/CycleController';

const createCycleSchema = z.object({
    name: z.string().min(1),
    startDate: z.string().datetime().or(z.string().min(1)),
    initialBirds: z.number().int().positive(),
    chickPrice: z.number().min(0),
    expectedFinalWeightKg: z.number().positive(),
    expectedSellingPricePerKg: z.number().min(0),
    expectedRemainingCost: z.number().min(0),
});

export const createCycleRouter = (
    cycleController: CycleController,
): Router => {
    const router = Router();

    router.post(
        '/',
        validateRequest({ body: createCycleSchema }),
        asyncHandler(cycleController.createCycle),
    );

    router.get('/', asyncHandler(cycleController.listCycles));
    router.get('/:id', asyncHandler(cycleController.getCycleById));

    return router;
};
