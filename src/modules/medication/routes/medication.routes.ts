import { Router } from 'express';
import { z } from 'zod';

import { validateRequest } from '../../../shared/http/validateRequest';
import { MedicationController } from '../controllers/MedicationController';

const addMedicationLogSchema = z.object({
    date: z.string().datetime().or(z.string().min(1)),
    medicineName: z.string().min(1),
    dosage: z.string().min(1),
    cost: z.number().min(0),
    notes: z.string().nullable().optional(),
});

export const createMedicationRouter = (
    controller: MedicationController,
): Router => {
    const router = Router({ mergeParams: true });

    router.post(
        '/',
        validateRequest({ body: addMedicationLogSchema }),
        controller.addMedicationLog,
    );

    router.get('/', controller.listByCycle);

    return router;
};