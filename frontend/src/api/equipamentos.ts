const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export type Situacao =
  | "VENCIDO"
  | "A_VENCER"
  | "NAO_VENCIDO"
  | "SEM_REGISTRO"
  | "NAO_PRECISA"
  | "OBSOLETO";

export type EquipamentoLinha = {
  id: string;
  codigo: string;
  nome: string;
  amostrador: string | null;
  numeroSerie: string | null;
  modelo: string | null;
  fabricante: string | null;
  qualificacao: "CRITICO" | "NAO_CRITICO";
  status: "USO" | "FORA_DE_USO" | "MANUTENCAO" | "OBSOLETO";
  localizacaoAtual: string | null;
  situacaoCalibracao: Situacao;
  situacaoManutencao: Situacao;
  calibracao: {
    numeroCertificado: string | null;
    escala: string | null;
    faixaCalibracao: string | null;
    dataCalibracao: string | null; // "2026-05-04"
    intervaloMeses: number | null;
    proximaCalibracao: string | null;
    erroMaximo: string | null;
    normasReferencia: string | null;
  } | null;
  manutencao: {
    dataManutencao: string | null;
    periodicidadeMeses: number | null;
    proximaManutencao: string | null;
  } | null;
};

export async function buscarEquipamentos(setor: string, signal?: AbortSignal): Promise<EquipamentoLinha[]> {
  const resposta = await fetch(`${API_URL}/api/setores/${setor}/equipamentos`, { signal });
  if (!resposta.ok) throw new Error(`A API respondeu com erro ${resposta.status}`);
  return resposta.json();
}
