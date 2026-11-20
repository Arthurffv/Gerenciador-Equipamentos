import "../src/config"; // carrega o backend/.env
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../src/config";
import { prisma } from "../src/prisma";
import { maisRecentePrimeiro } from "../src/consultas";
import { TIPOS_PERMITIDOS, conteudoCombinaComExtensao, enviarArquivo, garantirBucket, removerArquivos } from "../src/storage";
import { contar, gerarCsv, listarCertificados, planejar, type Acao, type EquipamentoBanco, type Linha } from "./lib/certificados";

/**
 * Anexa em lote os certificados de uma pasta às calibrações dos equipamentos.
 *
 * Estrutura esperada (a mesma das pastas VIDRARIAS):
 *   <pasta>/<tipo>/[<capacidade>/]<CÓDIGO>/[Obsoleto/]<CÓDIGO> - Certificado.pdf
 *
 * Uso (dentro da pasta backend):
 *   npx tsx scripts/importar-certificados.ts "C:\caminho\VIDRARIAS" --dry     -> só mostra o que faria
 *   npx tsx scripts/importar-certificados.ts "C:\caminho\VIDRARIAS"           -> anexa de verdade
 *
 * Opções:
 *   --setor CAMPO|LABORATORIO|VIDRARIAS   (se omitida, é deduzida do nome da pasta)
 *   --substituir                          troca certificados que já estão anexados
 *
 * O certificado vai para a calibração MAIS RECENTE do equipamento (a que aparece na tabela).
 * É seguro rodar de novo: quem já tem certificado é pulado.
 */

const SETORES = ["CAMPO", "LABORATORIO", "VIDRARIAS"] as const;
type Setor = (typeof SETORES)[number];

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const substituir = args.includes("--substituir");

function valorDe(opcao: string): string | undefined {
  const i = args.indexOf(opcao);
  return i >= 0 ? args[i + 1] : undefined;
}

function pastaEscolhida(): string {
  const valoresDeOpcoes = new Set([valorDe("--setor")]);
  const pasta = args.find((a) => !a.startsWith("--") && !valoresDeOpcoes.has(a));
  if (!pasta) throw new Error('Informe a pasta dos certificados. Ex.: npx tsx scripts/importar-certificados.ts "C:\\...\\VIDRARIAS" --dry');
  const completa = path.resolve(pasta);
  if (!fs.existsSync(completa) || !fs.statSync(completa).isDirectory()) throw new Error(`Pasta não encontrada: ${completa}`);
  return completa;
}

function setorEscolhido(pasta: string): Setor {
  const informado = valorDe("--setor")?.toUpperCase();
  if (informado) {
    if (!(SETORES as readonly string[]).includes(informado)) throw new Error(`Setor inválido: ${informado}. Use ${SETORES.join(", ")}.`);
    return informado as Setor;
  }
  const nome = path.basename(pasta).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (nome.includes("vidrar")) return "VIDRARIAS";
  if (nome.includes("campo")) return "CAMPO";
  if (nome.includes("laborat")) return "LABORATORIO";
  throw new Error("Não consegui deduzir o setor pelo nome da pasta. Acrescente --setor CAMPO, LABORATORIO ou VIDRARIAS.");
}

/** Mesmas conferências da API: arquivo vazio, grande demais ou corrompido/renomeado. */
function validar(a: Acao): Buffer {
  const dados = fs.readFileSync(a.arquivo.caminho);
  if (dados.length === 0) throw new Error("o arquivo está vazio");
  if (dados.length > config.maxUploadBytes) throw new Error(`maior que ${config.maxUploadBytes / 1024 / 1024} MB`);
  if (!conteudoCombinaComExtensao(a.arquivo.ext, dados)) throw new Error(`o conteúdo não é um ${a.arquivo.ext} válido (corrompido ou de outro tipo renomeado?)`);
  return dados;
}

async function anexar(a: Acao, dados: Buffer) {
  const anterior = a.substituir
    ? await prisma.calibracao.findUnique({ where: { id: a.calibracaoId }, select: { certificadoKey: true } })
    : null;

  // mesmo padrão de chave da API: calibracoes/<equipamento>/<calibração>/<uuid>.<ext>
  const chave = `calibracoes/${a.equipamentoId}/${a.calibracaoId}/${randomUUID()}${a.arquivo.ext}`;
  await enviarArquivo(chave, dados, TIPOS_PERMITIDOS[a.arquivo.ext]);
  try {
    await prisma.calibracao.update({
      where: { id: a.calibracaoId },
      data: { certificadoKey: chave, certificadoNome: a.arquivo.nome, certificadoUrl: null },
    });
  } catch (err) {
    await removerArquivos([chave]); // não deixa arquivo órfão no MinIO
    throw err;
  }
  await removerArquivos([anterior?.certificadoKey]);
}

async function main() {
  const pasta = pastaEscolhida();
  const setor = setorEscolhido(pasta);
  console.log(`\nPasta: ${pasta}\nSetor: ${setor}${dry ? "  (ensaio: nada será gravado)" : ""}${substituir ? "  (substituindo certificados existentes)" : ""}`);

  console.log("\nLendo a pasta...");
  const { arquivos, ignorados } = listarCertificados(pasta);
  console.log(`Arquivos de certificado encontrados: ${arquivos.length}`);

  const doBanco = await prisma.equipamento.findMany({
    where: { setor },
    select: {
      id: true,
      codigo: true,
      calibracoes: { orderBy: maisRecentePrimeiro("dataCalibracao"), take: 1, select: { id: true, certificadoKey: true } },
    },
  });
  const equipamentos: EquipamentoBanco[] = doBanco.map((e) => ({
    id: e.id,
    codigo: e.codigo,
    calibracaoId: e.calibracoes[0]?.id ?? null,
    temCertificado: Boolean(e.calibracoes[0]?.certificadoKey),
  }));
  console.log(`Equipamentos de ${setor} no sistema: ${equipamentos.length}`);

  const { acoes, linhas } = planejar(arquivos, equipamentos, { substituir }, ignorados);

  // confere os arquivos antes de enviar (também no ensaio)
  const validos: { acao: Acao; dados: Buffer }[] = [];
  for (const acao of acoes) {
    try {
      validos.push({ acao, dados: validar(acao) });
    } catch (err) {
      const linha = linhas.find((l) => l.arquivo === acao.arquivo.relativo && (l.status === "ANEXAR" || l.status === "SUBSTITUIR"));
      if (linha) Object.assign(linha, { status: "ARQUIVO_INVALIDO", detalhe: (err as Error).message });
    }
  }

  let enviados = 0;
  if (!dry && validos.length > 0) {
    await garantirBucket();
    console.log(`\nEnviando ${validos.length} certificados...`);
    for (const { acao, dados } of validos) {
      try {
        await anexar(acao, dados);
        enviados++;
        if (enviados % 25 === 0) console.log(`  ${enviados} / ${validos.length}`);
      } catch (err) {
        const msg = (err as Error).message ?? String(err);
        const linha = linhas.find((l) => l.arquivo === acao.arquivo.relativo && (l.status === "ANEXAR" || l.status === "SUBSTITUIR"));
        if (linha) Object.assign(linha, { status: "ERRO", detalhe: msg });
        if (msg.includes("indisponível")) {
          console.error("\nO MinIO não respondeu. Confira se o Docker está rodando (docker compose up -d) e rode de novo.");
          break; // quem já foi anexado fica; o resto entra na próxima rodada
        }
      }
    }
  }

  // relatório
  const pastaRelatorio = path.resolve(process.cwd(), "dados"); // dados/ já está no .gitignore
  fs.mkdirSync(pastaRelatorio, { recursive: true });
  const relatorio = path.join(pastaRelatorio, `relatorio-certificados-${setor.toLowerCase()}.csv`);
  fs.writeFileSync(relatorio, gerarCsv(linhas as Linha[]), "utf8");

  const c = contar(linhas);
  const n = (k: string) => c[k] ?? 0;
  console.log("\n──────── Resumo ────────");
  console.log(dry ? `Seriam anexados:               ${n("ANEXAR") + n("SUBSTITUIR")}` : `Anexados agora:                ${enviados}`);
  console.log(`Já tinham certificado:         ${n("JA_TEM")}`);
  console.log(`Equipamento sem calibração:    ${n("SEM_CALIBRACAO")}`);
  console.log(`Código não existe no sistema:  ${n("SEM_EQUIPAMENTO")}`);
  console.log(`Vários certificados (manual):  ${n("VARIOS_CERTIFICADOS")}`);
  console.log(`Certificados antigos (Obsoleto): ${n("CERTIFICADO_ANTIGO")}`);
  console.log(`Formato não aceito:            ${n("FORMATO_NAO_ACEITO")}`);
  console.log(`Código repetido no sistema:    ${n("CODIGO_REPETIDO_NO_SISTEMA")}`);
  console.log(`Arquivo inválido:              ${n("ARQUIVO_INVALIDO")}`);
  console.log(`Erros:                         ${n("ERRO")}`);
  console.log(`\nRelatório completo (abra no Excel): ${relatorio}`);
  if (dry) console.log("\n(modo --dry: nada foi gravado)");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("\nFalha:", err.message ?? err);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
