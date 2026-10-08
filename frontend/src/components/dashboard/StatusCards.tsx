import { CircleCheck, TriangleAlert, WifiOff, Power, type LucideIcon } from "lucide-react";

type StatusCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  className: string; // cor de fundo
};

function StatusCard({ label, value, icon: Icon, className }: StatusCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 text-white ${className}`}>
      <p className="text-sm font-bold">{label}</p>
      <Icon
        aria-hidden
        size={64}
        strokeWidth={1.5}
        className="absolute bottom-2 left-4 opacity-20"
      />
      <p className="mt-6 text-right text-5xl font-bold leading-none">{value}</p>
    </div>
  );
}

export type StatusCounts = {
  atualizados: number;
  alertas: number;
  semComunicacao: number;
  inativos: number;
};

export default function StatusCards({ counts }: { counts: StatusCounts }) {
  return (
    <section aria-label="Resumo de status" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatusCard label="Atualizados" value={counts.atualizados} icon={CircleCheck} className="bg-status-ok" />
      <StatusCard label="Alertas" value={counts.alertas} icon={TriangleAlert} className="bg-status-warn" />
      <StatusCard label="Sem comunicação" value={counts.semComunicacao} icon={WifiOff} className="bg-status-off" />
      <StatusCard label="Inativos" value={counts.inativos} icon={Power} className="bg-status-idle" />
    </section>
  );
}
