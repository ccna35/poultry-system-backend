export const DOMAIN_EVENT_TYPES = {
    MEDICATION_LOG_CREATED: 'MedicationLogCreated',
} as const;

export type DomainEventType =
    (typeof DOMAIN_EVENT_TYPES)[keyof typeof DOMAIN_EVENT_TYPES];

export interface MedicationLogCreatedPayload {
    cycleId: string;
    medicationLogId: string;
    date: string;
    amount: number;
}

export interface DomainEventPayloadMap {
    [DOMAIN_EVENT_TYPES.MEDICATION_LOG_CREATED]: MedicationLogCreatedPayload;
}

export type DomainEvent<K extends DomainEventType = DomainEventType> = {
    type: K;
    payload: DomainEventPayloadMap[K];
};