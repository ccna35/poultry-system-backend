import { WeightLog } from '../domain/WeightLog';
import { WeightRepository } from './WeightRepository';

export class InMemoryWeightRepository implements WeightRepository {
    private readonly logs: WeightLog[];

    constructor(seedData: WeightLog[] = []) {
        this.logs = [...seedData];
    }

    async create(weightLog: WeightLog): Promise<WeightLog> {
        this.logs.push(weightLog);
        return weightLog;
    }

    async listByCycle(cycleId: string): Promise<WeightLog[]> {
        return this.logs
            .filter((log) => log.cycleId === cycleId)
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    async getLatestByCycle(cycleId: string): Promise<WeightLog | null> {
        const logs = this.logs
            .filter((log) => log.cycleId === cycleId)
            .sort((a, b) => b.date.localeCompare(a.date));

        return logs[0] ?? null;
    }
}
