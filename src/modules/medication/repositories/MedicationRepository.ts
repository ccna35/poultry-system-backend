import { MedicationLog } from '../domain/MedicationLog';

export interface MedicationRepository {
    create(medicationLog: MedicationLog): Promise<MedicationLog>;
    listByCycle(cycleId: string): Promise<MedicationLog[]>;
}
