/*
  Warnings:

  - The values [ATIVO,INATIVO,EM_MANUTENCAO,EM_CALIBRACAO,BAIXADO] on the enum `StatusEquipamento` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `descricao` on the `equipamentos` table. All the data in the column will be lost.
  - You are about to drop the column `identificacao` on the `equipamentos` table. All the data in the column will be lost.
  - You are about to drop the column `periodicidade_calibracao_meses` on the `equipamentos` table. All the data in the column will be lost.
  - You are about to drop the column `periodicidade_manutencao_meses` on the `equipamentos` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[setor,codigo]` on the table `equipamentos` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigo` to the `equipamentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `equipamentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qualificacao` to the `equipamentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `setor` to the `equipamentos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Setor" AS ENUM ('CAMPO', 'LABORATORIO', 'VIDRARIAS');

-- CreateEnum
CREATE TYPE "Qualificacao" AS ENUM ('CRITICO', 'NAO_CRITICO');

-- AlterEnum
BEGIN;
CREATE TYPE "StatusEquipamento_new" AS ENUM ('USO', 'FORA_DE_USO', 'MANUTENCAO', 'OBSOLETO');
ALTER TABLE "public"."equipamentos" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "equipamentos" ALTER COLUMN "status" TYPE "StatusEquipamento_new" USING ("status"::text::"StatusEquipamento_new");
ALTER TYPE "StatusEquipamento" RENAME TO "StatusEquipamento_old";
ALTER TYPE "StatusEquipamento_new" RENAME TO "StatusEquipamento";
DROP TYPE "public"."StatusEquipamento_old";
ALTER TABLE "equipamentos" ALTER COLUMN "status" SET DEFAULT 'USO';
COMMIT;

-- DropIndex
DROP INDEX "equipamentos_fabricante_numero_serie_key";

-- DropIndex
DROP INDEX "equipamentos_identificacao_key";

-- DropIndex
DROP INDEX "equipamentos_status_idx";

-- AlterTable
ALTER TABLE "calibracoes" ADD COLUMN     "erro_maximo" TEXT,
ADD COLUMN     "escala" TEXT,
ADD COLUMN     "faixa_calibracao" TEXT,
ADD COLUMN     "intervalo_meses" INTEGER,
ADD COLUMN     "normas_referencia" TEXT,
ALTER COLUMN "data_calibracao" DROP NOT NULL,
ALTER COLUMN "laboratorio" DROP NOT NULL,
ALTER COLUMN "resultado" DROP NOT NULL;

-- AlterTable
ALTER TABLE "equipamentos" DROP COLUMN "descricao",
DROP COLUMN "identificacao",
DROP COLUMN "periodicidade_calibracao_meses",
DROP COLUMN "periodicidade_manutencao_meses",
ADD COLUMN     "amostrador" TEXT,
ADD COLUMN     "codigo" TEXT NOT NULL,
ADD COLUMN     "localizacao_atual" TEXT,
ADD COLUMN     "nome" TEXT NOT NULL,
ADD COLUMN     "qualificacao" "Qualificacao" NOT NULL,
ADD COLUMN     "setor" "Setor" NOT NULL,
ALTER COLUMN "fabricante" DROP NOT NULL,
ALTER COLUMN "modelo" DROP NOT NULL,
ALTER COLUMN "numero_serie" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'USO';

-- AlterTable
ALTER TABLE "manutencoes" ADD COLUMN     "periodicidade_meses" INTEGER,
ALTER COLUMN "tipo" SET DEFAULT 'PREVENTIVA',
ALTER COLUMN "data_manutencao" DROP NOT NULL,
ALTER COLUMN "responsavel" DROP NOT NULL,
ALTER COLUMN "descricao" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "equipamentos_setor_status_idx" ON "equipamentos"("setor", "status");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_setor_codigo_key" ON "equipamentos"("setor", "codigo");
