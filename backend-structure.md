Build a Poultry Farm Management System MVP backend using Node.js, Express.js, and TypeScript.

Architecture:
Use a modular monolith architecture with clean separation between:

- Domain models/types
- Repository interfaces
- In-memory repository implementations
- Services/use cases
- Controllers
- Routes
- Shared infrastructure
- Manual Dependency Injection through a composition root

Do NOT use a real database yet.
Use in-memory storage only.
However, design the code so that I can later replace the in-memory repositories with PostgreSQL + Prisma without changing the services or controllers.

Important architectural rules:

- Services must depend on repository interfaces, not concrete implementations.
- Repositories must hide storage details.
- Controllers must not contain business logic.
- Controllers call services only.
- Services can call other services when they need immediate validation/data.
- Services should publish domain events for side effects.
- Do not call repositories from another module directly.
- Do not use HTTP calls between modules.
- Use constructor-based Dependency Injection.
- Keep all object wiring in one composition root file.
- Avoid global mutable service instances except inside the composition root.

Tech stack:

- Node.js
- Express.js
- TypeScript
- No database
- No Prisma yet
- No ORM yet
- In-memory arrays/maps for persistence
- Use Zod or simple validation middleware for request validation
- Use Vitest for unit tests if tests are included

MVP modules:

1. Cycles Module
   Responsible for production cycles.

Cycle fields:

- id
- name
- startDate
- endDate nullable
- status: ACTIVE | COMPLETED
- initialBirds
- chickPrice
- expectedFinalWeightKg
- expectedSellingPricePerKg
- expectedRemainingCost
- createdAt
- updatedAt

Cycle use cases:

- createCycle
- getCycleById
- getActiveCycle
- completeCycle
- listCycles

Business rules:

- Only one active cycle is allowed for MVP.
- initialBirds must be greater than 0.
- chickPrice cannot be negative.
- expectedFinalWeightKg must be greater than 0.
- expectedSellingPricePerKg cannot be negative.
- Cannot add operational records to completed cycles.

2. Daily Operations Module
   Represents daily farm activity.

DailyLog fields:

- id
- cycleId
- date
- deaths
- feedConsumedKg
- temperature nullable
- humidity nullable
- notes nullable
- createdAt
- updatedAt

Use cases:

- addDailyLog
- listDailyLogsByCycle

Business rules:

- cycle must exist and be ACTIVE.
- date must be unique per cycle.
- deaths cannot be negative.
- feedConsumedKg cannot be negative.
- total deaths cannot exceed initial birds.

DailyLogService should call CycleService for cycle validation.

3. Feed Module
   Represents feed purchases.

FeedPurchase fields:

- id
- cycleId
- purchaseDate
- feedType: STARTER | GROWER | FINISHER
- quantityKg
- unitPrice
- createdAt
- updatedAt

Use cases:

- addFeedPurchase
- listFeedPurchasesByCycle

Business rules:

- cycle must exist and be ACTIVE.
- quantityKg must be greater than 0.
- unitPrice cannot be negative.

When a feed purchase is created, publish a domain event:
FeedPurchaseCreated

The Expenses module should listen to this event and create an automatic FEED expense.

4. Weight Tracking Module

WeightLog fields:

- id
- cycleId
- date
- sampleSize
- averageWeightKg
- notes nullable
- createdAt
- updatedAt

Use cases:

- addWeightLog
- listWeightLogsByCycle
- getLatestWeightByCycle

Business rules:

- cycle must exist and be ACTIVE.
- sampleSize must be greater than 0.
- averageWeightKg must be greater than 0.

5. Medication Module

MedicationLog fields:

- id
- cycleId
- date
- medicineName
- dosage
- cost
- notes nullable
- createdAt
- updatedAt

Use cases:

- addMedicationLog
- listMedicationLogsByCycle

Business rules:

- cycle must exist and be ACTIVE.
- medicineName is required.
- cost cannot be negative.

When a medication log is created, publish a domain event:
MedicationLogCreated

The Expenses module should listen to this event and create an automatic MEDICATION expense.

6. Expenses Module

Expense fields:

- id
- cycleId
- expenseDate
- category: CHICKS | FEED | MEDICATION | LABOR | ELECTRICITY | TRANSPORT | MISC | OTHER
- amount
- description nullable
- sourceType nullable: MANUAL | FEED_PURCHASE | MEDICATION_LOG | SYSTEM
- sourceId nullable
- createdAt
- updatedAt

Use cases:

- addManualExpense
- addSystemExpense
- listExpensesByCycle
- getTotalExpensesByCycle
- getExpensesBreakdownByCycle

Business rules:

- amount cannot be negative.
- Feed purchases and medication logs should create expenses automatically through event handlers.
- When a cycle is created, create an automatic CHICKS expense:
  initialBirds \* chickPrice

7. Sales Module

Sale fields:

- id
- cycleId
- saleDate
- birdsSold
- averageSellingWeightKg
- pricePerKg
- createdAt
- updatedAt

Use cases:

- createSale
- getSaleByCycle

Business rules:

- cycle must exist and be ACTIVE.
- birdsSold must be greater than 0.
- birdsSold cannot exceed remaining birds.
- averageSellingWeightKg must be greater than 0.
- pricePerKg cannot be negative.
- Only one sale per cycle in MVP.
- After sale is created, complete the cycle.

SalesService should call:

- CycleService
- DailyLogService or a reporting/calculation service to get remaining birds

8. Dashboard / Reports Module

This module should not own data.
It should calculate KPIs by reading from other services.

Dashboard response should include:

- cycleId
- cycleName
- cycleStatus
- currentDay
- initialBirds
- totalDeaths
- remainingBirds
- mortalityRate
- totalFeedConsumedKg
- latestAverageWeightKg
- feedCost
- medicationCost
- otherExpenses
- totalExpenses
- estimatedRevenue
- estimatedProfit
- actualRevenue nullable
- actualProfit nullable
- fcrEstimate nullable
- actualFcr nullable

Calculations:
remainingBirds =
initialBirds - totalDeaths

mortalityRate =
totalDeaths / initialBirds \* 100

totalFeedConsumedKg =
sum of dailyLogs.feedConsumedKg

feedCost =
sum of FEED expenses

medicationCost =
sum of MEDICATION expenses

otherExpenses =
sum of all expenses except FEED and MEDICATION

totalExpenses =
sum of all expenses

estimatedRevenue =
remainingBirds _ expectedFinalWeightKg _ expectedSellingPricePerKg

estimatedProfit =
estimatedRevenue - (totalExpenses + expectedRemainingCost)

actualRevenue =
birdsSold _ averageSellingWeightKg _ pricePerKg

actualProfit =
actualRevenue - totalExpenses

fcrEstimate =
totalFeedConsumedKg / (remainingBirds \* latestAverageWeightKg)

actualFcr =
totalFeedConsumedKg / (birdsSold \* averageSellingWeightKg)

Handle division by zero safely and return null when a KPI cannot be calculated.

Project structure:

src/
app.ts
server.ts

composition-root.ts

shared/
errors/
AppError.ts
NotFoundError.ts
ValidationError.ts
ConflictError.ts
events/
EventBus.ts
domain-events.ts
http/
errorHandler.ts
validateRequest.ts
utils/
id.ts
date.ts

modules/
cycles/
domain/
Cycle.ts
repositories/
CycleRepository.ts
InMemoryCycleRepository.ts
services/
CycleService.ts
controllers/
CycleController.ts
routes/
cycle.routes.ts

    daily-logs/
      domain/
        DailyLog.ts
      repositories/
        DailyLogRepository.ts
        InMemoryDailyLogRepository.ts
      services/
        DailyLogService.ts
      controllers/
        DailyLogController.ts
      routes/
        daily-log.routes.ts

    feed/
      domain/
        FeedPurchase.ts
      repositories/
        FeedRepository.ts
        InMemoryFeedRepository.ts
      services/
        FeedService.ts
      controllers/
        FeedController.ts
      routes/
        feed.routes.ts

    weight/
      domain/
        WeightLog.ts
      repositories/
        WeightRepository.ts
        InMemoryWeightRepository.ts
      services/
        WeightService.ts
      controllers/
        WeightController.ts
      routes/
        weight.routes.ts

    medication/
      domain/
        MedicationLog.ts
      repositories/
        MedicationRepository.ts
        InMemoryMedicationRepository.ts
      services/
        MedicationService.ts
      controllers/
        MedicationController.ts
      routes/
        medication.routes.ts

    expenses/
      domain/
        Expense.ts
      repositories/
        ExpenseRepository.ts
        InMemoryExpenseRepository.ts
      services/
        ExpenseService.ts
      handlers/
        expense.event-handlers.ts
      controllers/
        ExpenseController.ts
      routes/
        expense.routes.ts

    sales/
      domain/
        Sale.ts
      repositories/
        SaleRepository.ts
        InMemorySaleRepository.ts
      services/
        SalesService.ts
      controllers/
        SalesController.ts
      routes/
        sales.routes.ts

    dashboard/
      services/
        DashboardService.ts
      controllers/
        DashboardController.ts
      routes/
        dashboard.routes.ts

API endpoints:

Cycles:

- POST /api/cycles
- GET /api/cycles
- GET /api/cycles/:id

Daily Logs:

- POST /api/cycles/:cycleId/daily-logs
- GET /api/cycles/:cycleId/daily-logs

Feed:

- POST /api/cycles/:cycleId/feed-purchases
- GET /api/cycles/:cycleId/feed-purchases

Weight:

- POST /api/cycles/:cycleId/weight-logs
- GET /api/cycles/:cycleId/weight-logs

Medication:

- POST /api/cycles/:cycleId/medication-logs
- GET /api/cycles/:cycleId/medication-logs

Expenses:

- POST /api/cycles/:cycleId/expenses
- GET /api/cycles/:cycleId/expenses
- GET /api/cycles/:cycleId/expenses/breakdown

Sales:

- POST /api/cycles/:cycleId/sales
- GET /api/cycles/:cycleId/sales

Dashboard:

- GET /api/cycles/:cycleId/dashboard
- GET /api/cycles/:cycleId/report

Implementation notes:

- Keep controllers thin.
- Use async/await everywhere.
- Use proper HTTP status codes.
- Return consistent JSON responses.
- Use custom errors and one centralized error handler.
- Seed the in-memory storage with realistic sample poultry farm data.
- Write enough code so the app can actually run.
- Include package.json scripts:
  - dev
  - build
  - start
  - test
- Include tsconfig.json.
- Include README instructions.

Very important:
The goal is not just to make endpoints work.
The goal is to demonstrate clean architecture in an Express TypeScript modular monolith where infrastructure can later be swapped from in-memory repositories to Prisma/PostgreSQL without changing business services.
