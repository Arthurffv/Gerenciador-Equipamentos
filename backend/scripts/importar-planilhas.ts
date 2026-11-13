import "../src/config"; // carrega o .env
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { removerArquivos } from "../src/storage";
import { lerArquivo, type SetorChave } from "./lib/lerPlanilha";

/**
 * Importa as planilhas FOR 0042 (Campo, Laboratório, Vidrarias) para o banco.
 *
 * Uso (dentro da pasta backend):
 *   npx tsx scripts/importar-planilhas.ts --dry          -> só lê e mostra o relatório
 *   npx tsx scripts/importar-planilhas.ts                -> MESCLA: adiciona só os equipamentos novos
 *   npx tsx scripts/importar-planilhas.ts --substituir   -> APAGA o setor e importa de novo (pede confirmação)
 *
 * Por padrão nada que já está no banco é alterado: equipamentos cujo código já existe no
 * setor são pulados (com todo o histórico, certificados e análises que tiverem).
 * --substituir é para recomeçar do zero e remove também os arquivos do MinIO.
 */

const PASTA = path.resolve(process.cwd(), "dados");
const dry = process.argv.includes("--dry");
const substituir = process.argv.includes("--substituir");

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

  if (prisma && substituir) {
    console.log("\n⚠  --substituir APAGA todos os equipamentos dos setores importados, com histórico, certificados e análises críticas.");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const resposta = (await rl.question('Digite SUBSTITUIR para continuar: ')).trim();
    rl.close();
    if (resposta !== "SUBSTITUIR") throw new Error("Cancelado. Nada foi alterado.");
  }

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

    // Modo padrão (mesclar): só entra o que ainda não existe no setor. Com --substituir, entra tudo.
    const existentes = substituir
      ? new Set<string>()
      : new Set((await prisma.equipamento.findMany({ where: { setor: alvo.setor }, select: { codigo: true } })).map((e) => e.codigo));
    const novos = lido.equipamentos.filter((e) => !existentes.has(e.codigo));
    const pulados = lido.equipamentos.length - novos.length;
    if (pulados > 0) console.log(`Já existiam no banco (preservados, não alterados): ${pulados}`);
    console.log(`A importar: ${novos.length} equipamento(s)`);

    const idPorCodigo = new Map(novos.map((e) => [e.codigo, randomUUID()]));

    // Com --substituir, anota os arquivos do MinIO que vão ficar sem dono
    const arquivosParaApagar = substituir
      ? await Promise.all([
          prisma.calibracao.findMany({ where: { equipamento: { setor: alvo.setor } }, select: { certificadoKey: true } }),
          prisma.analiseCritica.findMany({ where: { equipamento: { setor: alvo.setor } }, select: { arquivoKey: true } }),
        ]).then(([cals, analises]) => [...cals.map((c) => c.certificadoKey), ...analises.map((a) => a.arquivoKey)])
      : [];

    await prisma.$transaction([
      ...(substituir ? [prisma.equipamento.deleteMany({ where: { setor: alvo.setor } })] : []),
      prisma.equipamento.createMany({
        data: novos.map((e) => ({
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
        data: lido.calibracoes
          .filter((c) => idPorCodigo.has(c.codigo))
          .map((c) => ({
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
        data: lido.manutencoes
          .filter((m) => idPorCodigo.has(m.codigo))
          .map((m) => ({
            equipamentoId: idPorCodigo.get(m.codigo)!,
            tipo: "PREVENTIVA" as const,
            dataManutencao: m.dataManutencao,
            periodicidadeMeses: m.periodicidadeMeses,
            proximaManutencao: m.proximaManutencao,
          })),
      }),
    ]);

    await removerArquivos(arquivosParaApagar);
    if (arquivosParaApagar.filter(Boolean).length) console.log(`Arquivos removidos do MinIO: ${arquivosParaApagar.filter(Boolean).length}`);

    console.log("Gravado no banco ✔");
  }

  if (prisma) await prisma.$disconnect();
  console.log(dry ? "\n(modo --dry: nada foi gravado)" : "\nImportação concluída.");
}

main().catch((err) => {
  console.error("\nFalha na importação:", err.message ?? err);
  process.exit(1);
});
