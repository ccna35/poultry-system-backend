export type DosageUnit = "ملعقة" | "جرام" | "مل" | "سم";
export type DosagePerUnit = "لتر" | "طائر" | "كجم";

export interface MedicationDosage {
    amount: number;        // 10
    unit: DosageUnit;      // "ملعقة" | "جرام" | "مل" | "سم"
    perAmount?: number;    // default 1
    perUnit: DosagePerUnit; // لتر
}

export interface MedicationLog {
    id: string;
    cycleId: string;
    date: string;
    medicineName: string;
    dosage: MedicationDosage;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AddMedicationLogInput {
    cycleId: string;
    date: string;
    medicineName: string;
    dosage: MedicationDosage;
    notes?: string | null;
}