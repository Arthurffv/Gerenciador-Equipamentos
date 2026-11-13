import { requisicao, enviarArquivo, abrirArquivo } from "./cliente";

export type Situacao = "VENCIDO" | "A_VENCER" | "NAO_VENCIDO" | "SEM_REGISTRO" | "NAO_PRECISA" | "OBSOLETO";
export type Qualificacao = "CRITICO" | "NAO_CRITICO";
export type StatusEquipamento = "USO" | "FORA_DE_USO" | "MANUTENCAO" | "OBSOLETO";
export type ResultadoCalibracao = "APROVADA" | "APROVADA_COM_RESTRICAO" | "REPROVADA";
export type TipoManutencao = "PREVENTIVA" | "CORRETIVA";

// ───────────── Equipamento ─────────────

export type EquipamentoDados = {
  codigo: string;
  nome: string;
  amostrador: string | null;
  numeroSerie: string | null;
  modelo: string | null;
  fabricante: string | null;
  qualificacao: Qualificacao;
  status: StatusEquipamento;
  localizacaoAtual: string | null;
  observacoes: string | null;
};

export type EquipamentoBase = EquipamentoDados & { id: string; setor: "CAMPO" | "LABORATORIO" | "VIDRARIAS" };

/** Uma linha das tabelas por setor (Geral / Calibração / Manutenção). */
export type EquipamentoLinha = EquipamentoBase & {
  situacaoCalibracao: Situacao;
  situacaoManutencao: Situacao;
  calibracao: {
    id: string;
    numeroCertificado: string | null;
    escala: string | null;
    faixaCalibracao: string | null;
    dataCalibracao: string | null; // "2026-05-04"
    intervaloMeses: number | null;
    proximaCalibracao: string | null;
    erroMaximo: string | null;
    normasReferencia: string | null;
    certificadoNome: string | null;
  } | null;
  manutencao: {
    dataManutencao: string | null;
    periodicidadeMeses: number | null;
    proximaManutencao: string | null;
  } | null;
};

// ───────────── Histórico (tela de detalhe) ─────────────

export type CalibracaoDados = {
  numeroCertificado: string | null;
  escala: string | null;
  faixaCalibracao: string | null;
  dataCalibracao: string | null;
  intervaloMeses: number | null;
  proximaCalibracao: string | null;
  erroMaximo: string | null;
  normasReferencia: string | null;
  laboratorio: string | null;
  resultado: ResultadoCalibracao | null;
  observacoes: string | null;
};
export type CalibracaoDetalhe = CalibracaoDados & {
  id: string;
  proximaCalibracaoPrevista: string | null; // gravada ou calculada (data + intervalo)
  certificadoNome: string | null;
};

export type ManutencaoDados = {
  tipo: TipoManutencao;
  dataManutencao: string;
  periodicidadeMeses: number | null;
  proximaManutencao: string | null;
  responsavel: string | null;
  descricao: string | null;
  custo: number | null;
};
export type ManutencaoDetalhe = ManutencaoDados & { id: string; proximaManutencaoPrevista: string | null };

export type AnaliseDados = {
  dataAnalise: string;
  analista: string;
  parecer: string;
  conforme: boolean;
  acaoNecessaria: string | null;
};
export type AnaliseDetalhe = AnaliseDados & { id: string; arquivoNome: string | null };

export type EquipamentoDetalhe = EquipamentoBase & {
  situacaoCalibracao: Situacao;
  situacaoManutencao: Situacao;
  calibracoes: CalibracaoDetalhe[];
  manutencoes: ManutencaoDetalhe[];
  analisesCriticas: AnaliseDetalhe[];
};

// ───────────── Chamadas ─────────────

export const buscarEquipamentos = (setor: string, signal?: AbortSignal) =>
  requisicao<EquipamentoLinha[]>("GET", `/api/setores/${setor}/equipamentos`, undefined, signal);

export const buscarEquipamento = (id: string, signal?: AbortSignal) =>
  requisicao<EquipamentoDetalhe>("GET", `/api/equipamentos/${id}`, undefined, signal);

export const criarEquipamento = (setor: string, dados: EquipamentoDados) =>
  requisicao<EquipamentoBase>("POST", `/api/setores/${setor}/equipamentos`, dados);
export const atualizarEquipamento = (id: string, dados: EquipamentoDados) =>
  requisicao<EquipamentoBase>("PUT", `/api/equipamentos/${id}`, dados);
export const excluirEquipamento = (id: string) => requisicao("DELETE", `/api/equipamentos/${id}`);

export const criarCalibracao = (equipamentoId: string, dados: CalibracaoDados) =>
  requisicao<CalibracaoDetalhe>("POST", `/api/equipamentos/${equipamentoId}/calibracoes`, dados);
export const atualizarCalibracao = (id: string, dados: CalibracaoDados) =>
  requisicao<CalibracaoDetalhe>("PUT", `/api/calibracoes/${id}`, dados);
export const excluirCalibracao = (id: string) => requisicao("DELETE", `/api/calibracoes/${id}`);
export const enviarCertificado = (id: string, arquivo: File) => enviarArquivo(`/api/calibracoes/${id}/certificado`, arquivo);
export const removerCertificado = (id: string) => requisicao("DELETE", `/api/calibracoes/${id}/certificado`);
export const abrirCertificado = (id: string) => abrirArquivo(`/api/calibracoes/${id}/certificado`);

export const criarManutencao = (equipamentoId: string, dados: ManutencaoDados) =>
  requisicao<ManutencaoDetalhe>("POST", `/api/equipamentos/${equipamentoId}/manutencoes`, dados);
export const atualizarManutencao = (id: string, dados: ManutencaoDados) =>
  requisicao<ManutencaoDetalhe>("PUT", `/api/manutencoes/${id}`, dados);
export const excluirManutencao = (id: string) => requisicao("DELETE", `/api/manutencoes/${id}`);

export const criarAnalise = (equipamentoId: string, dados: AnaliseDados) =>
  requisicao<AnaliseDetalhe>("POST", `/api/equipamentos/${equipamentoId}/analises-criticas`, dados);
export const atualizarAnalise = (id: string, dados: AnaliseDados) =>
  requisicao<AnaliseDetalhe>("PUT", `/api/analises-criticas/${id}`, dados);
export const excluirAnalise = (id: string) => requisicao("DELETE", `/api/analises-criticas/${id}`);
export const enviarArquivoAnalise = (id: string, arquivo: File) => enviarArquivo(`/api/analises-criticas/${id}/arquivo`, arquivo);
export const removerArquivoAnalise = (id: string) => requisicao("DELETE", `/api/analises-criticas/${id}/arquivo`);
export const abrirArquivoAnalise = (id: string) => abrirArquivo(`/api/analises-criticas/${id}/arquivo`);
