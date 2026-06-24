export interface MedicationLog {
    id: string;
    cycleId: string;
    date: string;
    medicineName: string;
    dosage: string;
    cost: number;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AddMedicationLogInput {
    cycleId: string;
    date: string;
    medicineName: string;
    dosage: string;
    cost: number;
    notes?: string | null;
}export interface MedicationLog {
    id: string;
    cycleId: string;
    date: string;
    medicineName: string;
    dosage: string;
    cost: number;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AddMedicationLogInput {
    cycleId: string;
    date: string;
    medicineName: string;
    dosage: string;
    cost: number;
    notes?: string | null;
}