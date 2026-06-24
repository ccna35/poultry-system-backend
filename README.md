# Poultry Farm Management System Backend (MVP)

Clean-architecture modular monolith backend for poultry farm operations.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- In-memory repositories (no DB yet)
- Zod validation
- Vitest unit tests

## Features

- Cycle management with one active cycle rule
- Daily operations logs
- Feed purchases and automatic expense creation
- Weight tracking
- Medication logs and automatic expense creation
- Manual and system expenses
- Sales and cycle completion
- Dashboard and report KPIs

## Project Structure

The code follows a modular monolith architecture:

- Domain models/types
- Repository interfaces + in-memory implementations
- Services/use cases (business logic)
- Controllers (HTTP orchestration only)
- Routes (request mapping + validation)
- Shared infrastructure
- Composition root for dependency wiring

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build:

```bash
npm run build
```

4. Run production build:

```bash
npm run start
```

5. Run tests:

```bash
npm run test
```

Server default: `http://localhost:3000`

## API Endpoints

### Cycles

- POST `/api/cycles`
- GET `/api/cycles`
- GET `/api/cycles/:id`

### Daily Logs

- POST `/api/cycles/:cycleId/daily-logs`
- GET `/api/cycles/:cycleId/daily-logs`

### Feed

- POST `/api/cycles/:cycleId/feed-purchases`
- GET `/api/cycles/:cycleId/feed-purchases`

### Weight

- POST `/api/cycles/:cycleId/weight-logs`
- GET `/api/cycles/:cycleId/weight-logs`

### Medication

- POST `/api/cycles/:cycleId/medication-logs`
- GET `/api/cycles/:cycleId/medication-logs`

### Expenses

- POST `/api/cycles/:cycleId/expenses`
- GET `/api/cycles/:cycleId/expenses`
- GET `/api/cycles/:cycleId/expenses/breakdown`

### Sales

- POST `/api/cycles/:cycleId/sales`
- GET `/api/cycles/:cycleId/sales`

### Dashboard

- GET `/api/cycles/:cycleId/dashboard`
- GET `/api/cycles/:cycleId/report`

## Notes

- Data is stored in-memory and resets on restart.
- The architecture is designed so repositories can later be replaced with PostgreSQL + Prisma without changing services/controllers.
