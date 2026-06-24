import { Router } from 'express';
import { z } from 'zod';

import { validateRequest } from '../../../shared/http/validateRequest';
import { FeedController } from '../controllers/FeedController';

const addFeedPurchaseSchema = z.object({
    purchaseDate: z.string().datetime().or(z.string().min(1)),
    feedType: z.enum(['STARTER', 'GROWER', 'FINISHER']),
    quantityKg: z.number().positive(),
    unitPrice: z.number().min(0),
});

export const createFeedRouter = (controller: FeedController): Router => {
    const router = Router({ mergeParams: true });

    router.post(
        '/',
        validateRequest({ body: addFeedPurchaseSchema }),
        controller.addFeedPurchase,
    );

    router.get('/', controller.listByCycle);

    return router;
};