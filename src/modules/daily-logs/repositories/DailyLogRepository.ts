import { DailyLog } from '../domain/DailyLog';

export interface DailyLogRepository {
    create(log: DailyLog): Promise<DailyLog>;
    createWithFeedConsumption(log: DailyLog): Promise<DailyLog>;
    listByCycle(cycleId: string): Promise<DailyLog[]>;
    findByCycleAndDate(cycleId: string, date: string): Promise<DailyLog | null>;
    getTotalDeathsByCycle(cycleId: string): Promise<number>;
}