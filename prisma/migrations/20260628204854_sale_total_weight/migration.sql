/*
  Warnings:

  - You are about to drop the column `average_selling_weight_kg` on the `sales` table. All the data in the column will be lost.
  - Added the required column `total_weight_kg` to the `sales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sales" DROP COLUMN "average_selling_weight_kg",
ADD COLUMN     "total_weight_kg" DECIMAL(10,3) NOT NULL;
