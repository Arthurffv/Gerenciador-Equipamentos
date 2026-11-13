import { CircleCheck, CircleHelp, CircleX, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Contagem } from "../../api/painel";

type StatusCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  className: string; // cor de fundo e do texto
};

function StatusCard({ label, value, icon: Icon, className }: StatusCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 ${className}`}>
      <p className="text-sm font-bold">{label}</p>
      <Icon aria-hidden size={64} strokeWidth={1.5} className="absolute bottom-2 left-4 opacity-20" />
      <p className="mt-6 text-right text-5xl font-bold leading-none">{value}</p>
    </div>
  );
}

/** Quatro cartões (Em dia, À vencer, Vencidos, Sem registro) para calibração ou manutenção. */
export default function StatusCards({ titulo, contagem }: { titulo: string; contagem: Contagem }) {
  const naoSeAplica = contagem.NAO_PRECISA + contagem.OBSOLETO;
  return (
    <section aria-label={titulo} className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="text-lg font-bold text-brand">{titulo}</h2>
        {naoSeAplica > 0 && <p className="text-xs text-slate-500">{naoSeAplica} sem exigência (obsoletos ou não críticos)</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatusCard label="Em dia" value={contagem.NAO_VENCIDO} icon={CircleCheck} className="bg-status-ok text-white" />
        <StatusCard label="À vencer (30 dias)" value={contagem.A_VENCER} icon={TriangleAlert} className="bg-status-warn text-slate-900" />
        <StatusCard label="Vencidos" value={contagem.VENCIDO} icon={CircleX} className="bg-status-off text-white" />
        <StatusCard label="Sem registro" value={contagem.SEM_REGISTRO} icon={CircleHelp} className="bg-status-idle text-white" />
      </div>
    </section>
  );
}
