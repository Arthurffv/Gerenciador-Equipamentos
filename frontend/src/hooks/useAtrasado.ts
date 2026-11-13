import { useEffect, useState } from "react";

/** Devolve `valor` só depois de `ms` sem mudar (evita buscar a cada tecla digitada). */
export function useAtrasado<T>(valor: T, ms = 250): T {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return atrasado;
}
