import { useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import {
  abrirArquivoAnalise,
  abrirCertificado,
  excluirAnalise,
  excluirCalibracao,
  excluirEquipamento,
  excluirManutencao,
  type AnaliseDetalhe,
  type CalibracaoDetalhe,
  type ManutencaoDetalhe,
} from "../api/equipamentos";
import { useAuth } from "../auth/contexto";
import { useEquipamento } from "../hooks/useEquipamentos";
import { dinheiro, data, txt } from "../utils/formatar";
import DataTable, { type Coluna } from "../components/ui/DataTable";
import Botao, { BotaoIcone } from "../components/ui/Botao";
import Aviso from "../components/ui/Aviso";
import {
  ConformeBadge,
  QualificacaoBadge,
  ResultadoBadge,
  SituacaoBadge,
  StatusEquipamentoBadge,
  TipoManutencaoBadge,
} from "../components/ui/Badges";
import EquipamentoForm from "../components/equipamentos/EquipamentoForm";
import CalibracaoForm from "../components/equipamentos/CalibracaoForm";
import ManutencaoForm from "../components/equipamentos/ManutencaoForm";
import AnaliseForm from "../components/equipamentos/AnaliseForm";

type Formulario =
  | { tipo: "equipamento" }
  | { tipo: "calibracao"; item: CalibracaoDetalhe | null }
  | { tipo: "manutencao"; item: ManutencaoDetalhe | null }
  | { tipo: "analise"; item: AnaliseDetalhe | null };

function Secao({ titulo, onNovo, rotuloNovo, children }: { titulo: string; onNovo?: () => void; rotuloNovo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-brand">{titulo}</h2>
        {onNovo && (
          <Botao variante="secundario" onClick={onNovo}>
            <Plus size={16} aria-hidden /> {rotuloNovo}
          </Botao>
        )}
      </div>
      {children}
    </section>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{rotulo}</dt>
      <dd className="text-sm font-medium text-slate-800">{children}</dd>
    </div>
  );
}

function BotaoArquivo({ nome, onAbrir }: { nome: string | null; onAbrir: () => void }) {
  if (!nome) return <span className="text-slate-400">—</span>;
  return (
    <button type="button" onClick={onAbrir} title={nome} className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
      <FileText size={14} aria-hidden /> Abrir
    </button>
  );
}

function Acoes({ rotulo, onEditar, onExcluir }: { rotulo: string; onEditar: () => void; onExcluir: () => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <BotaoIcone rotulo={`Editar ${rotulo}`} onClick={onEditar}>
        <Pencil size={16} />
      </BotaoIcone>
      <BotaoIcone rotulo={`Excluir ${rotulo}`} className="hover:!text-red-600" onClick={onExcluir}>
        <Trash2 size={16} />
      </BotaoIcone>
    </div>
  );
}

// ───────────── Página: /equipamentos/:id ─────────────

export default function EquipamentoPage() {
  const { id } = useParams();
  const { podeEditar } = useAuth();
  const navegar = useNavigate();
  const { dados: e, carregando, erro, recarregar } = useEquipamento(id);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "erro" | "info"; texto: string } | null>(null);

  if (!id) return <Navigate to="/campo/geral" replace />;
  if (carregando) return <p className="py-10 text-center text-slate-500">Carregando...</p>;
  if (erro || !e) {
    return (
      <div className="space-y-3 py-6">
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro ?? "Equipamento não encontrado."}
        </p>
        <Link to="/campo/geral" className="text-sm font-medium text-brand hover:underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  const setorSlug = e.setor.toLowerCase(); // CAMPO -> campo
  const falha = (prefixo: string) => (err: unknown) =>
    setAviso({ tipo: "erro", texto: `${prefixo}: ${err instanceof Error ? err.message : "erro desconhecido"}` });

  async function excluir(pergunta: string, acao: () => Promise<unknown>, prefixo: string) {
    if (!window.confirm(pergunta)) return;
    try {
      await acao();
      recarregar();
    } catch (err) {
      falha(prefixo)(err);
    }
  }

  const fechar = () => setFormulario(null);
  const salvo = (avisoDeArquivo?: string) => {
    fechar();
    recarregar();
    if (avisoDeArquivo) setAviso({ tipo: "info", texto: avisoDeArquivo });
  };

  const novo = (f: () => void) => (podeEditar ? f : undefined); // Leitor não vê "Novo ..."
  const colunaAcoes = <T,>(coluna: Coluna<T>): Coluna<T>[] => (podeEditar ? [coluna] : []);

  // ── colunas ──
  const colunasCalibracao: Coluna<CalibracaoDetalhe>[] = [
    { titulo: "Data", render: (c) => data(c.dataCalibracao) },
    { titulo: "Nº do certificado", render: (c) => txt(c.numeroCertificado) },
    { titulo: "Escala", render: (c) => txt(c.escala) },
    { titulo: "Faixa", render: (c) => txt(c.faixaCalibracao) },
    { titulo: "Próxima", render: (c) => data(c.proximaCalibracaoPrevista) },
    { titulo: "Resultado", render: (c) => <ResultadoBadge resultado={c.resultado} /> },
    { titulo: "Laboratório", render: (c) => txt(c.laboratorio) },
    { titulo: "Certificado", render: (c) => <BotaoArquivo nome={c.certificadoNome} onAbrir={() => abrirCertificado(c.id).catch(falha("Não foi possível abrir o certificado"))} /> },
    ...colunaAcoes<CalibracaoDetalhe>({
      titulo: "Ações",
      render: (c) => (
        <Acoes
          rotulo="calibração"
          onEditar={() => setFormulario({ tipo: "calibracao", item: c })}
          onExcluir={() =>
            excluir(`Excluir a calibração de ${data(c.dataCalibracao)}? O certificado anexado também será apagado.`, () => excluirCalibracao(c.id), "Não foi possível excluir a calibração")
          }
        />
      ),
    }),
  ];

  const colunasManutencao: Coluna<ManutencaoDetalhe>[] = [
    { titulo: "Data", render: (m) => data(m.dataManutencao) },
    { titulo: "Tipo", render: (m) => <TipoManutencaoBadge tipo={m.tipo} /> },
    { titulo: "Próxima", render: (m) => data(m.proximaManutencaoPrevista) },
    { titulo: "Responsável", render: (m) => txt(m.responsavel) },
    { titulo: "Descrição", render: (m) => <span className="line-clamp-2 max-w-xs">{txt(m.descricao)}</span> },
    { titulo: "Custo", render: (m) => dinheiro(m.custo) },
    ...colunaAcoes<ManutencaoDetalhe>({
      titulo: "Ações",
      render: (m) => (
        <Acoes
          rotulo="manutenção"
          onEditar={() => setFormulario({ tipo: "manutencao", item: m })}
          onExcluir={() => excluir(`Excluir a manutenção de ${data(m.dataManutencao)}?`, () => excluirManutencao(m.id), "Não foi possível excluir a manutenção")}
        />
      ),
    }),
  ];

  const colunasAnalise: Coluna<AnaliseDetalhe>[] = [
    { titulo: "Data", render: (a) => data(a.dataAnalise) },
    { titulo: "Analista", render: (a) => a.analista },
    { titulo: "Resultado", render: (a) => <ConformeBadge conforme={a.conforme} /> },
    { titulo: "Parecer", render: (a) => <span className="line-clamp-2 max-w-sm">{a.parecer}</span> },
    { titulo: "Ação necessária", render: (a) => <span className="line-clamp-2 max-w-xs">{txt(a.acaoNecessaria)}</span> },
    { titulo: "Documento", render: (a) => <BotaoArquivo nome={a.arquivoNome} onAbrir={() => abrirArquivoAnalise(a.id).catch(falha("Não foi possível abrir o documento"))} /> },
    ...colunaAcoes<AnaliseDetalhe>({
      titulo: "Ações",
      render: (a) => (
        <Acoes
          rotulo="análise crítica"
          onEditar={() => setFormulario({ tipo: "analise", item: a })}
          onExcluir={() =>
            excluir(`Excluir a análise crítica de ${data(a.dataAnalise)}? O documento anexado também será apagado.`, () => excluirAnalise(a.id), "Não foi possível excluir a análise crítica")
          }
        />
      ),
    }),
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3 border-b border-slate-200 pb-4">
        <Link to={`/${setorSlug}/geral`} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
          <ArrowLeft size={14} aria-hidden /> Voltar para a lista
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-brand">
            {e.nome} <span className="font-normal text-slate-500">· {e.codigo}</span>
          </h1>
          {podeEditar && <div className="ml-auto flex gap-2">
            <Botao variante="secundario" onClick={() => setFormulario({ tipo: "equipamento" })}>
              <Pencil size={16} aria-hidden /> Editar
            </Botao>
            <Botao
              variante="perigo"
              onClick={() =>
                excluir(
                  `Excluir ${e.codigo} – ${e.nome}?\n\nTodo o histórico e os arquivos anexados também serão apagados. Isso não pode ser desfeito.`,
                  async () => {
                    await excluirEquipamento(e.id);
                    navegar(`/${setorSlug}/geral`);
                  },
                  "Não foi possível excluir o equipamento"
                )
              }
            >
              <Trash2 size={16} aria-hidden /> Excluir
            </Botao>
          </div>}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          <Dado rotulo="Qualificação"><QualificacaoBadge valor={e.qualificacao} /></Dado>
          <Dado rotulo="Status do equipamento"><StatusEquipamentoBadge status={e.status} /></Dado>
          <Dado rotulo="Calibração"><SituacaoBadge situacao={e.situacaoCalibracao} /></Dado>
          <Dado rotulo="Manutenção"><SituacaoBadge situacao={e.situacaoManutencao} /></Dado>
          <Dado rotulo="Amostrador">{txt(e.amostrador)}</Dado>
          <Dado rotulo="Nº de série">{txt(e.numeroSerie)}</Dado>
          <Dado rotulo="Modelo">{txt(e.modelo)}</Dado>
          <Dado rotulo="Fabricante">{txt(e.fabricante)}</Dado>
          <Dado rotulo="Localização atual">{txt(e.localizacaoAtual)}</Dado>
          {e.observacoes && <div className="col-span-full"><Dado rotulo="Observações">{e.observacoes}</Dado></div>}
        </dl>
      </div>

      {aviso && <Aviso tipo={aviso.tipo} onFechar={() => setAviso(null)}>{aviso.texto}</Aviso>}

      <Secao titulo="Calibrações" rotuloNovo="Nova calibração" onNovo={novo(() => setFormulario({ tipo: "calibracao", item: null }))}>
        <DataTable colunas={colunasCalibracao} linhas={e.calibracoes} chave={(c) => c.id} altura="max-h-96" vazio="Nenhuma calibração registrada." />
      </Secao>

      <Secao titulo="Manutenções" rotuloNovo="Nova manutenção" onNovo={novo(() => setFormulario({ tipo: "manutencao", item: null }))}>
        <DataTable colunas={colunasManutencao} linhas={e.manutencoes} chave={(m) => m.id} altura="max-h-96" vazio="Nenhuma manutenção registrada." />
      </Secao>

      <Secao titulo="Análises críticas" rotuloNovo="Nova análise crítica" onNovo={novo(() => setFormulario({ tipo: "analise", item: null }))}>
        <DataTable colunas={colunasAnalise} linhas={e.analisesCriticas} chave={(a) => a.id} altura="max-h-96" vazio="Nenhuma análise crítica registrada." />
      </Secao>

      {formulario?.tipo === "equipamento" && <EquipamentoForm setor={setorSlug} inicial={e} onFechar={fechar} onSalvo={() => salvo()} />}
      {formulario?.tipo === "calibracao" && <CalibracaoForm equipamentoId={e.id} inicial={formulario.item} onFechar={fechar} onSalvo={salvo} />}
      {formulario?.tipo === "manutencao" && <ManutencaoForm equipamentoId={e.id} inicial={formulario.item} onFechar={fechar} onSalvo={() => salvo()} />}
      {formulario?.tipo === "analise" && <AnaliseForm equipamentoId={e.id} inicial={formulario.item} onFechar={fechar} onSalvo={salvo} />}
    </div>
  );
}
