import { DailyLog } from '../domain/DailyLog';
import { DailyLogRepository } from './DailyLogRepository';

export class InMemoryDailyLogRepository implements DailyLogRepository {
    private readonly dailyLogs: DailyLog[];

    constructor(seedData: DailyLog[] = []) {
        this.dailyLogs = [...seedData];
    }

    async create(log: DailyLog): Promise<DailyLog> {
        this.dailyLogs.push(log);
        return log;
    }

    async listByCycle(cycleId: string): Promise<DailyLog[]> {
        return this.dailyLogs
            .filter((log) => log.cycleId === cycleId)
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    async findByCycleAndDate(cycleId: string, date: string): Promise<DailyLog | null> {
        return (
            this.dailyLogs.find((log) => log.cycleId === cycleId && log.date === date) ??
            null
        );
    }

    async getTotalDeathsByCycle(cycleId: string): Promise<number> {
        return this.dailyLogs
            .filter((log) => log.cycleId === cycleId)
            .reduce((sum, log) => sum + log.deaths, 0);
    }
}
