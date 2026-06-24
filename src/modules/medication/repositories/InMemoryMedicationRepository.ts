import { MedicationLog } from '../domain/MedicationLog';
import { MedicationRepository } from './MedicationRepository';

export class InMemoryMedicationRepository implements MedicationRepository {
    private readonly logs: MedicationLog[];

    constructor(seedData: MedicationLog[] = []) {
        this.logs = [...seedData];
    }

    async create(medicationLog: MedicationLog): Promise<MedicationLog> {
        this.logs.push(medicationLog);
        return medicationLog;
    }

    async listByCycle(cycleId: string): Promise<MedicationLog[]> {
        return this.logs
            .filter((log) => log.cycleId === cycleId)
            .sort((a, b) => a.date.localeCompare(b.date));
    }
}
