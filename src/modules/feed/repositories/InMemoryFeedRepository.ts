import { Expense } from '../../expenses/domain/Expense';
import {
    FeedBalance,
    FeedInventoryMovement,
    FeedPurchase,
    FeedType,
} from '../domain/FeedPurchase';
import { FeedRepository } from './FeedRepository';

const FEED_TYPES: FeedType[] = ['STARTER', 'GROWER', 'FINISHER'];

export class InMemoryFeedRepository implements FeedRepository {
    private readonly purchases: FeedPurchase[];
    private readonly movements: FeedInventoryMovement[] = [];
    private readonly balances = new Map<string, number>();

    constructor(seedData: FeedPurchase[] = []) {
        this.purchases = [...seedData];
    }

    async create(feedPurchase: FeedPurchase): Promise<FeedPurchase> {
        this.purchases.push(feedPurchase);
        return feedPurchase;
    }

    async createWithInventoryAndExpense(
        feedPurchase: FeedPurchase,
        _expense: Expense,
    ): Promise<FeedPurchase> {
        this.purchases.push(feedPurchase);
        this.movements.push({
            id: feedPurchase.id,
            cycleId: feedPurchase.cycleId,
            movementDate: feedPurchase.purchaseDate,
            feedType: feedPurchase.feedType,
            movementType: 'PURCHASE',
            quantityKg: feedPurchase.quantityKg,
            referenceType: 'FEED_PURCHASE',
            referenceId: feedPurchase.id,
            notes: 'Automatic inventory increase from feed purchase',
            createdAt: feedPurchase.createdAt,
            updatedAt: feedPurchase.updatedAt,
        });

        const key = this.getBalanceKey(feedPurchase.cycleId, feedPurchase.feedType);
        const currentBalance = this.balances.get(key) ?? 0;
        this.balances.set(key, currentBalance + feedPurchase.quantityKg);

        return feedPurchase;
    }

    async listByCycle(cycleId: string): Promise<FeedPurchase[]> {
        return this.purchases
            .filter((purchase) => purchase.cycleId === cycleId)
            .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));
    }

    async listBalancesByCycle(cycleId: string): Promise<FeedBalance[]> {
        return FEED_TYPES.map((feedType) => ({
            feedType,
            quantityKg: this.balances.get(this.getBalanceKey(cycleId, feedType)) ?? 0,
        }));
    }

    async listMovementsByCycle(cycleId: string): Promise<FeedInventoryMovement[]> {
        return this.movements
            .filter((movement) => movement.cycleId === cycleId)
            .sort((a, b) => a.movementDate.localeCompare(b.movementDate));
    }

    private getBalanceKey(cycleId: string, feedType: FeedType): string {
        return `${cycleId}:${feedType}`;
    }
}
