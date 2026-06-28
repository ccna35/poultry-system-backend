import { Router } from 'express';
import { z } from 'zod';

import { validateRequest } from '../../../shared/http/validateRequest';
import { SalesController } from '../controllers/SalesController';

const createSaleSchema = z.object({
    saleDate: z.string().datetime().or(z.string().min(1)),
    totalWeightKg: z.number().positive(),
    pricePerKg: z.number().min(0),
});

export const createSalesRouter = (controller: SalesController): Router => {
    const router = Router({ mergeParams: true });

    router.post(
        '/',
        validateRequest({ body: createSaleSchema }),
        controller.createSale,
    );

    router.get('/', controller.getSaleByCycle);

    return router;
};
