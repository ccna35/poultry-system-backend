export interface Sale {
    id: string;
    cycleId: string;
    saleDate: string;
    birdsSold: number;
    averageSellingWeightKg: number;
    pricePerKg: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSaleInput {
    cycleId: string;
    saleDate: string;
    birdsSold: number;
    averageSellingWeightKg: number;
    pricePerKg: number;
}