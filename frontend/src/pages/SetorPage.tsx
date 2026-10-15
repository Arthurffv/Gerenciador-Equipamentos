import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Search } from "lucide-react";
import { abas, setores } from "../config/setores";
import { useEquipamentos } from "../hooks/useEquipamentos";
import type { EquipamentoLinha } from "../api/equipamentos";
import DataTable, { type Coluna } from "../components/ui/DataTable";
import { QualificacaoBadge, SituacaoBadge, StatusEquipamentoBadge } from "../components/ui/Badges";

const vazio = "—";
const txt = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? vazio : String(v));
const data = (v: string | null | undefined) => (v ? v.split("-").reverse().join("/") : vazio); // 2026-05-04 -> 04/05/2026

// ───────────── Colunas de cada aba (iguais às da planilha) ─────────────

const colunasGeral: Coluna<EquipamentoLinha>[] = [
  { titulo: "Equipamento", render: (e) => e.nome },
  { titulo: "Amostrador", render: (e) => txt(e.amostrador) },
  { titulo: "Código", render: (e) => <span className="font-medium">{e.codigo}</span> },
  { titulo: "Nº de série", render: (e) => txt(e.numeroSerie) },
  { titulo: "Modelo", render: (e) => txt(e.modelo) },
  { titulo: "Fabricante", render: (e) => txt(e.fabricante) },
  { titulo: "Qualificação", render: (e) => <QualificacaoBadge valor={e.qualificacao} /> },
  { titulo: "Status do equipamento", render: (e) => <StatusEquipamentoBadge status={e.status} /> },
  { titulo: "Status da calibração", render: (e) => <SituacaoBadge situacao={e.situacaoCalibracao} /> },
  { titulo: "Status da manutenção", render: (e) => <SituacaoBadge situacao={e.situacaoManutencao} /> },
  { titulo: "Localização atual", render: (e) => txt(e.localizacaoAtual) },
];

const colunasCalibracao: Coluna<EquipamentoLinha>[] = [
  { titulo: "Instrumento", render: (e) => e.nome },
  { titulo: "Código", render: (e) => <span className="font-medium">{e.codigo}</span> },
  { titulo: "Qualificação", render: (e) => <QualificacaoBadge valor={e.qualificacao} /> },
  { titulo: "Nº do certificado", render: (e) => txt(e.calibracao?.numeroCertificado) },
  { titulo: "Escala", render: (e) => txt(e.calibracao?.escala) },
  { titulo: "Faixa de calibração", render: (e) => txt(e.calibracao?.faixaCalibracao) },
  { titulo: "Última calibração", render: (e) => data(e.calibracao?.dataCalibracao) },
  { titulo: "Intervalo (meses)", render: (e) => txt(e.calibracao?.intervaloMeses) },
  { titulo: "Próxima calibração", render: (e) => data(e.calibracao?.proximaCalibracao) },
  { titulo: "Status da calibração", render: (e) => <SituacaoBadge situacao={e.situacaoCalibracao} /> },
  { titulo: "Status do equipamento", render: (e) => <StatusEquipamentoBadge status={e.status} /> },
  { titulo: "Erro máximo", render: (e) => txt(e.calibracao?.erroMaximo) },
  { titulo: "Normas de referência", render: (e) => txt(e.calibracao?.normasReferencia) },
];

const colunasManutencao: Coluna<EquipamentoLinha>[] = [
  { titulo: "Instrumento", render: (e) => e.nome },
  { titulo: "Código", render: (e) => <span className="font-medium">{e.codigo}</span> },
  { titulo: "Qualificação", render: (e) => <QualificacaoBadge valor={e.qualificacao} /> },
  { titulo: "Última manutenção", render: (e) => data(e.manutencao?.dataManutencao) },
  { titulo: "Periodicidade (meses)", render: (e) => txt(e.manutencao?.periodicidadeMeses) },
  { titulo: "Próxima manutenção", render: (e) => data(e.manutencao?.proximaManutencao) },
  { titulo: "Status da manutenção", render: (e) => <SituacaoBadge situacao={e.situacaoManutencao} /> },
  { titulo: "Status do equipamento", render: (e) => <StatusEquipamentoBadge status={e.status} /> },
];

const colunasPorAba: Record<string, Coluna<EquipamentoLinha>[]> = {
  geral: colunasGeral,
  calibracao: colunasCalibracao,
  manutencao: colunasManutencao,
};

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function textoParaBusca(e: EquipamentoLinha) {
  return semAcento(
    [e.nome, e.codigo, e.amostrador, e.numeroSerie, e.modelo, e.fabricante, e.localizacaoAtual, e.calibracao?.numeroCertificado]
      .filter(Boolean)
      .join(" ")
  );
}

// ───────────── Página: /:setor/:aba ─────────────

export default function SetorPage() {
  const { setor: setorSlug, aba: abaSlug } = useParams();
  const [busca, setBusca] = useState("");

  const setor = setores.find((s) => s.slug === setorSlug);
  const aba = abas.find((a) => a.slug === abaSlug);

  const { dados, carregando, erro } = useEquipamentos(setor?.slug);

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim());
    return termo ? dados.filter((e) => textoParaBusca(e).includes(termo)) : dados;
  }, [dados, busca]);

  if (!setor || !aba) return <Navigate to="/campo/geral" replace />;

  const Icon = setor.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-brand">
          {setor.label} – {aba.label}
        </h1>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
          <Icon size={18} aria-hidden />
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative w-full max-w-md">
          <span className="sr-only">Filtrar equipamentos</span>
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por código, nome, série, modelo..."
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm
              focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </label>

        {!carregando && !erro && (
          <p className="text-sm text-slate-500">
            Mostrando {filtrados.length} de {dados.length} equipamentos
          </p>
        )}
      </div>

      {carregando && <p className="py-10 text-center text-slate-500">Carregando...</p>}

      {erro && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      {!carregando && !erro && (
        <DataTable
          colunas={colunasPorAba[aba.slug]}
          linhas={filtrados}
          chave={(e) => e.id}
          vazio="Nenhum equipamento encontrado."
        />
      )}
    </div>
  );
}
