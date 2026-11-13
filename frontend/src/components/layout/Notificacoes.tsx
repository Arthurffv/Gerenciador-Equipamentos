import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import type { Painel } from "../../api/painel";
import { useFecharFora } from "../../hooks/useFecharFora";
import { textoPrazo } from "../dashboard/prazo";

/** Sino com o número de vencimentos (calibração e manutenção vencidas ou a vencer) e os mais urgentes. */
export default function Notificacoes({ painel }: { painel: Painel | null }) {
  const raiz = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  useFecharFora(raiz, aberto, () => setAberto(false));

  const total = painel?.alertas ?? 0;
  const lista = painel?.vencimentos.slice(0, 6) ?? [];

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-label={`Notificações${total ? ` (${total} vencimentos)` : ""}`}
        className="relative text-slate-600 hover:text-brand"
      >
        <Bell size={22} />
        {total > 0 && (
          <span className="absolute -right-3 -top-2 rounded-full bg-status-off px-1.5 text-[10px] font-bold leading-4 text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-20 mt-3 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <p className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-brand">Vencimentos</p>
          {lista.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-500">Nada vencido nem para vencer nos próximos 30 dias.</p>
          ) : (
            <ul>
              {lista.map((v) => (
                <li key={`${v.equipamentoId}-${v.tipo}`}>
                  <Link to={`/equipamentos/${v.equipamentoId}`} onClick={() => setAberto(false)} className="block px-4 py-2.5 hover:bg-slate-50">
                    <span className="block text-sm font-medium text-slate-800">
                      {v.nome} <span className="font-normal text-slate-500">· {v.codigo}</span>
                    </span>
                    <span className={`block text-xs ${v.situacao === "VENCIDO" ? "font-medium text-red-600" : "text-amber-700"}`}>
                      {v.tipo === "CALIBRACAO" ? "Calibração" : "Manutenção"}: {textoPrazo(v.dias)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link to="/" onClick={() => setAberto(false)} className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-medium text-brand hover:bg-slate-50">
            Ver tudo no painel
          </Link>
        </div>
      )}
    </div>
  );
}
