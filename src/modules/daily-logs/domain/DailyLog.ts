import { FeedType } from '../../feed/domain/FeedPurchase';

export interface DailyLog {
    id: string;
    cycleId: string;
    date: string;
    deaths: number;
    feedType: FeedType;
    feedConsumedKg: number;
    temperature: number | null;
    humidity: number | null;
    waterConsumedLiters: number | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AddDailyLogInput {
    cycleId: string;
    date: string;
    deaths: number;
    feedType: FeedType;
    feedConsumedKg: number;
    temperature?: number | null;
    humidity?: number | null;
    waterConsumedLiters?: number | null;
    notes?: string | null;
}