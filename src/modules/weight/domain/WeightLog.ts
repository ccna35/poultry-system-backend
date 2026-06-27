export interface WeightLog {
    id: string;
    cycleId: string;
    date: string;
    sampleSize: number;
    averageWeightKg: number;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AddWeightLogInput {
    cycleId: string;
    date: string;
    sampleSize: number;
    averageWeightKg: number;
    notes?: string | null;
}