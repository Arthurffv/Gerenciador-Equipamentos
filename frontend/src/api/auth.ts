import { requisicao } from "./cliente";

export type Papel = "ADMIN" | "EDITOR" | "LEITOR";
export type Sessao = { id: string; nome: string; email: string; papel: Papel };

export const rotuloPapel: Record<Papel, string> = { ADMIN: "Administrador", EDITOR: "Editor", LEITOR: "Leitor" };

export const entrarNaApi = (email: string, senha: string) => requisicao<Sessao>("POST", "/api/auth/login", { email, senha });
export const sairDaApi = () => requisicao("POST", "/api/auth/logout");
export const buscarSessao = (signal?: AbortSignal) => requisicao<Sessao>("GET", "/api/auth/eu", undefined, signal);
export const trocarSenha = (senhaAtual: string, novaSenha: string) => requisicao("PUT", "/api/auth/senha", { senhaAtual, novaSenha });

// ───────────── Gestão de usuários (só administrador) ─────────────

export type UsuarioAdm = Sessao & { ativo: boolean; ultimoAcesso: string | null };
export type UsuarioDados = { nome: string; email: string; papel: Papel; senha?: string; ativo?: boolean };

export const listarUsuarios = (signal?: AbortSignal) => requisicao<UsuarioAdm[]>("GET", "/api/usuarios", undefined, signal);
export const criarUsuario = (dados: UsuarioDados) => requisicao<UsuarioAdm>("POST", "/api/usuarios", dados);
export const atualizarUsuario = (id: string, dados: Partial<UsuarioDados>) => requisicao<UsuarioAdm>("PUT", `/api/usuarios/${id}`, dados);
