import { Link, useOutletContext } from "react-router-dom";
import { Gauge, LayoutDashboard, Wrench } from "lucide-react";
import type { Contagem } from "../api/painel";
import { setores } from "../config/setores";
import { data } from "../utils/formatar";
import type { PainelContexto } from "../components/layout/Layout";
import StatusCards from "../components/dashboard/StatusCards";
import { textoPrazo } from "../components/dashboard/prazo";

const rotuloSetor = (slug: string) => setores.find((s) => s.slug === slug)?.label ?? slug;

/** Número em vermelho/âmbar quando há pendência; cinza quando zero. */
function Numero({ valor, tom }: { valor: number; tom: "vermelho" | "ambar" | "neutro" }) {
  const cor = valor === 0 || tom === "neutro" ? "text-slate-500" : tom === "vermelho" ? "font-bold text-red-600" : "font-bold text-amber-700";
  return <span className={cor}>{valor}</span>;
}

const pendencias = (c: Contagem) => c.VENCIDO + c.A_VENCER;

export default function DashboardPage() {
  const { painel, erro } = useOutletContext<PainelContexto>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-brand">Painel</h1>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
          <LayoutDashboard size={18} aria-hidden />
        </span>
        {painel && (
          <p className="ml-auto hidden text-sm text-slate-500 sm:block">
            {painel.totais.equipamentos} equipamentos · {painel.totais.emUso} em uso
            {painel.totais.emManutencao > 0 && ` · ${painel.totais.emManutencao} em manutenção`}
            {painel.totais.foraDeUso > 0 && ` · ${painel.totais.foraDeUso} fora de uso`}
          </p>
        )}
      </div>

      {erro && !painel && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>
      )}
      {!painel && !erro && <p className="py-10 text-center text-slate-500">Carregando...</p>}

      {painel && (
        <>
          <StatusCards titulo="Calibrações" contagem={painel.calibracao} />
          <StatusCards titulo="Manutenções" contagem={painel.manutencao} />

          <section aria-label="Vencimentos" className="space-y-3">
            <h2 className="text-lg font-bold text-brand">Vencimentos</h2>
            {painel.vencimentos.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                Nenhuma calibração ou manutenção vencida ou para vencer nos próximos 30 dias.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                {painel.vencimentos.map((v) => {
                  const Icone = v.tipo === "CALIBRACAO" ? Gauge : Wrench;
                  const vencido = v.situacao === "VENCIDO";
                  return (
                    <li key={`${v.equipamentoId}-${v.tipo}`}>
                      <Link to={`/equipamentos/${v.equipamentoId}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-slate-50">
                        <Icone size={18} aria-hidden className={vencido ? "text-red-600" : "text-amber-600"} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-800">
                            {v.nome} <span className="font-normal text-slate-500">· {v.codigo} · {rotuloSetor(v.setor)}</span>
                          </span>
                          <span className="block text-xs text-slate-500">
                            {v.tipo === "CALIBRACAO" ? "Calibração" : "Manutenção"} prevista para {data(v.data)}
                          </span>
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${vencido ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                          {textoPrazo(v.dias)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {painel.alertas > painel.vencimentos.length && (
              <p className="text-xs text-slate-500">
                Mostrando os {painel.vencimentos.length} mais urgentes de {painel.alertas}. Veja o restante nas abas de cada setor.
              </p>
            )}
          </section>

          <section aria-label="Situação por setor" className="space-y-3">
            <h2 className="text-lg font-bold text-brand">Por setor</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Equipamentos e pendências de cada setor</caption>
                <thead className="bg-brand text-white">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Setor</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Equipamentos</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Calibrações vencidas</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">À vencer</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Manutenções vencidas</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">À vencer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {painel.porSetor.map((s) => (
                    <tr key={s.setor} className="hover:bg-slate-50">
                      <th scope="row" className="px-4 py-2.5 font-medium">
                        <Link to={`/${s.setor}/calibracao`} className="text-brand hover:underline">{rotuloSetor(s.setor)}</Link>
                      </th>
                      <td className="px-4 py-2.5"><Numero valor={s.equipamentos} tom="neutro" /></td>
                      <td className="px-4 py-2.5"><Numero valor={s.calibracao.VENCIDO} tom="vermelho" /></td>
                      <td className="px-4 py-2.5"><Numero valor={s.calibracao.A_VENCER} tom="ambar" /></td>
                      <td className="px-4 py-2.5"><Numero valor={s.manutencao.VENCIDO} tom="vermelho" /></td>
                      <td className="px-4 py-2.5"><Numero valor={s.manutencao.A_VENCER} tom="ambar" /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200 bg-slate-50 text-slate-700">
                  <tr>
                    <th scope="row" className="px-4 py-2.5 font-semibold">Total</th>
                    <td className="px-4 py-2.5 font-semibold">{painel.totais.equipamentos}</td>
                    <td className="px-4 py-2.5 font-semibold">{painel.calibracao.VENCIDO}</td>
                    <td className="px-4 py-2.5 font-semibold">{painel.calibracao.A_VENCER}</td>
                    <td className="px-4 py-2.5 font-semibold">{painel.manutencao.VENCIDO}</td>
                    <td className="px-4 py-2.5 font-semibold">{painel.manutencao.A_VENCER}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-xs text-slate-500">
              {pendencias(painel.calibracao) + pendencias(painel.manutencao)} pendência(s) no total, somando calibrações e manutenções.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
