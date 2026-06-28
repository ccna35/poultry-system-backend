import { Expense } from '../../expenses/domain/Expense';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { nowIso, toDateOnly } from '../../../shared/utils/date';
import { generateId } from '../../../shared/utils/id';
import { CycleService } from '../../cycles/services/CycleService';
import { AddFeedPurchaseInput, FeedBalance, FeedPurchase, FeedType } from '../domain/FeedPurchase';
import { FeedRepository } from '../repositories/FeedRepository';

const FEED_TYPES: FeedType[] = ['STARTER', 'GROWER', 'FINISHER'];

export class FeedService {
    constructor(
        private readonly feedRepository: FeedRepository,
        private readonly cycleService: CycleService,
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

        const expense: Expense = {
            id: generateId(),
            cycleId: purchase.cycleId,
            expenseDate: purchase.purchaseDate,
            category: 'FEED',
            amount: purchase.quantityKg * purchase.unitPrice,
            description: 'Automatic feed expense from feed purchase',
            sourceType: 'FEED_PURCHASE',
            sourceId: purchase.id,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        return this.feedRepository.createWithInventoryAndExpense(purchase, expense);
    }

    async listFeedPurchasesByCycle(cycleId: string): Promise<FeedPurchase[]> {
        await this.cycleService.getCycleById(cycleId);
        return this.feedRepository.listByCycle(cycleId);
    }

    async listFeedBalancesByCycle(cycleId: string): Promise<FeedBalance[]> {
        await this.cycleService.getCycleById(cycleId);

        const storedBalances = await this.feedRepository.listBalancesByCycle(cycleId);
        const balancesByType = new Map(
            storedBalances.map((balance) => [balance.feedType, balance.quantityKg]),
        );

        return FEED_TYPES.map((feedType) => ({
            feedType,
            quantityKg: balancesByType.get(feedType) ?? 0,
        }));
    }
}