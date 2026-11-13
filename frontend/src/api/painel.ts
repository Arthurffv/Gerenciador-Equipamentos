import { requisicao } from "./cliente";

export type Contagem = {
  VENCIDO: number;
  A_VENCER: number;
  NAO_VENCIDO: number;
  SEM_REGISTRO: number;
  NAO_PRECISA: number;
  OBSOLETO: number;
};

export type Vencimento = {
  equipamentoId: string;
  codigo: string;
  nome: string;
  setor: string; // slug: campo, laboratorio, vidrarias
  tipo: "CALIBRACAO" | "MANUTENCAO";
  data: string; // "2026-11-20"
  dias: number; // negativo = atrasado
  situacao: "VENCIDO" | "A_VENCER";
};

export type Painel = {
  totais: { equipamentos: number; emUso: number; foraDeUso: number; emManutencao: number; obsoletos: number };
  calibracao: Contagem;
  manutencao: Contagem;
  porSetor: { setor: string; equipamentos: number; calibracao: Contagem; manutencao: Contagem }[];
  alertas: number;
  vencimentos: Vencimento[];
};

export const buscarPainel = (signal?: AbortSignal) => requisicao<Painel>("GET", "/api/dashboard", undefined, signal);

export type ResultadoBusca = { id: string; setor: string; codigo: string; nome: string; modelo: string | null; fabricante: string | null };

export const buscarPorTexto = (q: string, signal?: AbortSignal) =>
  requisicao<ResultadoBusca[]>("GET", `/api/busca?q=${encodeURIComponent(q)}`, undefined, signal);
