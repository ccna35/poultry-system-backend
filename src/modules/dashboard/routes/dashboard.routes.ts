import { Router } from 'express';

import { asyncHandler } from '../../../shared/http/asyncHandler';
import { DashboardController } from '../controllers/DashboardController';

export const createDashboardRouter = (
    controller: DashboardController,
): Router => {
    const router = Router({ mergeParams: true });

    router.get('/dashboard', asyncHandler(controller.getDashboard));
    router.get('/report', asyncHandler(controller.getReport));

    return router;
};
