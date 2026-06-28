export type FeedType = 'STARTER' | 'GROWER' | 'FINISHER';

export interface FeedPurchase {
  id: string;
  cycleId: string;
  purchaseDate: string;
  feedType: FeedType;
  quantityKg: number;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedBalance {
  feedType: FeedType;
  quantityKg: number;
}

export interface AddFeedPurchaseInput {
  cycleId: string;
  purchaseDate: string;
  feedType: FeedType;
  quantityKg: number;
  unitPrice: number;
}