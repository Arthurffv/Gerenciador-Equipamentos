import { X } from "lucide-react";

type AvisoProps = { tipo?: "erro" | "info"; children: string; onFechar: () => void };

/** Faixa de aviso dispensável (falha ao excluir, arquivo que não subiu...). */
export default function Aviso({ tipo = "erro", children, onFechar }: AvisoProps) {
  const cor = tipo === "erro" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <p role={tipo === "erro" ? "alert" : "status"} className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${cor}`}>
      <span>{children}</span>
      <button type="button" onClick={onFechar} aria-label="Dispensar aviso" className="shrink-0 rounded p-0.5 hover:bg-black/5">
        <X size={16} />
      </button>
    </p>
  );
}
