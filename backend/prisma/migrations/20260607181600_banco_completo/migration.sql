/*
  Warnings:

  - You are about to drop the column `senha` on the `Usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `senha_hash` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telefone` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Usuario` DROP COLUMN `senha`,
    ADD COLUMN `senha_hash` VARCHAR(191) NOT NULL,
    ADD COLUMN `telefone` VARCHAR(191) NOT NULL,
    ADD COLUMN `username` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Veiculo` (
    `placa` VARCHAR(191) NOT NULL,
    `marca` VARCHAR(191) NOT NULL,
    `modelo` VARCHAR(191) NOT NULL,
    `ano` INTEGER NOT NULL,
    `tipo_combustivel` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`placa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Agencia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rota` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fk_usuario` INTEGER NOT NULL,
    `fk_agencia` INTEGER NOT NULL,
    `veiculo_placa` VARCHAR(191) NOT NULL,
    `dia` DATE NOT NULL,
    `hora_marcada` VARCHAR(191) NOT NULL,
    `hora_inicio` VARCHAR(191) NOT NULL,
    `hora_fim` VARCHAR(191) NOT NULL,
    `distancia_km` DOUBLE NOT NULL,
    `consumo_kml` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Custo` (
    `fk_rota` INTEGER NOT NULL,
    `preco_combustivel` DOUBLE NOT NULL,
    `custo_total` DOUBLE NOT NULL,

    PRIMARY KEY (`fk_rota`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Endereco_agencia` (
    `fk_agencia` INTEGER NOT NULL,
    `cep` VARCHAR(191) NOT NULL,
    `tipo_logradouro` VARCHAR(191) NOT NULL,
    `logradouro` VARCHAR(191) NOT NULL,
    `numero` INTEGER NOT NULL,
    `complemento` VARCHAR(191) NOT NULL,
    `municipio` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`fk_agencia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_username_key` ON `Usuario`(`username`);

-- AddForeignKey
ALTER TABLE `Rota` ADD CONSTRAINT `Rota_fk_usuario_fkey` FOREIGN KEY (`fk_usuario`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rota` ADD CONSTRAINT `Rota_fk_agencia_fkey` FOREIGN KEY (`fk_agencia`) REFERENCES `Agencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rota` ADD CONSTRAINT `Rota_veiculo_placa_fkey` FOREIGN KEY (`veiculo_placa`) REFERENCES `Veiculo`(`placa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Custo` ADD CONSTRAINT `Custo_fk_rota_fkey` FOREIGN KEY (`fk_rota`) REFERENCES `Rota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Endereco_agencia` ADD CONSTRAINT `Endereco_agencia_fk_agencia_fkey` FOREIGN KEY (`fk_agencia`) REFERENCES `Agencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
