import { ValidationError } from '../../../shared/errors/ValidationError';
import { EventBus } from '../../../shared/events/EventBus';
import { DOMAIN_EVENT_TYPES } from '../../../shared/events/domain-events';
import { nowIso, toDateOnly } from '../../../shared/utils/date';
import { generateId } from '../../../shared/utils/id';
import { CycleService } from '../../cycles/services/CycleService';
import { AddFeedPurchaseInput, FeedPurchase } from '../domain/FeedPurchase';
import { FeedRepository } from '../repositories/FeedRepository';

export class FeedService {
    constructor(
        private readonly feedRepository: FeedRepository,
        private readonly cycleService: CycleService,
        private readonly eventBus: EventBus,
    ) { }

    async addFeedPurchase(input: AddFeedPurchaseInput): Promise<FeedPurchase> {
        if (input.quantityKg <= 0) {
            throw new ValidationError('quantityKg must be greater than 0');
        }

        if (input.unitPrice < 0) {
            throw new ValidationError('unitPrice cannot be negative');
        }

        await this.cycleService.ensureCycleIsActive(input.cycleId);

        const timestamp = nowIso();
        const purchase: FeedPurchase = {
            id: generateId(),
            cycleId: input.cycleId,
            purchaseDate: toDateOnly(input.purchaseDate),
            feedType: input.feedType,
            quantityKg: input.quantityKg,
            unitPrice: input.unitPrice,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        const createdPurchase = await this.feedRepository.create(purchase);

        await this.eventBus.publish(DOMAIN_EVENT_TYPES.FEED_PURCHASE_CREATED, {
            cycleId: createdPurchase.cycleId,
            purchaseId: createdPurchase.id,
            purchaseDate: createdPurchase.purchaseDate,
            amount: createdPurchase.quantityKg * createdPurchase.unitPrice,
        });

        return createdPurchase;
    }

    async listFeedPurchasesByCycle(cycleId: string): Promise<FeedPurchase[]> {
        await this.cycleService.getCycleById(cycleId);
        return this.feedRepository.listByCycle(cycleId);
    }
}
