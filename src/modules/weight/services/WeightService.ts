import { ValidationError } from '../../../shared/errors/ValidationError';
import { nowIso, toDateOnly } from '../../../shared/utils/date';
import { generateId } from '../../../shared/utils/id';
import { CycleService } from '../../cycles/services/CycleService';
import { AddWeightLogInput, WeightLog } from '../domain/WeightLog';
import { WeightRepository } from '../repositories/WeightRepository';

export class WeightService {
    constructor(
        private readonly weightRepository: WeightRepository,
        private readonly cycleService: CycleService,
    ) { }

    async addWeightLog(input: AddWeightLogInput): Promise<WeightLog> {
        if (input.sampleSize <= 0) {
            throw new ValidationError('sampleSize must be greater than 0');
        }

        if (input.averageWeightKg <= 0) {
            throw new ValidationError('averageWeightKg must be greater than 0');
        }

        await this.cycleService.ensureCycleIsActive(input.cycleId);

        const timestamp = nowIso();
        const weightLog: WeightLog = {
            id: generateId(),
            cycleId: input.cycleId,
            date: toDateOnly(input.date),
            sampleSize: input.sampleSize,
            averageWeightKg: input.averageWeightKg,
            notes: input.notes ?? null,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        return this.weightRepository.create(weightLog);
    }

    async listWeightLogsByCycle(cycleId: string): Promise<WeightLog[]> {
        await this.cycleService.getCycleById(cycleId);
        return this.weightRepository.listByCycle(cycleId);
    }

    async getLatestWeightByCycle(cycleId: string): Promise<WeightLog | null> {
        await this.cycleService.getCycleById(cycleId);
        return this.weightRepository.getLatestByCycle(cycleId);
    }
}
