import { Router } from 'express';

import { CycleController } from './modules/cycles/controllers/CycleController';
import { InMemoryCycleRepository } from './modules/cycles/repositories/InMemoryCycleRepository';
import { createCycleRouter } from './modules/cycles/routes/cycle.routes';
import { CycleService } from './modules/cycles/services/CycleService';
import { DailyLogController } from './modules/daily-logs/controllers/DailyLogController';
import { InMemoryDailyLogRepository } from './modules/daily-logs/repositories/InMemoryDailyLogRepository';
import { createDailyLogRouter } from './modules/daily-logs/routes/daily-log.routes';
import { DailyLogService } from './modules/daily-logs/services/DailyLogService';
import { DashboardController } from './modules/dashboard/controllers/DashboardController';
import { createDashboardRouter } from './modules/dashboard/routes/dashboard.routes';
import { DashboardService } from './modules/dashboard/services/DashboardService';
import { ExpenseController } from './modules/expenses/controllers/ExpenseController';
import { registerExpenseEventHandlers } from './modules/expenses/handlers/expense.event-handlers';
import { InMemoryExpenseRepository } from './modules/expenses/repositories/InMemoryExpenseRepository';
import { createExpenseRouter } from './modules/expenses/routes/expense.routes';
import { ExpenseService } from './modules/expenses/services/ExpenseService';
import { FeedController } from './modules/feed/controllers/FeedController';
import { InMemoryFeedRepository } from './modules/feed/repositories/InMemoryFeedRepository';
import { createFeedRouter } from './modules/feed/routes/feed.routes';
import { FeedService } from './modules/feed/services/FeedService';
import { MedicationController } from './modules/medication/controllers/MedicationController';
import { InMemoryMedicationRepository } from './modules/medication/repositories/InMemoryMedicationRepository';
import { createMedicationRouter } from './modules/medication/routes/medication.routes';
import { MedicationService } from './modules/medication/services/MedicationService';
import { SalesController } from './modules/sales/controllers/SalesController';
import { InMemorySaleRepository } from './modules/sales/repositories/InMemorySaleRepository';
import { createSalesRouter } from './modules/sales/routes/sales.routes';
import { SalesService } from './modules/sales/services/SalesService';
import { WeightController } from './modules/weight/controllers/WeightController';
import { InMemoryWeightRepository } from './modules/weight/repositories/InMemoryWeightRepository';
import { createWeightRouter } from './modules/weight/routes/weight.routes';
import { WeightService } from './modules/weight/services/WeightService';
import { EventBus } from './shared/events/EventBus';

export type CompositionRoot = {
    apiRouter: Router;
};

export const createCompositionRoot = async (): Promise<CompositionRoot> => {
    const eventBus = new EventBus();

    const cycleRepository = new InMemoryCycleRepository();
    const dailyLogRepository = new InMemoryDailyLogRepository();
    const feedRepository = new InMemoryFeedRepository();
    const weightRepository = new InMemoryWeightRepository();
    const medicationRepository = new InMemoryMedicationRepository();
    const expenseRepository = new InMemoryExpenseRepository();
    const saleRepository = new InMemorySaleRepository();

    const cycleService = new CycleService(cycleRepository, eventBus);
    const dailyLogService = new DailyLogService(dailyLogRepository, cycleService);
    const feedService = new FeedService(feedRepository, cycleService, eventBus);
    const weightService = new WeightService(weightRepository, cycleService);
    const medicationService = new MedicationService(
        medicationRepository,
        cycleService,
        eventBus,
    );
    const expenseService = new ExpenseService(expenseRepository, cycleService);
    const salesService = new SalesService(
        saleRepository,
        cycleService,
        dailyLogService,
    );
    const dashboardService = new DashboardService(
        cycleService,
        dailyLogService,
        weightService,
        expenseService,
        salesService,
    );

    registerExpenseEventHandlers(eventBus, expenseService);

    await seedRealisticData({
        cycleService,
        dailyLogService,
        feedService,
        weightService,
        medicationService,
        expenseService,
    });

    const cycleController = new CycleController(cycleService);
    const dailyLogController = new DailyLogController(dailyLogService);
    const feedController = new FeedController(feedService);
    const weightController = new WeightController(weightService);
    const medicationController = new MedicationController(medicationService);
    const expenseController = new ExpenseController(expenseService);
    const salesController = new SalesController(salesService);
    const dashboardController = new DashboardController(dashboardService);

    const apiRouter = Router();

    apiRouter.use('/cycles', createCycleRouter(cycleController));
    apiRouter.use(
        '/cycles/:cycleId/daily-logs',
        createDailyLogRouter(dailyLogController),
    );
    apiRouter.use('/cycles/:cycleId/feed-purchases', createFeedRouter(feedController));
    apiRouter.use('/cycles/:cycleId/weight-logs', createWeightRouter(weightController));
    apiRouter.use(
        '/cycles/:cycleId/medication-logs',
        createMedicationRouter(medicationController),
    );
    apiRouter.use('/cycles/:cycleId/expenses', createExpenseRouter(expenseController));
    apiRouter.use('/cycles/:cycleId/sales', createSalesRouter(salesController));
    apiRouter.use('/cycles/:cycleId', createDashboardRouter(dashboardController));

    return {
        apiRouter,
    };
};

type SeedServices = {
    cycleService: CycleService;
    dailyLogService: DailyLogService;
    feedService: FeedService;
    weightService: WeightService;
    medicationService: MedicationService;
    expenseService: ExpenseService;
};

const seedRealisticData = async ({
    cycleService,
    dailyLogService,
    feedService,
    weightService,
    medicationService,
    expenseService,
}: SeedServices): Promise<void> => {
    const cycle = await cycleService.createCycle({
        name: 'دورة شهر 6 عام 2026',
        startDate: '2026-06-01',
        initialBirds: 1000,
        chickPrice: 1.8,
        expectedFinalWeightKg: 2.25,
        expectedSellingPricePerKg: 3.2,
        expectedRemainingCost: 950,
    });

    const seededDailyLogs = [
        { date: '2026-06-02', deaths: 4, feedConsumedKg: 65, temperature: 31, humidity: 55, notes: 'Strong appetite observed' },
        { date: '2026-06-03', deaths: 2, feedConsumedKg: 72, temperature: 30, humidity: 58, notes: 'Stable flock behavior' },
        { date: '2026-06-04', deaths: 3, feedConsumedKg: 78, temperature: 30, humidity: 57, notes: 'Normal activity' },
        { date: '2026-06-05', deaths: 2, feedConsumedKg: 84, temperature: 29, humidity: 56, notes: 'Good feed conversion signs' },
        { date: '2026-06-06', deaths: 1, feedConsumedKg: 91, temperature: 29, humidity: 54, notes: 'Ventilation adjusted' },
        { date: '2026-06-07', deaths: 2, feedConsumedKg: 99, temperature: 30, humidity: 53, notes: 'Starter phase closing' },
        { date: '2026-06-08', deaths: 1, feedConsumedKg: 108, temperature: 29, humidity: 52, notes: 'Transition to grower feed' },
        { date: '2026-06-09', deaths: 2, feedConsumedKg: 116, temperature: 28, humidity: 54, notes: 'Mild weather' },
        { date: '2026-06-10', deaths: 1, feedConsumedKg: 124, temperature: 28, humidity: 55, notes: 'Steady growth' },
        { date: '2026-06-11', deaths: 1, feedConsumedKg: 132, temperature: 29, humidity: 56, notes: 'Routine checks complete' },
        { date: '2026-06-12', deaths: 2, feedConsumedKg: 140, temperature: 30, humidity: 57, notes: 'Humidity spike managed' },
        { date: '2026-06-13', deaths: 1, feedConsumedKg: 149, temperature: 29, humidity: 55, notes: 'Flock stable' },
        { date: '2026-06-14', deaths: 1, feedConsumedKg: 158, temperature: 28, humidity: 54, notes: 'Uniform bird size improving' },
        { date: '2026-06-15', deaths: 2, feedConsumedKg: 166, temperature: 29, humidity: 53, notes: 'Additional litter maintenance' },
        { date: '2026-06-16', deaths: 1, feedConsumedKg: 175, temperature: 30, humidity: 52, notes: 'Slight heat stress monitored' },
        { date: '2026-06-17', deaths: 1, feedConsumedKg: 184, temperature: 30, humidity: 51, notes: 'Water lines flushed' },
        { date: '2026-06-18', deaths: 2, feedConsumedKg: 194, temperature: 29, humidity: 53, notes: 'Good appetite throughout day' },
        { date: '2026-06-19', deaths: 1, feedConsumedKg: 203, temperature: 28, humidity: 54, notes: 'Low mortality maintained' },
        { date: '2026-06-20', deaths: 1, feedConsumedKg: 212, temperature: 28, humidity: 55, notes: 'Preparation for finisher stage' },
        { date: '2026-06-21', deaths: 1, feedConsumedKg: 220, temperature: 29, humidity: 56, notes: 'Healthy flock condition' },
    ];

    for (const dailyLog of seededDailyLogs) {
        await dailyLogService.addDailyLog({
            cycleId: cycle.id,
            ...dailyLog,
        });
    }

    const seededFeedPurchases = [
        { purchaseDate: '2026-06-02', feedType: 'STARTER' as const, quantityKg: 450, unitPrice: 0.62 },
        { purchaseDate: '2026-06-09', feedType: 'GROWER' as const, quantityKg: 900, unitPrice: 0.68 },
        { purchaseDate: '2026-06-17', feedType: 'FINISHER' as const, quantityKg: 1000, unitPrice: 0.74 },
    ];

    for (const feedPurchase of seededFeedPurchases) {
        await feedService.addFeedPurchase({
            cycleId: cycle.id,
            ...feedPurchase,
        });
    }

    const seededWeightLogs = [
        { date: '2026-06-04', sampleSize: 35, averageWeightKg: 0.25, notes: 'Early growth normal' },
        { date: '2026-06-06', sampleSize: 40, averageWeightKg: 0.36, notes: 'Starter feed response good' },
        { date: '2026-06-08', sampleSize: 40, averageWeightKg: 0.52, notes: 'Growth on track' },
        { date: '2026-06-10', sampleSize: 42, averageWeightKg: 0.69, notes: 'Uniformity improving' },
        { date: '2026-06-12', sampleSize: 45, averageWeightKg: 0.85, notes: 'Strong gain in grower phase' },
        { date: '2026-06-14', sampleSize: 45, averageWeightKg: 1.01, notes: 'Feed intake supports target curve' },
        { date: '2026-06-16', sampleSize: 48, averageWeightKg: 1.17, notes: 'Good body frame development' },
        { date: '2026-06-18', sampleSize: 50, averageWeightKg: 1.34, notes: 'Flock near expected benchmark' },
        { date: '2026-06-20', sampleSize: 50, averageWeightKg: 1.51, notes: 'Finisher stage progression stable' },
        { date: '2026-06-21', sampleSize: 52, averageWeightKg: 1.62, notes: 'Latest measured average weight' },
    ];

    for (const weightLog of seededWeightLogs) {
        await weightService.addWeightLog({
            cycleId: cycle.id,
            ...weightLog,
        });
    }

    const seededMedicationLogs = [
        { date: '2026-06-04', medicineName: 'Vitamin Complex', dosage: '1 ml per liter', cost: 45, notes: 'Administered for stress support' },
        { date: '2026-06-11', medicineName: 'Coccidiostat', dosage: '0.5 g per liter', cost: 62, notes: 'Preventive schedule dose' },
        { date: '2026-06-18', medicineName: 'Electrolyte Booster', dosage: '1 g per liter', cost: 38, notes: 'Heat stress support' },
    ];

    for (const medicationLog of seededMedicationLogs) {
        await medicationService.addMedicationLog({
            cycleId: cycle.id,
            ...medicationLog,
        });
    }

    const seededManualExpenses = [
        { expenseDate: '2026-06-05', category: 'ELECTRICITY' as const, amount: 120, description: 'Brooder heating and lighting' },
        { expenseDate: '2026-06-10', category: 'LABOR' as const, amount: 180, description: 'Worker wages - week 1' },
        { expenseDate: '2026-06-14', category: 'TRANSPORT' as const, amount: 95, description: 'Feed transport and handling' },
        { expenseDate: '2026-06-19', category: 'LABOR' as const, amount: 180, description: 'Worker wages - week 2' },
        { expenseDate: '2026-06-21', category: 'MISC' as const, amount: 70, description: 'Equipment maintenance and supplies' },
    ];

    for (const manualExpense of seededManualExpenses) {
        await expenseService.addManualExpense({
            cycleId: cycle.id,
            ...manualExpense,
        });
    }
};