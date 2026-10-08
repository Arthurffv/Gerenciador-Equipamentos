import { Map } from "lucide-react";
import StatusCards from "../components/dashboard/StatusCards";

export default function DashboardPage() {
  // TODO: trocar por dados da API (GET /api/dashboard/resumo)
  const counts = { atualizados: 6, alertas: 2, semComunicacao: 0, inativos: 0 };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-brand">Meus locais</h1>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
          <Map size={18} aria-hidden />
        </span>
      </div>

      <StatusCards counts={counts} />

      {/* Área principal: futuramente mapa (react-leaflet) ou tabela de equipamentos */}
      <section
        aria-label="Área principal"
        className="grid min-h-[420px] place-items-center rounded-3xl border border-sky-200 bg-sky-100 text-sm text-slate-500"
      >
        Mapa ou tabela de equipamentos
      </section>
    </div>
  );
}
