import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  largura?: string;
};

/** Usa o <dialog> nativo: já traz foco preso, tecla Esc e leitura correta por leitores de tela. */
export default function Modal({ titulo, onFechar, children, largura = "max-w-2xl" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onFechar}
      onClick={(e) => e.target === ref.current && ref.current?.close()} // clique no fundo escuro
      aria-label={titulo}
      className={`w-[calc(100%-2rem)] ${largura} overflow-hidden rounded-2xl bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-black/40`}
    >
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-brand">{titulo}</h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
