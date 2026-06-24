import { FeedPurchase } from '../domain/FeedPurchase';
import { FeedRepository } from './FeedRepository';

export class InMemoryFeedRepository implements FeedRepository {
    private readonly purchases: FeedPurchase[];

    constructor(seedData: FeedPurchase[] = []) {
        this.purchases = [...seedData];
    }

    async create(feedPurchase: FeedPurchase): Promise<FeedPurchase> {
        this.purchases.push(feedPurchase);
        return feedPurchase;
    }

    async listByCycle(cycleId: string): Promise<FeedPurchase[]> {
        return this.purchases
            .filter((purchase) => purchase.cycleId === cycleId)
            .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));
    }
}
