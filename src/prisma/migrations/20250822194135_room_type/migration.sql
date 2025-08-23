/*
  Warnings:

  - You are about to drop the column `price` on the `Item` table. All the data in the column will be lost.
  - Added the required column `pricePerSqFt` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('BHK_1', 'BHK_2', 'BHK_3', 'BHK_4');

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "price",
ADD COLUMN     "availableInRooms" "RoomType"[],
ADD COLUMN     "pricePerSqFt" DOUBLE PRECISION NOT NULL;
