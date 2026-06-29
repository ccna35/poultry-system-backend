export type FeedType = 'STARTER' | 'GROWER' | 'FINISHER';
export type FeedInventoryMovementType = 'PURCHASE' | 'CONSUMPTION' | 'ADJUSTMENT';
export type FeedInventoryReferenceType =
  | 'FEED_PURCHASE'
  | 'DAILY_LOG'
  | 'MANUAL'
  | 'SYSTEM';

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

export interface FeedInventoryMovement {
  id: string;
  cycleId: string;
  movementDate: string;
  feedType: FeedType;
  movementType: FeedInventoryMovementType;
  quantityKg: number;
  referenceType: FeedInventoryReferenceType | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddFeedPurchaseInput {
  cycleId: string;
  purchaseDate: string;
  feedType: FeedType;
  quantityKg: number;
  unitPrice: number;
}
