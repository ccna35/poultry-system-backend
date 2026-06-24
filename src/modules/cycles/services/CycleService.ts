import { ConflictError } from '../../../shared/errors/ConflictError';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { EventBus } from '../../../shared/events/EventBus';
import { DOMAIN_EVENT_TYPES } from '../../../shared/events/domain-events';
import { nowIso } from '../../../shared/utils/date';
import { generateId } from '../../../shared/utils/id';
import { CreateCycleInput, Cycle } from '../domain/Cycle';
import { CycleRepository } from '../repositories/CycleRepository';

export class CycleService {
    constructor(
        private readonly cycleRepository: CycleRepository,
        private readonly eventBus: EventBus,
    ) { }

    async createCycle(input: CreateCycleInput): Promise<Cycle> {
        this.validateCreateInput(input);

        const activeCycle = await this.cycleRepository.findActive();
        if (activeCycle) {
            throw new ConflictError('Only one active cycle is allowed');
        }

        const timestamp = nowIso();
        const cycle: Cycle = {
            id: generateId(),
            name: input.name.trim(),
            startDate: input.startDate,
            endDate: null,
            status: 'ACTIVE',
            initialBirds: input.initialBirds,
            chickPrice: input.chickPrice,
            expectedFinalWeightKg: input.expectedFinalWeightKg,
            expectedSellingPricePerKg: input.expectedSellingPricePerKg,
            expectedRemainingCost: input.expectedRemainingCost,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        const createdCycle = await this.cycleRepository.create(cycle);

        await this.eventBus.publish(DOMAIN_EVENT_TYPES.CYCLE_CREATED, {
            cycleId: createdCycle.id,
            expenseDate: createdCycle.startDate,
            amount: createdCycle.initialBirds * createdCycle.chickPrice,
        });

        return createdCycle;
    }

    async getCycleById(id: string): Promise<Cycle> {
        const cycle = await this.cycleRepository.findById(id);
        if (!cycle) {
            throw new NotFoundError('Cycle not found');
        }

        return cycle;
    }

    async getActiveCycle(): Promise<Cycle | null> {
        return this.cycleRepository.findActive();
    }

    async listCycles(): Promise<Cycle[]> {
        return this.cycleRepository.list();
    }

    async completeCycle(cycleId: string, endDate?: string): Promise<Cycle> {
        const cycle = await this.getCycleById(cycleId);

        if (cycle.status === 'COMPLETED') {
            return cycle;
        }

        const updatedCycle: Cycle = {
            ...cycle,
            status: 'COMPLETED',
            endDate: endDate ?? nowIso(),
            updatedAt: nowIso(),
        };

        return this.cycleRepository.update(updatedCycle);
    }

    async ensureCycleIsActive(cycleId: string): Promise<Cycle> {
        const cycle = await this.getCycleById(cycleId);

        if (cycle.status !== 'ACTIVE') {
            throw new ConflictError('Cycle is completed');
        }

        return cycle;
    }

    private validateCreateInput(input: CreateCycleInput): void {
        if (!input.name?.trim()) {
            throw new ValidationError('Cycle name is required');
        }

        if (input.initialBirds <= 0) {
            throw new ValidationError('initialBirds must be greater than 0');
        }

        if (input.chickPrice < 0) {
            throw new ValidationError('chickPrice cannot be negative');
        }

        if (input.expectedFinalWeightKg <= 0) {
            throw new ValidationError('expectedFinalWeightKg must be greater than 0');
        }

        if (input.expectedSellingPricePerKg < 0) {
            throw new ValidationError('expectedSellingPricePerKg cannot be negative');
        }

        if (input.expectedRemainingCost < 0) {
            throw new ValidationError('expectedRemainingCost cannot be negative');
        }
    }
}
