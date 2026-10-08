-- CreateEnum
CREATE TYPE "StatusEquipamento" AS ENUM ('ATIVO', 'INATIVO', 'EM_MANUTENCAO', 'EM_CALIBRACAO', 'BAIXADO');

-- CreateEnum
CREATE TYPE "ResultadoCalibracao" AS ENUM ('APROVADA', 'APROVADA_COM_RESTRICAO', 'REPROVADA');

-- CreateEnum
CREATE TYPE "TipoManutencao" AS ENUM ('PREVENTIVA', 'CORRETIVA');

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" TEXT NOT NULL,
    "identificacao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fabricante" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "numero_serie" TEXT NOT NULL,
    "status" "StatusEquipamento" NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "periodicidade_calibracao_meses" INTEGER,
    "periodicidade_manutencao_meses" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibracoes" (
    "id" TEXT NOT NULL,
    "equipamento_id" TEXT NOT NULL,
    "data_calibracao" DATE NOT NULL,
    "proxima_calibracao" DATE,
    "laboratorio" TEXT NOT NULL,
    "numero_certificado" TEXT,
    "resultado" "ResultadoCalibracao" NOT NULL,
    "observacoes" TEXT,
    "certificado_key" TEXT,
    "certificado_nome" TEXT,
    "certificado_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencoes" (
    "id" TEXT NOT NULL,
    "equipamento_id" TEXT NOT NULL,
    "tipo" "TipoManutencao" NOT NULL,
    "data_manutencao" DATE NOT NULL,
    "proxima_manutencao" DATE,
    "responsavel" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "custo" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manutencoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analises_criticas" (
    "id" TEXT NOT NULL,
    "equipamento_id" TEXT NOT NULL,
    "data_analise" DATE NOT NULL,
    "analista" TEXT NOT NULL,
    "parecer" TEXT NOT NULL,
    "conforme" BOOLEAN NOT NULL DEFAULT true,
    "acao_necessaria" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analises_criticas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_identificacao_key" ON "equipamentos"("identificacao");

-- CreateIndex
CREATE INDEX "equipamentos_status_idx" ON "equipamentos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_fabricante_numero_serie_key" ON "equipamentos"("fabricante", "numero_serie");

-- CreateIndex
CREATE INDEX "calibracoes_equipamento_id_data_calibracao_idx" ON "calibracoes"("equipamento_id", "data_calibracao" DESC);

-- CreateIndex
CREATE INDEX "calibracoes_proxima_calibracao_idx" ON "calibracoes"("proxima_calibracao");

-- CreateIndex
CREATE INDEX "manutencoes_equipamento_id_data_manutencao_idx" ON "manutencoes"("equipamento_id", "data_manutencao" DESC);

-- CreateIndex
CREATE INDEX "manutencoes_proxima_manutencao_idx" ON "manutencoes"("proxima_manutencao");

-- CreateIndex
CREATE INDEX "analises_criticas_equipamento_id_data_analise_idx" ON "analises_criticas"("equipamento_id", "data_analise" DESC);

-- AddForeignKey
ALTER TABLE "calibracoes" ADD CONSTRAINT "calibracoes_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes" ADD CONSTRAINT "manutencoes_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_criticas" ADD CONSTRAINT "analises_criticas_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
