-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN', 'EDITOR', 'LEITOR');

-- AlterTable
ALTER TABLE "analises_criticas" ADD COLUMN     "arquivo_key" TEXT,
ADD COLUMN     "arquivo_nome" TEXT;

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL DEFAULT 'LEITOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ultimo_acesso" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
