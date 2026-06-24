import { Request, Response } from 'express';

import { CycleService } from '../services/CycleService';

export class CycleController {
    constructor(private readonly cycleService: CycleService) { }

    createCycle = async (req: Request, res: Response): Promise<void> => {
        const cycle = await this.cycleService.createCycle(req.body);

        res.status(201).json({
            success: true,
            data: cycle,
        });
    };

    getCycleById = async (req: Request, res: Response): Promise<void> => {
        const cycle = await this.cycleService.getCycleById(req.params.id);

        res.status(200).json({
            success: true,
            data: cycle,
        });
    };

    listCycles = async (_req: Request, res: Response): Promise<void> => {
        const cycles = await this.cycleService.listCycles();

        res.status(200).json({
            success: true,
            data: cycles,
        });
    };
}