import { Expense } from '../../expenses/domain/Expense';
import { ConflictError } from '../../../shared/errors/ConflictError';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { nowIso } from '../../../shared/utils/date';
import { generateId } from '../../../shared/utils/id';
import { CreateCycleInput, Cycle } from '../domain/Cycle';
import { CycleRepository } from '../repositories/CycleRepository';

export class CycleService {
    constructor(private readonly cycleRepository: CycleRepository) { }

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

        const chicksExpense: Expense = {
            id: generateId(),
            cycleId: cycle.id,
            expenseDate: cycle.startDate,
            category: 'CHICKS',
            amount: cycle.initialBirds * cycle.chickPrice,
            description: 'Automatic chicks expense on cycle creation',
            sourceType: 'SYSTEM',
            sourceId: cycle.id,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        return this.cycleRepository.createWithInitialExpense(cycle, chicksExpense);
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