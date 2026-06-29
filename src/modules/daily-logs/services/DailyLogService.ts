import { ConflictError } from '../../../shared/errors/ConflictError';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { nowIso, toDateOnly } from '../../../shared/utils/date';
import { generateId } from '../../../shared/utils/id';
import { CycleService } from '../../cycles/services/CycleService';
import { AddDailyLogInput, DailyLog } from '../domain/DailyLog';
import { DailyLogRepository } from '../repositories/DailyLogRepository';

export class DailyLogService {
    constructor(
        private readonly dailyLogRepository: DailyLogRepository,
        private readonly cycleService: CycleService,
    ) { }

    async addDailyLog(input: AddDailyLogInput): Promise<DailyLog> {
        this.validateInput(input);

        const cycle = await this.cycleService.ensureCycleIsActive(input.cycleId);
        const normalizedDate = toDateOnly(input.date);

        const existingLog = await this.dailyLogRepository.findByCycleAndDate(
            input.cycleId,
            normalizedDate,
        );

        if (existingLog) {
            throw new ConflictError('لا يمكن تكرار تاريخ السجل اليومي داخل نفس الدورة.');
        }

        const currentDeaths = await this.dailyLogRepository.getTotalDeathsByCycle(
            input.cycleId,
        );

        if (currentDeaths + input.deaths > cycle.initialBirds) {
            throw new ValidationError('لا يمكن أن يتجاوز إجمالي النافق عدد الطيور الأولي.');
        }

        const timestamp = nowIso();
        const dailyLog: DailyLog = {
            id: generateId(),
            cycleId: input.cycleId,
            date: normalizedDate,
            deaths: input.deaths,
            feedType: input.feedType,
            feedConsumedKg: input.feedConsumedKg,
            temperature: input.temperature ?? null,
            humidity: input.humidity ?? null,
            waterConsumedLiters: input.waterConsumedLiters ?? null,
            notes: input.notes ?? null,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        return this.dailyLogRepository.createWithFeedConsumption(dailyLog);
    }

    async listDailyLogsByCycle(cycleId: string): Promise<DailyLog[]> {
        await this.cycleService.getCycleById(cycleId);
        return this.dailyLogRepository.listByCycle(cycleId);
    }

    async getTotalDeathsByCycle(cycleId: string): Promise<number> {
        await this.cycleService.getCycleById(cycleId);
        return this.dailyLogRepository.getTotalDeathsByCycle(cycleId);
    }

    private validateInput(input: AddDailyLogInput): void {
        if (input.deaths < 0) {
            throw new ValidationError('عدد الوفيات لا يمكن أن يكون سالبًا');
        }

        if (input.feedConsumedKg < 0) {
            throw new ValidationError('كمية العلف المستهلكة لا يمكن أن تكون سالبة');
        }
    }
}