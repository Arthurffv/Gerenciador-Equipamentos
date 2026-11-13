import type { AnaliseCritica, Calibracao, Equipamento, Manutencao } from "@prisma/client";
import { proximaData, situacaoCalibracao, situacaoManutencao } from "./status";

/** Data sem hora: "2026-05-04" (evita problemas de fuso no navegador). */
export const dia = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

export function serializarEquipamentoBase(e: Equipamento) {
  return {
    id: e.id,
    setor: e.setor,
    codigo: e.codigo,
    nome: e.nome,
    amostrador: e.amostrador,
    numeroSerie: e.numeroSerie,
    modelo: e.modelo,
    fabricante: e.fabricante,
    qualificacao: e.qualificacao,
    status: e.status,
    localizacaoAtual: e.localizacaoAtual,
    observacoes: e.observacoes,
  };
}

// As chaves internas do MinIO (certificadoKey / arquivoKey) nunca saem da API:
// o front só sabe se existe arquivo e qual o nome; o link vem de GET .../certificado ou .../arquivo.

export function serializarCalibracao(c: Calibracao) {
  return {
    id: c.id,
    numeroCertificado: c.numeroCertificado,
    escala: c.escala,
    faixaCalibracao: c.faixaCalibracao,
    dataCalibracao: dia(c.dataCalibracao),
    intervaloMeses: c.intervaloMeses,
    proximaCalibracao: dia(c.proximaCalibracao), // o que foi gravado (usado no formulário)
    proximaCalibracaoPrevista: dia(proximaData(c.dataCalibracao, c.proximaCalibracao, c.intervaloMeses)), // gravada ou calculada
    erroMaximo: c.erroMaximo,
    normasReferencia: c.normasReferencia,
    laboratorio: c.laboratorio,
    resultado: c.resultado,
    observacoes: c.observacoes,
    certificadoNome: c.certificadoKey ? (c.certificadoNome ?? "certificado") : null,
  };
}

export function serializarManutencao(m: Manutencao) {
  return {
    id: m.id,
    tipo: m.tipo,
    dataManutencao: dia(m.dataManutencao),
    periodicidadeMeses: m.periodicidadeMeses,
    proximaManutencao: dia(m.proximaManutencao),
    proximaManutencaoPrevista: dia(proximaData(m.dataManutencao, m.proximaManutencao, m.periodicidadeMeses)),
    responsavel: m.responsavel,
    descricao: m.descricao,
    custo: m.custo === null ? null : Number(m.custo),
  };
}

export function serializarAnalise(a: AnaliseCritica) {
  return {
    id: a.id,
    dataAnalise: dia(a.dataAnalise),
    analista: a.analista,
    parecer: a.parecer,
    conforme: a.conforme,
    acaoNecessaria: a.acaoNecessaria,
    arquivoNome: a.arquivoKey ? (a.arquivoNome ?? "analise-critica") : null,
  };
}

type EquipamentoComHistorico = Equipamento & {
  calibracoes: Calibracao[];
  manutencoes: Manutencao[];
  analisesCriticas: AnaliseCritica[];
};

/** Equipamento com todo o histórico (tela de detalhe). Os arrays já devem vir ordenados da consulta. */
export function serializarDetalhe(e: EquipamentoComHistorico) {
  const ultimaCal = e.calibracoes[0] ?? null;
  const ultimaMan = e.manutencoes[0] ?? null;
  return {
    ...serializarEquipamentoBase(e),
    situacaoCalibracao: situacaoCalibracao(e, ultimaCal),
    situacaoManutencao: situacaoManutencao(e, ultimaMan),
    calibracoes: e.calibracoes.map(serializarCalibracao),
    manutencoes: e.manutencoes.map(serializarManutencao),
    analisesCriticas: e.analisesCriticas.map(serializarAnalise),
  };
}
