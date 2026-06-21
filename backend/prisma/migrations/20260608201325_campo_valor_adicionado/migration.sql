/*
  Warnings:

  - Added the required column `valor` to the `Rota` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Rota` ADD COLUMN `valor` DOUBLE NOT NULL;
