import { useEffect, useEffectEvent, useState } from "react";

type Estado<T> = { chave: string; dados: T | null; erro: string | null };

/**
 * Busca dados quando `chave` muda e permite recarregar (`recarregar()`) depois de salvar/excluir.
 * Ao recarregar, os dados antigos continuam na tela até os novos chegarem (sem "piscar").
 * Passe `chave` undefined para não buscar nada.
 * `refrescar`: quando este valor muda, busca de novo mantendo os dados antigos na tela (ex.: pathname).
 */
export function useCarregar<T>(chave: string | undefined, buscar: (signal: AbortSignal) => Promise<T>, refrescar?: unknown) {
  const [estado, setEstado] = useState<Estado<T> | null>(null);
  const [versao, setVersao] = useState(0);
  const buscarAgora = useEffectEvent(buscar);

  useEffect(() => {
    if (!chave) return;
    const controle = new AbortController();

    buscarAgora(controle.signal)
      .then((dados) => setEstado({ chave, dados, erro: null }))
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        setEstado({ chave, dados: null, erro: e.message });
      });

    return () => controle.abort();
  }, [chave, versao, refrescar]);

  const atual = estado?.chave === chave ? estado : null;
  return {
    dados: atual?.dados ?? null,
    erro: atual?.erro ?? null,
    carregando: !!chave && !atual,
    recarregar: () => setVersao((v) => v + 1),
  };
}
