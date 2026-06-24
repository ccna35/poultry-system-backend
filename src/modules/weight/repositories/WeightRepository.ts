import { WeightLog } from '../domain/WeightLog';

export interface WeightRepository {
    create(weightLog: WeightLog): Promise<WeightLog>;
    listByCycle(cycleId: string): Promise<WeightLog[]>;
    getLatestByCycle(cycleId: string): Promise<WeightLog | null>;
}
