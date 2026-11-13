import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { buscarSessao, entrarNaApi, sairDaApi, type Sessao } from "../api/auth";
import { definirAoNaoAutorizado } from "../api/cliente";
import { AuthContext, type AuthValor } from "./contexto";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<{ usuario: Sessao | null; carregando: boolean }>({ usuario: null, carregando: true });

  useEffect(() => {
    const controle = new AbortController();
    buscarSessao(controle.signal)
      .then((usuario) => setEstado({ usuario, carregando: false }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setEstado({ usuario: null, carregando: false }); // sem sessão: mostra o login
      });

    // Sessão caiu no meio do uso (expirou, usuário desativado): volta para o login
    definirAoNaoAutorizado(() => setEstado({ usuario: null, carregando: false }));
    return () => {
      controle.abort();
      definirAoNaoAutorizado(null);
    };
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const usuario = await entrarNaApi(email, senha);
    setEstado({ usuario, carregando: false });
  }, []);

  const sair = useCallback(async () => {
    try {
      await sairDaApi();
    } finally {
      setEstado({ usuario: null, carregando: false });
    }
  }, []);

  const valor = useMemo<AuthValor>(
    () => ({
      usuario: estado.usuario,
      carregando: estado.carregando,
      entrar,
      sair,
      podeEditar: estado.usuario?.papel === "ADMIN" || estado.usuario?.papel === "EDITOR",
      ehAdmin: estado.usuario?.papel === "ADMIN",
    }),
    [estado, entrar, sair]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
