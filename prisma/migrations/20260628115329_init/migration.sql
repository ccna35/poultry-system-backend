-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('STARTER', 'GROWER', 'FINISHER');

-- CreateEnum
CREATE TYPE "FeedInventoryMovementType" AS ENUM ('PURCHASE', 'CONSUMPTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "FeedInventoryReferenceType" AS ENUM ('FEED_PURCHASE', 'DAILY_LOG', 'MANUAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('CHICKS', 'FEED', 'MEDICATION', 'LABOR', 'ELECTRICITY', 'TRANSPORT', 'MISC', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseSourceType" AS ENUM ('MANUAL', 'FEED_PURCHASE', 'MEDICATION_LOG', 'SYSTEM');

-- CreateEnum
CREATE TYPE "DosageUnit" AS ENUM ('SPOON', 'GRAM', 'ML', 'CM');

-- CreateEnum
CREATE TYPE "DosagePerUnit" AS ENUM ('LITER', 'BIRD', 'KG');

-- CreateTable
CREATE TABLE "cycles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" "CycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "initial_birds" INTEGER NOT NULL,
    "chick_price" DECIMAL(12,2) NOT NULL,
    "expected_final_weight_kg" DECIMAL(10,3) NOT NULL,
    "expected_selling_price_per_kg" DECIMAL(12,2) NOT NULL,
    "expected_remaining_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_purchases" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "purchase_date" DATE NOT NULL,
    "feed_type" "FeedType" NOT NULL,
    "quantity_kg" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_inventory_movements" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "movement_date" DATE NOT NULL,
    "feed_type" "FeedType" NOT NULL,
    "movement_type" "FeedInventoryMovementType" NOT NULL,
    "quantity_kg" DECIMAL(10,2) NOT NULL,
    "reference_type" "FeedInventoryReferenceType",
    "reference_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_inventory_balances" (
    "cycle_id" UUID NOT NULL,
    "feed_type" "FeedType" NOT NULL,
    "quantity_kg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_inventory_balances_pkey" PRIMARY KEY ("cycle_id","feed_type")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "feed_consumed_kg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "temperature" DECIMAL(5,2),
    "humidity" DECIMAL(5,2),
    "water_consumed_liters" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "expense_date" DATE NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "source_type" "ExpenseSourceType",
    "source_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_logs" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "medicine_name" TEXT NOT NULL,
    "dosage_amount" DECIMAL(10,2) NOT NULL,
    "dosage_unit" "DosageUnit" NOT NULL,
    "dosage_per_amount" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "dosage_per_unit" "DosagePerUnit" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "sale_date" DATE NOT NULL,
    "birds_sold" INTEGER NOT NULL,
    "average_selling_weight_kg" DECIMAL(10,3) NOT NULL,
    "price_per_kg" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_logs" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "average_weight_kg" DECIMAL(10,3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feed_purchases_cycle_id_idx" ON "feed_purchases"("cycle_id");

-- CreateIndex
CREATE INDEX "feed_purchases_cycle_id_purchase_date_idx" ON "feed_purchases"("cycle_id", "purchase_date");

-- CreateIndex
CREATE INDEX "feed_inventory_movements_cycle_id_idx" ON "feed_inventory_movements"("cycle_id");

-- CreateIndex
CREATE INDEX "feed_inventory_movements_cycle_id_movement_date_idx" ON "feed_inventory_movements"("cycle_id", "movement_date");

-- CreateIndex
CREATE INDEX "feed_inventory_movements_reference_type_reference_id_idx" ON "feed_inventory_movements"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "feed_inventory_balances_cycle_id_idx" ON "feed_inventory_balances"("cycle_id");

-- CreateIndex
CREATE INDEX "daily_logs_cycle_id_idx" ON "daily_logs"("cycle_id");

-- CreateIndex
CREATE INDEX "daily_logs_cycle_id_date_idx" ON "daily_logs"("cycle_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_logs_cycle_id_date_key" ON "daily_logs"("cycle_id", "date");

-- CreateIndex
CREATE INDEX "expenses_cycle_id_idx" ON "expenses"("cycle_id");

-- CreateIndex
CREATE INDEX "expenses_cycle_id_expense_date_idx" ON "expenses"("cycle_id", "expense_date");

-- CreateIndex
CREATE INDEX "expenses_source_type_source_id_idx" ON "expenses"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "medication_logs_cycle_id_idx" ON "medication_logs"("cycle_id");

-- CreateIndex
CREATE INDEX "medication_logs_cycle_id_date_idx" ON "medication_logs"("cycle_id", "date");

-- CreateIndex
CREATE INDEX "sales_cycle_id_idx" ON "sales"("cycle_id");

-- CreateIndex
CREATE INDEX "sales_cycle_id_sale_date_idx" ON "sales"("cycle_id", "sale_date");

-- CreateIndex
CREATE INDEX "weight_logs_cycle_id_idx" ON "weight_logs"("cycle_id");

-- CreateIndex
CREATE INDEX "weight_logs_cycle_id_date_idx" ON "weight_logs"("cycle_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "weight_logs_cycle_id_date_key" ON "weight_logs"("cycle_id", "date");

-- AddForeignKey
ALTER TABLE "feed_purchases" ADD CONSTRAINT "feed_purchases_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_inventory_movements" ADD CONSTRAINT "feed_inventory_movements_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_inventory_balances" ADD CONSTRAINT "feed_inventory_balances_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
