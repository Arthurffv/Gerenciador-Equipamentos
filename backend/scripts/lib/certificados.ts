import fs from "node:fs";
import path from "node:path";

/** Tipos aceitos como certificado (o storage aceita outros, mas certificado é PDF ou imagem). */
export const EXTENSOES_CERTIFICADO = new Set([".pdf", ".png", ".jpg", ".jpeg"]);

const IGNORAR_NOMES = new Set(["thumbs.db", "desktop.ini", ".ds_store"]);

// ───────────── Códigos ─────────────

/** "AQPA 117", "aqpa-117" e "AQPA117" viram todos "AQPA117". */
export const chaveDoCodigo = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Letras seguidas de números, com espaço, hífen ou nada no meio. */
const PADRAO_CODIGO = /([A-Za-z]{2,5})[\s_.-]*(\d{1,5})(?!\d)/g;

export function candidatosDeCodigo(texto: string): { chave: string; trecho: string }[] {
  const achados: { chave: string; trecho: string }[] = [];
  for (const m of texto.matchAll(PADRAO_CODIGO)) {
    achados.push({ chave: m[1].toUpperCase() + m[2], trecho: m[0].trim() });
  }
  return achados;
}

// ───────────── Leitura da pasta ─────────────

export type ArquivoEncontrado = {
  caminho: string; // caminho completo no computador
  relativo: string; // caminho a partir da pasta escolhida (aparece no relatório)
  nome: string; // nome do arquivo (guardado como "nome do certificado")
  ext: string;
  /** true se está dentro de uma pasta "Obsoleto" (certificado de uma versão antiga). */
  antigo: boolean;
  /** pastas entre a raiz e o arquivo, da mais próxima do arquivo para a mais distante */
  pastas: string[];
};

export type Ignorado = { relativo: string; motivo: string };

export function listarCertificados(raiz: string): { arquivos: ArquivoEncontrado[]; ignorados: Ignorado[] } {
  const arquivos: ArquivoEncontrado[] = [];
  const ignorados: Ignorado[] = [];

  const percorrer = (dir: string) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const completo = path.join(dir, item.name);
      if (item.isDirectory()) {
        percorrer(completo);
        continue;
      }
      if (!item.isFile()) continue;
      if (IGNORAR_NOMES.has(item.name.toLowerCase()) || item.name.startsWith("~$")) continue;
      if (!/certific/i.test(item.name)) continue; // análise crítica, histórico, planilhas etc. ficam de fora

      const relativo = path.relative(raiz, completo);
      const ext = path.extname(item.name).toLowerCase();
      if (!EXTENSOES_CERTIFICADO.has(ext)) {
        ignorados.push({ relativo, motivo: `formato ${ext || "(sem extensão)"} não aceito (use PDF ou imagem)` });
        continue;
      }
      const pastas = path.dirname(relativo).split(path.sep).filter((p) => p && p !== ".").reverse();
      arquivos.push({
        caminho: completo,
        relativo,
        nome: item.name.normalize("NFC"),
        ext,
        antigo: pastas.some((p) => p.toLowerCase() === "obsoleto"),
        pastas,
      });
    }
  };

  percorrer(raiz);
  arquivos.sort((a, b) => a.relativo.localeCompare(b.relativo, "pt-BR"));
  return { arquivos, ignorados };
}

// ───────────── Plano (o que será feito) ─────────────

export type EquipamentoBanco = {
  id: string;
  codigo: string;
  calibracaoId: string | null; // a calibração mais recente (a que aparece na tabela)
  temCertificado: boolean;
};

export type StatusLinha =
  | "ANEXAR"
  | "SUBSTITUIR"
  | "JA_TEM"
  | "SEM_CALIBRACAO"
  | "SEM_EQUIPAMENTO"
  | "VARIOS_CERTIFICADOS"
  | "CERTIFICADO_ANTIGO"
  | "CODIGO_REPETIDO_NO_SISTEMA"
  | "FORMATO_NAO_ACEITO"
  | "ARQUIVO_INVALIDO"
  | "ERRO";

export type Linha = { status: StatusLinha; codigo: string; arquivo: string; detalhe: string };

export type Acao = {
  arquivo: ArquivoEncontrado;
  codigo: string;
  equipamentoId: string;
  calibracaoId: string;
  substituir: boolean;
};

/** Acha o equipamento do arquivo: primeiro pelo nome do arquivo, depois pelo nome das pastas. */
function resolverCodigo(a: ArquivoEncontrado, existentes: Map<string, EquipamentoBanco[]>) {
  const origens = [a.nome, ...a.pastas.filter((p) => p.toLowerCase() !== "obsoleto")];
  let primeiroTrecho: string | null = null;
  for (const texto of origens) {
    for (const c of candidatosDeCodigo(texto)) {
      primeiroTrecho ??= c.trecho;
      if (existentes.has(c.chave)) return { chave: c.chave, trecho: c.trecho };
    }
  }
  return { chave: null, trecho: primeiroTrecho };
}

export function planejar(
  arquivos: ArquivoEncontrado[],
  equipamentos: EquipamentoBanco[],
  opcoes: { substituir: boolean },
  ignorados: Ignorado[] = []
): { acoes: Acao[]; linhas: Linha[] } {
  const linhas: Linha[] = ignorados.map((i) => ({
    status: "FORMATO_NAO_ACEITO",
    codigo: "",
    arquivo: i.relativo,
    detalhe: i.motivo,
  }));
  const acoes: Acao[] = [];

  const porChave = new Map<string, EquipamentoBanco[]>();
  for (const e of equipamentos) {
    const k = chaveDoCodigo(e.codigo);
    porChave.set(k, [...(porChave.get(k) ?? []), e]);
  }

  // agrupa os arquivos por equipamento
  const grupos = new Map<string, { trecho: string; arquivos: ArquivoEncontrado[] }>();
  for (const a of arquivos) {
    const { chave, trecho } = resolverCodigo(a, porChave);
    if (!chave) {
      linhas.push({
        status: "SEM_EQUIPAMENTO",
        codigo: trecho ?? "",
        arquivo: a.relativo,
        detalhe: trecho
          ? `o código ${trecho} não existe neste setor no sistema`
          : "não consegui identificar o código do equipamento no nome do arquivo nem das pastas",
      });
      continue;
    }
    const g = grupos.get(chave) ?? { trecho: trecho ?? chave, arquivos: [] };
    g.arquivos.push(a);
    grupos.set(chave, g);
  }

  for (const [chave, g] of grupos) {
    const donos = porChave.get(chave)!;
    const codigo = donos[0].codigo;

    // 1) escolhe qual arquivo vale: os "atuais" (fora da pasta Obsoleto); sem nenhum, os antigos
    const atuais = g.arquivos.filter((a) => !a.antigo);
    const candidatos = atuais.length > 0 ? atuais : g.arquivos;

    if (atuais.length > 0) {
      for (const a of g.arquivos.filter((x) => x.antigo)) {
        linhas.push({
          status: "CERTIFICADO_ANTIGO",
          codigo,
          arquivo: a.relativo,
          detalhe: "certificado de uma versão antiga (pasta Obsoleto): não foi anexado",
        });
      }
    }

    if (candidatos.length > 1) {
      for (const a of candidatos) {
        linhas.push({
          status: "VARIOS_CERTIFICADOS",
          codigo,
          arquivo: a.relativo,
          detalhe: `${candidatos.length} certificados possíveis para este equipamento: anexe o correto pelo sistema`,
        });
      }
      continue;
    }
    const escolhido = candidatos[0];

    // 2) confere o equipamento no sistema
    if (donos.length > 1) {
      linhas.push({
        status: "CODIGO_REPETIDO_NO_SISTEMA",
        codigo,
        arquivo: escolhido.relativo,
        detalhe: "mais de um equipamento com este código no sistema (ex.: com e sem hífen)",
      });
      continue;
    }
    const eq = donos[0];
    if (!eq.calibracaoId) {
      linhas.push({
        status: "SEM_CALIBRACAO",
        codigo,
        arquivo: escolhido.relativo,
        detalhe: "o equipamento não tem calibração registrada: cadastre a calibração no sistema e rode de novo",
      });
      continue;
    }
    if (eq.temCertificado && !opcoes.substituir) {
      linhas.push({
        status: "JA_TEM",
        codigo,
        arquivo: escolhido.relativo,
        detalhe: "a calibração já tem certificado (use --substituir para trocar)",
      });
      continue;
    }

    acoes.push({
      arquivo: escolhido,
      codigo,
      equipamentoId: eq.id,
      calibracaoId: eq.calibracaoId,
      substituir: eq.temCertificado,
    });
    linhas.push({
      status: eq.temCertificado ? "SUBSTITUIR" : "ANEXAR",
      codigo,
      arquivo: escolhido.relativo,
      detalhe: eq.temCertificado ? "substitui o certificado atual" : "será anexado à última calibração",
    });
  }

  return { acoes, linhas };
}

// ───────────── Relatório (CSV para abrir no Excel) ─────────────

export function gerarCsv(linhas: Linha[]): string {
  const campo = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const ordem = [...linhas].sort(
    (a, b) => a.status.localeCompare(b.status) || a.codigo.localeCompare(b.codigo, "pt-BR") || a.arquivo.localeCompare(b.arquivo, "pt-BR")
  );
  const corpo = ordem.map((l) => [l.status, l.codigo, l.arquivo, l.detalhe].map(campo).join(";"));
  // BOM + ponto e vírgula: o Excel em português abre com acentos e colunas certinhas
  return "\uFEFF" + ["Situação;Código;Arquivo;Detalhe", ...corpo].join("\r\n") + "\r\n";
}

export function contar(linhas: Linha[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const l of linhas) c[l.status] = (c[l.status] ?? 0) + 1;
  return c;
}
