import { createContext, useContext } from "react";
import type { Sessao } from "../api/auth";

export type AuthValor = {
  usuario: Sessao | null;
  /** true enquanto confere se já existe sessão aberta (ao carregar a página) */
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  /** Administrador e Editor cadastram, editam e excluem; Leitor só consulta. */
  podeEditar: boolean;
  ehAdmin: boolean;
};

export const AuthContext = createContext<AuthValor | null>(null);

export function useAuth(): AuthValor {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return valor;
}
