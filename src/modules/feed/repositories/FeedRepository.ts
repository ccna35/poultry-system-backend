import { FeedPurchase } from '../domain/FeedPurchase';

export interface FeedRepository {
    create(feedPurchase: FeedPurchase): Promise<FeedPurchase>;
    listByCycle(cycleId: string): Promise<FeedPurchase[]>;
}
