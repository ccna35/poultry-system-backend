import { Router } from 'express';
import { z } from 'zod';

import { validateRequest } from '../../../shared/http/validateRequest';
import { MedicationController } from '../controllers/MedicationController';

const dosageUnitSchema = z.enum(["جرام", "مل", "ملعقة"], {
    message: "اختر وحدة الجرعة",
})

const dosagePerUnitSchema = z.enum(["لتر", "طائر", "كجم"], {
    message: "اختر وحدة القياس",
})

const emptyStringToUndefined = (value: unknown) =>
    value === "" ? undefined : value

export const addMedicationLogSchema = z.object({
    date: z.string().min(1, "التاريخ مطلوب"),

    medicineName: z.string().trim().min(1, "اسم الدواء مطلوب"),

    dosage: z.object({
        amount: z.preprocess(
            emptyStringToUndefined,
            z.coerce.number().positive("الكمية يجب أن تكون أكبر من صفر")
        ),

        unit: dosageUnitSchema,

        perAmount: z.preprocess(
            emptyStringToUndefined,
            z.coerce.number().positive("القيمة يجب أن تكون أكبر من صفر").default(1)
        ),

        perUnit: dosagePerUnitSchema,
    }),

    notes: z
        .preprocess(
            (value) => (value === "" ? null : value),
            z.string().nullable().optional()
        ),
})

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