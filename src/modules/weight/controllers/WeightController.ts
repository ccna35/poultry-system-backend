import { Request, Response } from 'express';

import { WeightService } from '../services/WeightService';

export class WeightController {
    constructor(private readonly weightService: WeightService) { }

    addWeightLog = async (req: Request, res: Response): Promise<void> => {
        const weightLog = await this.weightService.addWeightLog({
            ...req.body,
            cycleId: req.params.cycleId,
        });

        res.status(201).json({ success: true, data: weightLog });
    };

    listByCycle = async (req: Request, res: Response): Promise<void> => {
        const weightLogs = await this.weightService.listWeightLogsByCycle(
            req.params.cycleId,
        );

        res.status(200).json({ success: true, data: weightLogs });
    };
}