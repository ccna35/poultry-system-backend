import { Expense } from '../../expenses/domain/Expense';
import {
    FeedBalance,
    FeedInventoryMovement,
    FeedPurchase,
} from '../domain/FeedPurchase';

export interface FeedRepository {
    create(feedPurchase: FeedPurchase): Promise<FeedPurchase>;
    createWithInventoryAndExpense(
        feedPurchase: FeedPurchase,
        expense: Expense,
    ): Promise<FeedPurchase>;
    listByCycle(cycleId: string): Promise<FeedPurchase[]>;
    listBalancesByCycle(cycleId: string): Promise<FeedBalance[]>;
    listMovementsByCycle(cycleId: string): Promise<FeedInventoryMovement[]>;
}
