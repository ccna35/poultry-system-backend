import { Request, Response } from 'express';

import { DashboardService } from '../services/DashboardService';

export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    getDashboard = async (req: Request, res: Response): Promise<void> => {
        const dashboard = await this.dashboardService.getDashboardByCycle(
            req.params.cycleId,
        );

        res.status(200).json({ success: true, data: dashboard });
    };

    getReport = async (req: Request, res: Response): Promise<void> => {
        const report = await this.dashboardService.getDashboardByCycle(req.params.cycleId);

        res.status(200).json({ success: true, data: report });
    };
}