export const DOMAIN_EVENT_TYPES = {
    CYCLE_CREATED: 'CycleCreated',
    FEED_PURCHASE_CREATED: 'FeedPurchaseCreated',
    MEDICATION_LOG_CREATED: 'MedicationLogCreated',
} as const;

export type DomainEventType =
    (typeof DOMAIN_EVENT_TYPES)[keyof typeof DOMAIN_EVENT_TYPES];

export interface CycleCreatedPayload {
    cycleId: string;
    expenseDate: string;
    amount: number;
}

export interface FeedPurchaseCreatedPayload {
    cycleId: string;
    purchaseId: string;
    purchaseDate: string;
    amount: number;
}

export interface MedicationLogCreatedPayload {
    cycleId: string;
    medicationLogId: string;
    date: string;
}

export interface DomainEventPayloadMap {
    [DOMAIN_EVENT_TYPES.CYCLE_CREATED]: CycleCreatedPayload;
    [DOMAIN_EVENT_TYPES.FEED_PURCHASE_CREATED]: FeedPurchaseCreatedPayload;
    [DOMAIN_EVENT_TYPES.MEDICATION_LOG_CREATED]: MedicationLogCreatedPayload;
}

export type DomainEvent<K extends DomainEventType = DomainEventType> = {
    type: K;
    payload: DomainEventPayloadMap[K];
};