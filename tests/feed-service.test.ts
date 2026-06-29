import { describe, expect, it } from 'vitest';

import { InMemoryCycleRepository } from '../src/modules/cycles/repositories/InMemoryCycleRepository';
import { CycleService } from '../src/modules/cycles/services/CycleService';
import { InMemoryFeedRepository } from '../src/modules/feed/repositories/InMemoryFeedRepository';
import { FeedService } from '../src/modules/feed/services/FeedService';

describe('FeedService', () => {
    it('lists inventory movements after creating a feed purchase', async () => {
        const cycleService = new CycleService(new InMemoryCycleRepository());
        const feedService = new FeedService(
            new InMemoryFeedRepository(),
            cycleService,
        );

        const cycle = await cycleService.createCycle({
            name: 'Test cycle',
            startDate: '2026-06-01',
            initialBirds: 100,
            chickPrice: 2,
            expectedFinalWeightKg: 2.1,
            expectedSellingPricePerKg: 3.2,
            expectedRemainingCost: 50,
        });

        const purchase = await feedService.addFeedPurchase({
            cycleId: cycle.id,
            purchaseDate: '2026-06-02',
            feedType: 'STARTER',
            quantityKg: 120,
            unitPrice: 0.62,
        });

        await expect(feedService.listFeedBalancesByCycle(cycle.id)).resolves.toEqual([
            { feedType: 'STARTER', quantityKg: 120 },
            { feedType: 'GROWER', quantityKg: 0 },
            { feedType: 'FINISHER', quantityKg: 0 },
        ]);

        await expect(feedService.listFeedMovementsByCycle(cycle.id)).resolves.toEqual([
            expect.objectContaining({
                id: purchase.id,
                cycleId: cycle.id,
                movementDate: '2026-06-02',
                feedType: 'STARTER',
                movementType: 'PURCHASE',
                quantityKg: 120,
                referenceType: 'FEED_PURCHASE',
                referenceId: purchase.id,
                notes: 'Automatic inventory increase from feed purchase',
            }),
        ]);
    });
});
