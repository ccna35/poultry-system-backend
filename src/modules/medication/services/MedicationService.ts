import { ValidationError } from '../../../shared/errors/ValidationError';
import { EventBus } from '../../../shared/events/EventBus';
import { DOMAIN_EVENT_TYPES } from '../../../shared/events/domain-events';
import { nowIso, toDateOnly } from '../../../shared/utils/date';
import { generateId } from '../../../shared/utils/id';
import { CycleService } from '../../cycles/services/CycleService';
import { AddMedicationLogInput, MedicationLog } from '../domain/MedicationLog';
import { MedicationRepository } from '../repositories/MedicationRepository';

export class MedicationService {
    constructor(
        private readonly medicationRepository: MedicationRepository,
        private readonly cycleService: CycleService,
        private readonly eventBus: EventBus,
    ) { }

    async addMedicationLog(input: AddMedicationLogInput): Promise<MedicationLog> {
        if (!input.medicineName?.trim()) {
            throw new ValidationError('medicineName is required');
        }

        await this.cycleService.ensureCycleIsActive(input.cycleId);

        const timestamp = nowIso();
        const medicationLog: MedicationLog = {
            id: generateId(),
            cycleId: input.cycleId,
            date: toDateOnly(input.date),
            medicineName: input.medicineName.trim(),
            dosage: input.dosage,
            notes: input.notes ?? null,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        const createdLog = await this.medicationRepository.create(medicationLog);

        await this.eventBus.publish(DOMAIN_EVENT_TYPES.MEDICATION_LOG_CREATED, {
            cycleId: createdLog.cycleId,
            medicationLogId: createdLog.id,
            date: createdLog.date,
        });

        return createdLog;
    }

    async listMedicationLogsByCycle(cycleId: string): Promise<MedicationLog[]> {
        await this.cycleService.getCycleById(cycleId);
        return this.medicationRepository.listByCycle(cycleId);
    }
}
