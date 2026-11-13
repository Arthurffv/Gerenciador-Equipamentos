import type { ButtonHTMLAttributes } from "react";

const variantes = {
  primario: "bg-brand text-white hover:bg-brand-dark disabled:bg-brand/50",
  secundario: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  perigo: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
} as const;

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: keyof typeof variantes };

export default function Botao({ variante = "primario", className = "", type = "button", ...resto }: BotaoProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed ${variantes[variante]} ${className}`}
      {...resto}
    />
  );
}

/** Botão pequeno só com ícone (ações nas linhas das tabelas). */
export function BotaoIcone({ rotulo, className = "", ...resto }: ButtonHTMLAttributes<HTMLButtonElement> & { rotulo: string }) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      className={`rounded-md p-1.5 text-slate-600 hover:bg-slate-200 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${className}`}
      {...resto}
    />
  );
}
