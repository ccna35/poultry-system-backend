import { diffInDaysInclusive } from '../../../shared/utils/date';
import { CycleService } from '../../cycles/services/CycleService';
import { DailyLogService } from '../../daily-logs/services/DailyLogService';
import { ExpenseService } from '../../expenses/services/ExpenseService';
import { SalesService } from '../../sales/services/SalesService';
import { WeightService } from '../../weight/services/WeightService';

type NullableNumber = number | null;

export interface ChartPoint {
    date: string;
    value: number | null;
}

export interface DashboardCharts {
    deaths: ChartPoint[];
    temperature: ChartPoint[];
    humidity: ChartPoint[];
    feedConsumedKg: ChartPoint[];
    averageWeightKg: ChartPoint[];
}

export interface DashboardResponse {
    cycleId: string;
    cycleName: string;
    cycleStatus: 'ACTIVE' | 'COMPLETED';
    currentDay: number;
    initialBirds: number;
    totalDeaths: number;
    remainingBirds: number;
    mortalityRate: number;
    totalFeedConsumedKg: number;
    latestAverageWeightKg: NullableNumber;
    feedCost: number;
    medicationCost: number;
    otherExpenses: number;
    totalExpenses: number;
    estimatedRevenue: number;
    estimatedProfit: number;
    actualRevenue: NullableNumber;
    actualProfit: NullableNumber;
    fcrEstimate: NullableNumber;
    actualFcr: NullableNumber;
    charts: DashboardCharts;
}

export class DashboardService {
    constructor(
        private readonly cycleService: CycleService,
        private readonly dailyLogService: DailyLogService,
        private readonly weightService: WeightService,
        private readonly expenseService: ExpenseService,
        private readonly salesService: SalesService,
    ) { }

    async getDashboardByCycle(cycleId: string): Promise<DashboardResponse> {
        const cycle = await this.cycleService.getCycleById(cycleId);
        const dailyLogs = await this.dailyLogService.listDailyLogsByCycle(cycleId);
        const weightLogs = await this.weightService.listWeightLogsByCycle(cycleId);
        const latestWeight = await this.weightService.getLatestWeightByCycle(cycleId);
        const sale = await this.salesService.getSaleByCycle(cycleId);

        const totalDeaths = dailyLogs.reduce((sum, log) => sum + log.deaths, 0);
        const remainingBirds = Math.max(0, cycle.initialBirds - totalDeaths);
        const mortalityRate =
            cycle.initialBirds > 0 ? (totalDeaths / cycle.initialBirds) * 100 : 0;

        const totalFeedConsumedKg = dailyLogs.reduce(
            (sum, log) => sum + log.feedConsumedKg,
            0,
        );

        const feedCost = await this.expenseService.getCategoryTotalByCycle(cycleId, 'FEED');
        const medicationCost = await this.expenseService.getCategoryTotalByCycle(
            cycleId,
            'MEDICATION',
        );
        const totalExpenses = await this.expenseService.getTotalExpensesByCycle(cycleId);
        const otherExpenses = totalExpenses - feedCost - medicationCost;

        const estimatedRevenue =
            remainingBirds *
            cycle.expectedFinalWeightKg *
            cycle.expectedSellingPricePerKg;

        const estimatedProfit =
            estimatedRevenue - (totalExpenses + cycle.expectedRemainingCost);

        const actualRevenue = sale
            ? sale.totalWeightKg * sale.pricePerKg
            : null;

        const actualProfit =
            actualRevenue !== null ? actualRevenue - totalExpenses : null;

        const latestAverageWeightKg = latestWeight?.averageWeightKg ?? null;

        const fcrEstimate = this.safeDivide(
            totalFeedConsumedKg,
            remainingBirds * (latestAverageWeightKg ?? 0),
        );

        const actualFcr = sale
            ? this.safeDivide(totalFeedConsumedKg, sale.totalWeightKg)
            : null;

        const endDate = cycle.endDate ?? new Date().toISOString();
        const currentDay = diffInDaysInclusive(cycle.startDate, endDate);

        const charts: DashboardCharts = {
            deaths: dailyLogs.map((dailyLog) => ({
                date: dailyLog.date,
                value: dailyLog.deaths,
            })),
            temperature: dailyLogs.map((dailyLog) => ({
                date: dailyLog.date,
                value: dailyLog.temperature,
            })),
            humidity: dailyLogs.map((dailyLog) => ({
                date: dailyLog.date,
                value: dailyLog.humidity,
            })),
            feedConsumedKg: dailyLogs.map((dailyLog) => ({
                date: dailyLog.date,
                value: dailyLog.feedConsumedKg,
            })),
            averageWeightKg: weightLogs.map((weightLog) => ({
                date: weightLog.date,
                value: weightLog.averageWeightKg,
            })),
        };

        return {
            cycleId: cycle.id,
            cycleName: cycle.name,
            cycleStatus: cycle.status,
            currentDay,
            initialBirds: cycle.initialBirds,
            totalDeaths,
            remainingBirds,
            mortalityRate,
            totalFeedConsumedKg,
            latestAverageWeightKg,
            feedCost,
            medicationCost,
            otherExpenses,
            totalExpenses,
            estimatedRevenue,
            estimatedProfit,
            actualRevenue,
            actualProfit,
            fcrEstimate,
            actualFcr,
            charts,
        };
    }

    private safeDivide(numerator: number, denominator: number): number | null {
        if (denominator <= 0) {
            return null;
        }

        return numerator / denominator;
    }
}


