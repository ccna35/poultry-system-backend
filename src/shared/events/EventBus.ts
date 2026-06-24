import {
    DomainEvent,
    DomainEventPayloadMap,
    DomainEventType,
} from './domain-events';

type EventHandler<K extends DomainEventType> = (
    event: DomainEvent<K>,
) => Promise<void> | void;

export class EventBus {
    private readonly handlers = new Map<DomainEventType, EventHandler<any>[]>();

    subscribe<K extends DomainEventType>(
        eventType: K,
        handler: EventHandler<K>,
    ): void {
        const existingHandlers = this.handlers.get(eventType) ?? [];
        existingHandlers.push(handler);
        this.handlers.set(eventType, existingHandlers);
    }

    async publish<K extends DomainEventType>(
        type: K,
        payload: DomainEventPayloadMap[K],
    ): Promise<void> {
        const handlers = this.handlers.get(type) ?? [];

        for (const handler of handlers) {
            await handler({ type, payload });
        }
    }
}