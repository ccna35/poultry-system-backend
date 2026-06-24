import { Request, Response } from 'express';

import { SalesService } from '../services/SalesService';

export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    createSale = async (req: Request, res: Response): Promise<void> => {
        const sale = await this.salesService.createSale({
            ...req.body,
            cycleId: req.params.cycleId,
        });

        res.status(201).json({ success: true, data: sale });
    };

    getSaleByCycle = async (req: Request, res: Response): Promise<void> => {
        const sale = await this.salesService.getSaleByCycle(req.params.cycleId);

        res.status(200).json({ success: true, data: sale });
    };
}