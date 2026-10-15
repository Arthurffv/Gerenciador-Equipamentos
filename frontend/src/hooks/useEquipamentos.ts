import { useEffect, useState } from "react";
import { buscarEquipamentos, type EquipamentoLinha } from "../api/equipamentos";

export function useEquipamentos(setor: string | undefined) {
  const [dados, setDados] = useState<EquipamentoLinha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!setor) return;
    const controle = new AbortController();
    setCarregando(true);
    setErro(null);

    buscarEquipamentos(setor, controle.signal)
      .then(setDados)
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        setErro(
          e instanceof TypeError
            ? "Não foi possível conectar à API. O backend está rodando (npm run dev)?"
            : e.message
        );
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });

    return () => controle.abort();
  }, [setor]);

  return { dados, carregando, erro };
}
