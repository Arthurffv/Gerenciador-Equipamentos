import { useMemo, useState } from "react";
import { useAuth } from "../auth/contexto";
import { Link, Navigate, useParams } from "react-router-dom";
import { Eye, FileText, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { abas, setores } from "../config/setores";
import { useEquipamentos } from "../hooks/useEquipamentos";
import { abrirCertificado, excluirEquipamento, type EquipamentoBase, type EquipamentoLinha } from "../api/equipamentos";
import { data, txt } from "../utils/formatar";
import DataTable, { type Coluna } from "../components/ui/DataTable";
import Botao, { BotaoIcone } from "../components/ui/Botao";
import Aviso from "../components/ui/Aviso";
import EquipamentoForm from "../components/equipamentos/EquipamentoForm";
import { QualificacaoBadge, SituacaoBadge, StatusEquipamentoBadge } from "../components/ui/Badges";

type Acoes = {
  abrirCertificado: (calibracaoId: string) => void;
  editar: (e: EquipamentoLinha) => void;
  excluir: (e: EquipamentoLinha) => void;
};

// ───────────── Colunas de cada aba (iguais às da planilha) ─────────────

const nomeComLink = (e: EquipamentoLinha) => (
  <Link to={`/equipamentos/${e.id}`} className="font-medium text-brand hover:underline">
    {e.nome}
  </Link>
);

function colunasDaAba(aba: string, acoes: Acoes, podeEditar: boolean): Coluna<EquipamentoLinha>[] {
  const geral: Coluna<EquipamentoLinha>[] = [
    { titulo: "Equipamento", render: nomeComLink },
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

  const calibracao: Coluna<EquipamentoLinha>[] = [
    { titulo: "Instrumento", render: nomeComLink },
    { titulo: "Código", render: (e) => <span className="font-medium">{e.codigo}</span> },
    { titulo: "Qualificação", render: (e) => <QualificacaoBadge valor={e.qualificacao} /> },
    { titulo: "Nº do certificado", render: (e) => txt(e.calibracao?.numeroCertificado) },
    {
      titulo: "Certificado (arquivo)",
      render: (e) =>
        e.calibracao?.certificadoNome ? (
          <button
            type="button"
            onClick={() => acoes.abrirCertificado(e.calibracao!.id)}
            title={e.calibracao.certificadoNome}
            className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
          >
            <FileText size={14} aria-hidden /> Abrir
          </button>
        ) : (
          "—"
        ),
    },
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

  const manutencao: Coluna<EquipamentoLinha>[] = [
    { titulo: "Instrumento", render: nomeComLink },
    { titulo: "Código", render: (e) => <span className="font-medium">{e.codigo}</span> },
    { titulo: "Qualificação", render: (e) => <QualificacaoBadge valor={e.qualificacao} /> },
    { titulo: "Última manutenção", render: (e) => data(e.manutencao?.dataManutencao) },
    { titulo: "Periodicidade (meses)", render: (e) => txt(e.manutencao?.periodicidadeMeses) },
    { titulo: "Próxima manutenção", render: (e) => data(e.manutencao?.proximaManutencao) },
    { titulo: "Status da manutenção", render: (e) => <SituacaoBadge situacao={e.situacaoManutencao} /> },
    { titulo: "Status do equipamento", render: (e) => <StatusEquipamentoBadge status={e.status} /> },
  ];

  const colunaAcoes: Coluna<EquipamentoLinha> = {
    titulo: "Ações",
    render: (e) => (
      <div className="flex items-center gap-0.5">
        <Link
          to={`/equipamentos/${e.id}`}
          title="Abrir histórico, certificados e análises"
          aria-label={`Abrir ${e.codigo}`}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200 hover:text-brand"
        >
          <Eye size={16} />
        </Link>
        {podeEditar && (
          <>
            <BotaoIcone rotulo={`Editar ${e.codigo}`} onClick={() => acoes.editar(e)}>
              <Pencil size={16} />
            </BotaoIcone>
            <BotaoIcone rotulo={`Excluir ${e.codigo}`} className="hover:!text-red-600" onClick={() => acoes.excluir(e)}>
              <Trash2 size={16} />
            </BotaoIcone>
          </>
        )}
      </div>
    ),
  };

  const porAba: Record<string, Coluna<EquipamentoLinha>[]> = { geral, calibracao, manutencao };
  return [...(porAba[aba] ?? geral), colunaAcoes];
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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
  // undefined = formulário fechado; null = novo equipamento; objeto = editando
  const [formulario, setFormulario] = useState<EquipamentoBase | null | undefined>(undefined);
  const [aviso, setAviso] = useState<string | null>(null);

  const { podeEditar } = useAuth();
  const setor = setores.find((s) => s.slug === setorSlug);
  const aba = abas.find((a) => a.slug === abaSlug);

  const { dados, carregando, erro, recarregar } = useEquipamentos(setor?.slug);

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim());
    return termo ? dados.filter((e) => textoParaBusca(e).includes(termo)) : dados;
  }, [dados, busca]);

  const colunas = colunasDaAba(aba?.slug ?? "geral", {
    abrirCertificado: (id) => abrirCertificado(id).catch((e: Error) => setAviso(`Não foi possível abrir o certificado: ${e.message}`)),
    editar: setFormulario,
    excluir: async (e) => {
      const confirmado = window.confirm(
        `Excluir ${e.codigo} – ${e.nome}?\n\nO histórico de calibrações, manutenções e análises críticas, e os arquivos anexados, também serão apagados. Isso não pode ser desfeito.`
      );
      if (!confirmado) return;
      try {
        await excluirEquipamento(e.id);
        recarregar();
      } catch (err) {
        setAviso(`Não foi possível excluir: ${err instanceof Error ? err.message : "erro desconhecido"}`);
      }
    },
  }, podeEditar);

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
        {podeEditar && (
          <Botao className="ml-auto" onClick={() => setFormulario(null)}>
            <Plus size={16} aria-hidden /> Novo equipamento
          </Botao>
        )}
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

      {aviso && <Aviso onFechar={() => setAviso(null)}>{aviso}</Aviso>}

      {carregando && <p className="py-10 text-center text-slate-500">Carregando...</p>}

      {erro && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      {!carregando && !erro && (
        <DataTable
          colunas={colunas}
          linhas={filtrados}
          chave={(e) => e.id}
          vazio={dados.length === 0 ? `Nenhum equipamento neste setor.${podeEditar ? " Use “Novo equipamento” para cadastrar." : ""}` : "Nenhum equipamento encontrado."}
        />
      )}

      {formulario !== undefined && (
        <EquipamentoForm
          setor={setor.slug}
          inicial={formulario}
          onFechar={() => setFormulario(undefined)}
          onSalvo={() => {
            setFormulario(undefined);
            recarregar();
          }}
        />
      )}
    </div>
  );
}
