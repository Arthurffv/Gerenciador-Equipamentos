import { Navigate, useParams } from "react-router-dom";
import { abas, setores } from "../config/setores";

/**
 * Página genérica: /:setor/:aba
 * Ex.: /campo/geral, /laboratorio/calibracao, /vidrarias/manutencao
 * Por enquanto é um espaço reservado; as tabelas da planilha entram aqui.
 */
export default function SetorPage() {
  const { setor: setorSlug, aba: abaSlug } = useParams();

  const setor = setores.find((s) => s.slug === setorSlug);
  const aba = abas.find((a) => a.slug === abaSlug);

  if (!setor || !aba) return <Navigate to="/campo/geral" replace />;

  const Icon = setor.icon;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-brand">
          {setor.label} – {aba.label}
        </h1>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
          <Icon size={18} aria-hidden />
        </span>
      </div>

      <section
        aria-label={`${setor.label} – ${aba.label}`}
        className="grid min-h-[420px] place-items-center rounded-3xl border border-sky-200 bg-sky-100 text-sm text-slate-500"
      >
        Tabela de {aba.label.toLowerCase()} do setor {setor.label} (em construção)
      </section>
    </div>
  );
}
