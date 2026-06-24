import { Request, Response } from 'express';

import { DailyLogService } from '../services/DailyLogService';

export class DailyLogController {
    constructor(private readonly dailyLogService: DailyLogService) { }

    addDailyLog = async (req: Request, res: Response): Promise<void> => {
        const dailyLog = await this.dailyLogService.addDailyLog({
            ...req.body,
            cycleId: req.params.cycleId,
        });

        res.status(201).json({ success: true, data: dailyLog });
    };

    listByCycle = async (req: Request, res: Response): Promise<void> => {
        const dailyLogs = await this.dailyLogService.listDailyLogsByCycle(
            req.params.cycleId,
        );

        res.status(200).json({ success: true, data: dailyLogs });
    };
}