import { Request, Response } from 'express';

import { MedicationService } from '../services/MedicationService';

export class MedicationController {
    constructor(private readonly medicationService: MedicationService) { }

    addMedicationLog = async (req: Request, res: Response): Promise<void> => {
        const medicationLog = await this.medicationService.addMedicationLog({
            ...req.body,
            cycleId: req.params.cycleId,
        });

        res.status(201).json({ success: true, data: medicationLog });
    };

    listByCycle = async (req: Request, res: Response): Promise<void> => {
        const medicationLogs = await this.medicationService.listMedicationLogsByCycle(
            req.params.cycleId,
        );

        res.status(200).json({ success: true, data: medicationLogs });
    };
}