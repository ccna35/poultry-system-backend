import { Router } from 'express';

import { DashboardController } from '../controllers/DashboardController';

export const createDashboardRouter = (
    controller: DashboardController,
): Router => {
    const router = Router({ mergeParams: true });

    router.get('/dashboard', controller.getDashboard);
    router.get('/report', controller.getReport);

    return router;
};