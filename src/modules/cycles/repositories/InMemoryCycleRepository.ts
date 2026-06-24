import { Cycle } from '../domain/Cycle';
import { CycleRepository } from './CycleRepository';

export class InMemoryCycleRepository implements CycleRepository {
    private readonly cycles = new Map<string, Cycle>();

    constructor(seedData: Cycle[] = []) {
        for (const cycle of seedData) {
            this.cycles.set(cycle.id, cycle);
        }
    }

    async create(cycle: Cycle): Promise<Cycle> {
        this.cycles.set(cycle.id, cycle);
        return cycle;
    }

    async update(cycle: Cycle): Promise<Cycle> {
        this.cycles.set(cycle.id, cycle);
        return cycle;
    }

    async findById(id: string): Promise<Cycle | null> {
        return this.cycles.get(id) ?? null;
    }

    async findActive(): Promise<Cycle | null> {
        for (const cycle of this.cycles.values()) {
            if (cycle.status === 'ACTIVE') {
                return cycle;
            }
        }

        return null;
    }

    async list(): Promise<Cycle[]> {
        return Array.from(this.cycles.values()).sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
        );
    }
}
