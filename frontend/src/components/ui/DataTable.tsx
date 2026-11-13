import type { ReactNode } from "react";

export type Coluna<T> = {
  titulo: string;
  render: (linha: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  colunas: Coluna<T>[];
  linhas: T[];
  chave: (linha: T) => string;
  vazio?: string;
  /** Classes de altura máxima da área rolável (padrão: 62% da tela). */
  altura?: string;
};

export default function DataTable<T>({ colunas, linhas, chave, vazio = "Nenhum registro encontrado.", altura = "max-h-[62vh]" }: DataTableProps<T>) {
  return (
    <div className={`${altura} overflow-auto rounded-2xl border border-slate-200`}>
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-brand text-white">
          <tr>
            {colunas.map((c) => (
              <th key={c.titulo} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {linhas.map((linha) => (
            <tr key={chave(linha)} className="odd:bg-white even:bg-slate-50/70 hover:bg-sky-50">
              {colunas.map((c) => (
                <td key={c.titulo} className={`px-3 py-2 text-slate-700 ${c.className ?? ""}`}>
                  {c.render(linha)}
                </td>
              ))}
            </tr>
          ))}
          {linhas.length === 0 && (
            <tr>
              <td colSpan={colunas.length} className="px-3 py-10 text-center text-slate-500">
                {vazio}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
