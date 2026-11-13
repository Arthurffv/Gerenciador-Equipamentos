import type { EquipamentoLinha, ResultadoCalibracao, Situacao, TipoManutencao } from "../../api/equipamentos";

const base = "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold";

const situacoes: Record<Situacao, { texto: string; cor: string }> = {
  VENCIDO: { texto: "Vencido", cor: "bg-red-100 text-red-700" },
  A_VENCER: { texto: "À vencer", cor: "bg-amber-100 text-amber-800" },
  NAO_VENCIDO: { texto: "Não vencido", cor: "bg-green-100 text-green-700" },
  SEM_REGISTRO: { texto: "Sem registro", cor: "bg-slate-100 text-slate-600" },
  NAO_PRECISA: { texto: "Não precisa de calibração", cor: "bg-sky-100 text-sky-700" },
  OBSOLETO: { texto: "Obsoleto", cor: "bg-slate-200 text-slate-600" },
};

export function SituacaoBadge({ situacao }: { situacao: Situacao }) {
  const s = situacoes[situacao];
  return <span className={`${base} ${s.cor}`}>{s.texto}</span>;
}

const statusEquip: Record<EquipamentoLinha["status"], { texto: string; cor: string }> = {
  USO: { texto: "Em uso", cor: "bg-green-100 text-green-700" },
  FORA_DE_USO: { texto: "Fora de uso", cor: "bg-slate-200 text-slate-600" },
  MANUTENCAO: { texto: "Em manutenção", cor: "bg-amber-100 text-amber-800" },
  OBSOLETO: { texto: "Obsoleto", cor: "bg-slate-200 text-slate-600" },
};

export function StatusEquipamentoBadge({ status }: { status: EquipamentoLinha["status"] }) {
  const s = statusEquip[status];
  return <span className={`${base} ${s.cor}`}>{s.texto}</span>;
}

export function QualificacaoBadge({ valor }: { valor: EquipamentoLinha["qualificacao"] }) {
  return valor === "CRITICO" ? (
    <span className={`${base} bg-brand/10 text-brand`}>Crítico</span>
  ) : (
    <span className={`${base} bg-slate-100 text-slate-600`}>Não crítico</span>
  );
}

const resultados: Record<ResultadoCalibracao, { texto: string; cor: string }> = {
  APROVADA: { texto: "Aprovada", cor: "bg-green-100 text-green-700" },
  APROVADA_COM_RESTRICAO: { texto: "Aprovada com restrição", cor: "bg-amber-100 text-amber-800" },
  REPROVADA: { texto: "Reprovada", cor: "bg-red-100 text-red-700" },
};

export function ResultadoBadge({ resultado }: { resultado: ResultadoCalibracao | null }) {
  if (!resultado) return <span className="text-slate-400">—</span>;
  const r = resultados[resultado];
  return <span className={`${base} ${r.cor}`}>{r.texto}</span>;
}

export function ConformeBadge({ conforme }: { conforme: boolean }) {
  return conforme ? (
    <span className={`${base} bg-green-100 text-green-700`}>Conforme</span>
  ) : (
    <span className={`${base} bg-red-100 text-red-700`}>Não conforme</span>
  );
}

export function TipoManutencaoBadge({ tipo }: { tipo: TipoManutencao }) {
  return tipo === "PREVENTIVA" ? (
    <span className={`${base} bg-sky-100 text-sky-700`}>Preventiva</span>
  ) : (
    <span className={`${base} bg-amber-100 text-amber-800`}>Corretiva</span>
  );
}
