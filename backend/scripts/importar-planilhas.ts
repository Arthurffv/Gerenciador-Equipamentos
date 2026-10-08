import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { lerArquivo, type SetorChave } from "./lib/lerPlanilha";

/**
 * Importa as planilhas FOR 0042 (Campo, Laboratório, Vidrarias) para o banco.
 *
 * Uso (dentro da pasta backend):
 *   npx tsx scripts/importar-planilhas.ts --dry   -> só lê e mostra o relatório
 *   npx tsx scripts/importar-planilhas.ts         -> grava no banco
 *
 * Atenção: ao gravar, os dados ATUAIS de cada setor são substituídos pelos da planilha.
 */

const PASTA = path.resolve(process.cwd(), "dados");
const dry = process.argv.includes("--dry");

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const ALVOS: { setor: SetorChave; trecho: string }[] = [
  { setor: "CAMPO", trecho: "campo" },
  { setor: "LABORATORIO", trecho: "laboratorio" },
  { setor: "VIDRARIAS", trecho: "vidrarias" },
];

async function main() {
  if (!fs.existsSync(PASTA)) {
    throw new Error(`Pasta não encontrada: ${PASTA}\nCrie backend/dados e coloque as 3 planilhas lá.`);
  }

  const arquivos = fs
    .readdirSync(PASTA)
    .filter((f) => f.toLowerCase().endsWith(".xlsx") && !f.startsWith("~$"));

  const prisma = dry ? null : new PrismaClient();

  for (const alvo of ALVOS) {
    const arquivo = arquivos.find((f) => semAcento(f).includes(alvo.trecho));
    if (!arquivo) {
      console.warn(`\n[${alvo.setor}] nenhum arquivo .xlsx com "${alvo.trecho}" no nome — pulado.`);
      continue;
    }

    const lido = await lerArquivo(alvo.setor, path.join(PASTA, arquivo));

    console.log(`\n=== ${alvo.setor}  (${arquivo}) ===`);
    console.log(`Equipamentos: ${lido.equipamentos.length}`);
    console.log(`Calibrações:  ${lido.calibracoes.length}`);
    console.log(`Manutenções:  ${lido.manutencoes.length}`);
    if (lido.avisos.length) {
      console.log("Avisos (vale corrigir na planilha):");
      lido.avisos.forEach((a) => console.log("  - " + a));
    }

    if (!prisma) continue;

    const idPorCodigo = new Map(lido.equipamentos.map((e) => [e.codigo, randomUUID()]));

    await prisma.$transaction([
      prisma.equipamento.deleteMany({ where: { setor: alvo.setor } }),
      prisma.equipamento.createMany({
        data: lido.equipamentos.map((e) => ({
          id: idPorCodigo.get(e.codigo)!,
          setor: alvo.setor,
          codigo: e.codigo,
          nome: e.nome,
          amostrador: e.amostrador,
          numeroSerie: e.numeroSerie,
          modelo: e.modelo,
          fabricante: e.fabricante,
          qualificacao: e.qualificacao,
          status: e.status,
          localizacaoAtual: e.localizacaoAtual,
        })),
      }),
      prisma.calibracao.createMany({
        data: lido.calibracoes.map((c) => ({
          equipamentoId: idPorCodigo.get(c.codigo)!,
          numeroCertificado: c.numeroCertificado,
          escala: c.escala,
          faixaCalibracao: c.faixaCalibracao,
          dataCalibracao: c.dataCalibracao,
          intervaloMeses: c.intervaloMeses,
          proximaCalibracao: c.proximaCalibracao,
          erroMaximo: c.erroMaximo,
          normasReferencia: c.normasReferencia,
        })),
      }),
      prisma.manutencao.createMany({
        data: lido.manutencoes.map((m) => ({
          equipamentoId: idPorCodigo.get(m.codigo)!,
          tipo: "PREVENTIVA" as const,
          dataManutencao: m.dataManutencao,
          periodicidadeMeses: m.periodicidadeMeses,
          proximaManutencao: m.proximaManutencao,
        })),
      }),
    ]);

    console.log("Gravado no banco ✔");
  }

  if (prisma) await prisma.$disconnect();
  console.log(dry ? "\n(modo --dry: nada foi gravado)" : "\nImportação concluída.");
}

main().catch((err) => {
  console.error("\nFalha na importação:", err.message ?? err);
  process.exit(1);
});
