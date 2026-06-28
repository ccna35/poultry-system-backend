import { describe, expect, it } from 'vitest';

import { ConflictError } from '../src/shared/errors/ConflictError';
import { InMemoryCycleRepository } from '../src/modules/cycles/repositories/InMemoryCycleRepository';
import { CycleService } from '../src/modules/cycles/services/CycleService';

describe('CycleService', () => {
    it('creates a cycle and blocks a second active cycle', async () => {
        const cycleService = new CycleService(new InMemoryCycleRepository());

        const firstCycle = await cycleService.createCycle({
            name: 'Test cycle',
            startDate: '2026-06-01',
            initialBirds: 100,
            chickPrice: 2,
            expectedFinalWeightKg: 2.1,
            expectedSellingPricePerKg: 3.2,
            expectedRemainingCost: 50,
        });

        expect(firstCycle.status).toBe('ACTIVE');

        await expect(
            cycleService.createCycle({
                name: 'Second cycle',
                startDate: '2026-06-02',
                initialBirds: 80,
                chickPrice: 2,
                expectedFinalWeightKg: 2.1,
                expectedSellingPricePerKg: 3.2,
                expectedRemainingCost: 50,
            }),
        ).rejects.toBeInstanceOf(ConflictError);
    });
});