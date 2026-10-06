/*
  Warnings:

  - You are about to drop the column `ratingAvg` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `ratingCount` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "ratingAvg",
DROP COLUMN "ratingCount",
ADD COLUMN     "useBottleArt" BOOLEAN NOT NULL DEFAULT true;
