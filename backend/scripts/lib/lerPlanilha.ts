import ExcelJS from "exceljs";

// ───────────── Tipos ─────────────

export type SetorChave = "CAMPO" | "LABORATORIO" | "VIDRARIAS";
export type QualificacaoChave = "CRITICO" | "NAO_CRITICO";
export type StatusChave = "USO" | "FORA_DE_USO" | "MANUTENCAO" | "OBSOLETO";

export type EquipamentoLido = {
  codigo: string;
  nome: string;
  amostrador: string | null;
  numeroSerie: string | null;
  modelo: string | null;
  fabricante: string | null;
  qualificacao: QualificacaoChave;
  status: StatusChave;
  localizacaoAtual: string | null;
};

export type CalibracaoLida = {
  codigo: string;
  numeroCertificado: string | null;
  escala: string | null;
  faixaCalibracao: string | null;
  dataCalibracao: Date | null;
  intervaloMeses: number | null;
  proximaCalibracao: Date | null;
  erroMaximo: string | null;
  normasReferencia: string | null;
};

export type ManutencaoLida = {
  codigo: string;
  dataManutencao: Date;
  periodicidadeMeses: number | null;
  proximaManutencao: Date | null;
};

export type ResultadoLeitura = {
  setor: SetorChave;
  arquivo: string;
  equipamentos: EquipamentoLido[];
  calibracoes: CalibracaoLida[];
  manutencoes: ManutencaoLida[];
  avisos: string[];
};

// ───────────── Utilitários ─────────────

const norm = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** Valor "cru" de uma célula: resolve fórmulas, rich text, links e erros (#REF!). */
function valorCelula(cell: ExcelJS.Cell): unknown {
  let v: unknown = cell.value;
  if (v && typeof v === "object" && !(v instanceof Date)) {
    const o = v as Record<string, unknown>;
    if ("error" in o) return null;
    if ("result" in o) v = o.result;
    else if (Array.isArray(o.richText)) v = (o.richText as { text: string }[]).map((r) => r.text).join("");
    else if ("text" in o) v = o.text;
    if (v && typeof v === "object" && !(v instanceof Date)) return null; // ex.: erro dentro de fórmula
  }
  return v ?? null;
}

const NAO_CONSTA = new Set(["", "nc", "n/c", "n/d", "-", "--", "0", "00:00:00"]);

function texto(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return null;
  const s = String(v).replace(/\s+/g, " ").trim();
  return NAO_CONSTA.has(s.toLowerCase()) ? null : s;
}

function data(v: unknown): Date | null {
  if (!(v instanceof Date) || isNaN(v.getTime())) return null;
  // Células vazias de fórmula viram 1899/1900: descartamos datas antes de 1990
  return v.getFullYear() < 1990 ? null : v;
}

function inteiro(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return Math.round(v);
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

function qualificacao(v: unknown): QualificacaoChave {
  return norm(v).includes("nao") ? "NAO_CRITICO" : "CRITICO";
}

function statusEquipamento(v: unknown): StatusChave | null {
  const s = norm(v);
  if (s === "uso") return "USO";
  if (s === "fora de uso") return "FORA_DE_USO";
  if (s === "manutencao") return "MANUTENCAO";
  if (s === "obsoleto") return "OBSOLETO";
  return null;
}

function codigoLimpo(v: unknown): string | null {
  const s = texto(v);
  return s ? s.toUpperCase() : null;
}

type Regra = (h: string) => boolean;

function mapearColunas(ws: ExcelJS.Worksheet, regras: Record<string, Regra>) {
  for (let r = 1; r <= 40; r++) {
    const headers: string[] = [];
    for (let c = 1; c <= 25; c++) headers[c] = norm(valorCelula(ws.getCell(r, c)));
    if (!headers.includes("codigo")) continue;

    const cols: Record<string, number> = {};
    for (const [chave, regra] of Object.entries(regras)) {
      const c = headers.findIndex((h, i) => i > 0 && h && regra(h));
      if (c > 0) cols[chave] = c;
    }
    return { linhaCabecalho: r, cols };
  }
  throw new Error(`Cabeçalho (coluna "Código") não encontrado na aba "${ws.name}"`);
}

function linhas(ws: ExcelJS.Worksheet, linhaCabecalho: number, cols: Record<string, number>) {
  const resultado: { n: number; get: (k: string) => unknown }[] = [];
  for (let r = linhaCabecalho + 1; r <= ws.rowCount; r++) {
    resultado.push({
      n: r,
      get: (k) => (cols[k] ? valorCelula(ws.getCell(r, cols[k])) : null),
    });
  }
  return resultado;
}

class Avisos {
  private grupos = new Map<string, string[]>();
  add(titulo: string, exemplo: string) {
    if (!this.grupos.has(titulo)) this.grupos.set(titulo, []);
    this.grupos.get(titulo)!.push(exemplo);
  }
  lista(): string[] {
    return [...this.grupos.entries()].map(
      ([t, ex]) => `${t}: ${ex.length} ocorrência(s). Ex.: ${ex.slice(0, 5).join(" | ")}`
    );
  }
}

// ───────────── Leitura de um arquivo (3 abas) ─────────────

export async function lerArquivo(setor: SetorChave, caminho: string): Promise<ResultadoLeitura> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(caminho);

  const aba = (trecho: string) => {
    const ws = wb.worksheets.find((w) => norm(w.name).includes(trecho));
    if (!ws) throw new Error(`Aba contendo "${trecho}" não encontrada em ${caminho}`);
    return ws;
  };

  const avisos = new Avisos();

  // ── GERAL ──
  const geral = aba("geral");
  const mg = mapearColunas(geral, {
    nome: (h) => h === "equipamento",
    amostrador: (h) => h === "amostrador",
    codigo: (h) => h === "codigo",
    numeroSerie: (h) => h.includes("serie"),
    modelo: (h) => h === "modelo",
    fabricante: (h) => h === "fabricante",
    qualificacao: (h) => h === "qualificacao",
    status: (h) => h === "status do equipamento",
    localizacao: (h) => h.startsWith("localizacao"),
  });

  const equipamentos: EquipamentoLido[] = [];
  const vistos = new Map<string, number>();

  for (const l of linhas(geral, mg.linhaCabecalho, mg.cols)) {
    const codigo = codigoLimpo(l.get("codigo"));
    if (!codigo) continue; // linha vazia / fórmula sobrando

    const nome = texto(l.get("nome")) ?? "(sem nome)";
    if (vistos.has(codigo)) {
      avisos.add("Código repetido na aba GERAL (mantida só a 1ª linha)", `${codigo} (linhas ${vistos.get(codigo)} e ${l.n})`);
      continue;
    }
    vistos.set(codigo, l.n);

    let status = statusEquipamento(l.get("status"));
    if (!status) {
      avisos.add("Status do equipamento não reconhecido (assumido USO)", `${codigo}: "${texto(l.get("status"))}"`);
      status = "USO";
    }

    equipamentos.push({
      codigo,
      nome,
      amostrador: texto(l.get("amostrador")),
      numeroSerie: texto(l.get("numeroSerie")),
      modelo: texto(l.get("modelo")),
      fabricante: texto(l.get("fabricante")),
      qualificacao: qualificacao(l.get("qualificacao")),
      status,
      localizacaoAtual: texto(l.get("localizacao")),
    });
  }

  const codigosConhecidos = new Set(equipamentos.map((e) => e.codigo));

  // ── CALIBRAÇÃO ──
  const cal = aba("calibra");
  const mc = mapearColunas(cal, {
    codigo: (h) => h === "codigo",
    certificado: (h) => h.includes("certificado"),
    escala: (h) => h === "escala",
    faixa: (h) => h.startsWith("faixa"),
    ultima: (h) => h.includes("ultima calibracao"),
    intervalo: (h) => h.startsWith("intervalo"),
    proxima: (h) => h.includes("proxima calibracao"),
    erro: (h) => h.startsWith("erro"),
    normas: (h) => h.startsWith("normas"),
  });

  const calibracoes: CalibracaoLida[] = [];
  const chavesCal = new Set<string>();

  for (const l of linhas(cal, mc.linhaCabecalho, mc.cols)) {
    const codigo = codigoLimpo(l.get("codigo"));
    if (!codigo) continue;
    if (!codigosConhecidos.has(codigo)) {
      avisos.add("Código na aba CALIBRAÇÃO que não existe na GERAL (ignorado)", `${codigo} (linha ${l.n})`);
      continue;
    }

    const numeroCertificado = texto(l.get("certificado"));
    const dataCalibracao = data(l.get("ultima"));
    if (!dataCalibracao && !numeroCertificado) continue; // sem calibração registrada

    const chave = `${codigo}|${dataCalibracao?.toISOString()}|${numeroCertificado}`;
    if (chavesCal.has(chave)) {
      avisos.add("Linha de calibração duplicada (ignorada)", `${codigo} (linha ${l.n})`);
      continue;
    }
    chavesCal.add(chave);

    calibracoes.push({
      codigo,
      numeroCertificado,
      escala: texto(l.get("escala")),
      faixaCalibracao: texto(l.get("faixa")),
      dataCalibracao,
      intervaloMeses: inteiro(l.get("intervalo")),
      proximaCalibracao: data(l.get("proxima")),
      erroMaximo: texto(l.get("erro")),
      normasReferencia: texto(l.get("normas")),
    });
  }

  // ── MANUTENÇÃO ──
  const man = aba("manuten");
  const mm = mapearColunas(man, {
    codigo: (h) => h === "codigo",
    ultima: (h) => h.includes("ultima manutencao"),
    periodicidade: (h) => h.startsWith("periodicidade"),
    proxima: (h) => h.includes("proxima manutencao"),
  });

  const manutencoes: ManutencaoLida[] = [];
  const chavesMan = new Set<string>();

  for (const l of linhas(man, mm.linhaCabecalho, mm.cols)) {
    const codigo = codigoLimpo(l.get("codigo"));
    if (!codigo) continue;
    if (!codigosConhecidos.has(codigo)) {
      avisos.add("Código na aba MANUTENÇÃO que não existe na GERAL (ignorado)", `${codigo} (linha ${l.n})`);
      continue;
    }

    const dataManutencao = data(l.get("ultima"));
    if (!dataManutencao) continue; // sem manutenção registrada

    const chave = `${codigo}|${dataManutencao.toISOString()}`;
    if (chavesMan.has(chave)) {
      avisos.add("Linha de manutenção duplicada (ignorada)", `${codigo} (linha ${l.n})`);
      continue;
    }
    chavesMan.add(chave);

    manutencoes.push({
      codigo,
      dataManutencao,
      periodicidadeMeses: inteiro(l.get("periodicidade")),
      proximaManutencao: data(l.get("proxima")),
    });
  }

  return { setor, arquivo: caminho, equipamentos, calibracoes, manutencoes, avisos: avisos.lista() };
}
