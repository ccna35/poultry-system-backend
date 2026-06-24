import { Cycle } from '../domain/Cycle';

export interface CycleRepository {
    create(cycle: Cycle): Promise<Cycle>;
    update(cycle: Cycle): Promise<Cycle>;
    findById(id: string): Promise<Cycle | null>;
    findActive(): Promise<Cycle | null>;
    list(): Promise<Cycle[]>;
}
