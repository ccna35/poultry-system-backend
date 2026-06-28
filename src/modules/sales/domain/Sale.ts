export interface Sale {
    id: string;
    cycleId: string;
    saleDate: string;
    birdsSold: number;
    totalWeightKg: number;
    pricePerKg: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSaleInput {
    cycleId: string;
    saleDate: string;
    totalWeightKg: number;
    pricePerKg: number;
}