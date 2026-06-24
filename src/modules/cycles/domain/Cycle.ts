export type CycleStatus = 'ACTIVE' | 'COMPLETED';

export interface Cycle {
    id: string;
    name: string;
    startDate: string;
    endDate: string | null;
    status: CycleStatus;
    initialBirds: number;
    chickPrice: number;
    expectedFinalWeightKg: number;
    expectedSellingPricePerKg: number;
    expectedRemainingCost: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCycleInput {
    name: string;
    startDate: string;
    initialBirds: number;
    chickPrice: number;
    expectedFinalWeightKg: number;
    expectedSellingPricePerKg: number;
    expectedRemainingCost: number;
}
