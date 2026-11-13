/**
 * Regras de situação (Vencido / À vencer / Não vencido...), calculadas a partir
 * das datas e da data de hoje. Assim não dependemos do que foi digitado na planilha.
 */

export type SituacaoPrazo =
  | "VENCIDO"
  | "A_VENCER"
  | "NAO_VENCIDO"
  | "SEM_REGISTRO"
  | "NAO_PRECISA"
  | "OBSOLETO";

/** Faltando até X dias para a data, o item aparece como "À vencer". */
export const DIAS_PARA_A_VENCER = 30;

const DIA_MS = 86_400_000;

/** Soma meses sem estourar o mês: 31/01 + 1 mês = 28/02 (e não 03/03). Um prazo a mais seria um risco de conformidade. */
function adicionarMeses(data: Date, meses: number): Date {
  const ano = data.getUTCFullYear();
  const mes = data.getUTCMonth() + meses;
  const ultimoDiaDoMes = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes, Math.min(data.getUTCDate(), ultimoDiaDoMes)));
}

// "Hoje" vale no fuso da empresa, não no do servidor: um servidor em UTC viraria o dia às 21h de Brasília.
const FUSO = process.env.FUSO_HORARIO ?? "America/Sao_Paulo";
const formatadorDeDia = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" });

function hojeEmUTC(base: Date): number {
  const [ano, mes, dia] = formatadorDeDia.format(base).split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

/** Dias entre hoje e a data (negativo = já passou). */
export function diasAte(data: Date, base: Date = new Date()): number {
  return Math.floor((data.getTime() - hojeEmUTC(base)) / DIA_MS);
}

export function situacaoPorData(
  proxima: Date | null,
  base: Date = new Date()
): "VENCIDO" | "A_VENCER" | "NAO_VENCIDO" | "SEM_REGISTRO" {
  if (!proxima) return "SEM_REGISTRO";
  const dias = Math.floor((proxima.getTime() - hojeEmUTC(base)) / DIA_MS);
  if (dias < 0) return "VENCIDO";
  if (dias <= DIAS_PARA_A_VENCER) return "A_VENCER";
  return "NAO_VENCIDO";
}

/** Usa a "próxima data" da planilha; se faltar, calcula (última data + intervalo em meses). */
export function proximaData(
  ultima: Date | null,
  proxima: Date | null,
  meses: number | null
): Date | null {
  if (proxima) return proxima;
  if (ultima && meses) return adicionarMeses(ultima, meses);
  return null;
}

type Eq = { status: string; qualificacao: string };

export function situacaoCalibracao(
  eq: Eq,
  cal: { dataCalibracao: Date | null; proximaCalibracao: Date | null; intervaloMeses: number | null } | null,
  base: Date = new Date()
): SituacaoPrazo {
  if (eq.status === "OBSOLETO") return "OBSOLETO";
  if (!cal) return eq.qualificacao === "NAO_CRITICO" ? "NAO_PRECISA" : "SEM_REGISTRO";
  return situacaoPorData(proximaData(cal.dataCalibracao, cal.proximaCalibracao, cal.intervaloMeses), base);
}

export function situacaoManutencao(
  eq: Eq,
  man: { dataManutencao: Date | null; proximaManutencao: Date | null; periodicidadeMeses: number | null } | null,
  base: Date = new Date()
): SituacaoPrazo {
  if (eq.status === "OBSOLETO") return "OBSOLETO";
  if (!man) return "SEM_REGISTRO";
  return situacaoPorData(proximaData(man.dataManutencao, man.proximaManutencao, man.periodicidadeMeses), base);
}
