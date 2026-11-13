import { useEffect, type RefObject } from "react";

/** Fecha um menu/popover ao clicar fora dele ou apertar Esc. */
export function useFecharFora(ref: RefObject<HTMLElement | null>, aberto: boolean, fechar: () => void) {
  useEffect(() => {
    if (!aberto) return;
    const clique = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) fechar();
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("mousedown", clique);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", clique);
      document.removeEventListener("keydown", tecla);
    };
  }, [ref, aberto, fechar]);
}
