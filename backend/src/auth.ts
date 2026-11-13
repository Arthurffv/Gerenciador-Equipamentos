import type { Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config";
import { HttpError } from "./erros";
import { prisma } from "./prisma";

export type Papel = "ADMIN" | "EDITOR" | "LEITOR";
export type UsuarioSessao = { id: string; nome: string; email: string; papel: Papel };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioSessao;
    }
  }
}

const NIVEL: Record<Papel, number> = { LEITOR: 1, EDITOR: 2, ADMIN: 3 };

const opcoesCookie = {
  httpOnly: true, // o JavaScript da página não consegue ler o token
  sameSite: "lax" as const,
  secure: config.auth.seguro,
  path: "/",
};

function lerCookie(req: Request, nome: string): string | null {
  for (const parte of (req.headers.cookie ?? "").split(";")) {
    const [chave, ...resto] = parte.trim().split("=");
    if (chave === nome) return decodeURIComponent(resto.join("="));
  }
  return null;
}

export function abrirSessao(res: Response, usuarioId: string) {
  const token = jwt.sign({}, config.auth.segredo, { subject: usuarioId, expiresIn: `${config.auth.horas}h` });
  res.cookie(config.auth.cookie, token, { ...opcoesCookie, maxAge: config.auth.horas * 3_600_000 });
}

export function encerrarSessao(res: Response) {
  res.clearCookie(config.auth.cookie, opcoesCookie);
}

/**
 * Exige sessão válida. O usuário é buscado no banco a cada requisição, então desativar
 * alguém ou mudar o perfil dele vale imediatamente (não espera o token expirar).
 */
export const exigirLogin: RequestHandler = async (req, _res, next) => {
  const token = lerCookie(req, config.auth.cookie);
  if (!token) throw new HttpError(401, "Faça login para continuar");

  let id: string | undefined;
  try {
    id = jwt.verify(token, config.auth.segredo).sub as string | undefined;
  } catch {
    throw new HttpError(401, "Sessão expirada. Faça login novamente");
  }

  const usuario = id ? await prisma.usuario.findUnique({ where: { id }, select: { id: true, nome: true, email: true, papel: true, ativo: true } }) : null;
  if (!usuario || !usuario.ativo) throw new HttpError(401, "Sessão inválida. Faça login novamente");

  req.usuario = { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel };
  next();
};

/** Exige pelo menos este perfil (LEITOR < EDITOR < ADMIN). Use depois de exigirLogin. */
export const exigirPapel =
  (minimo: Papel): RequestHandler =>
  (req, _res, next) => {
    if (!req.usuario || NIVEL[req.usuario.papel] < NIVEL[minimo]) {
      throw new HttpError(403, "Você não tem permissão para esta ação");
    }
    next();
  };

/** Consultar (GET) vale para qualquer perfil; criar, editar e excluir exigem Editor ou Administrador. */
export const exigirEscrita: RequestHandler = (req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD") return next();
  return exigirPapel("EDITOR")(req, res, next);
};

/**
 * Proteção contra CSRF: requisição que altera dados e que o navegador marca como vinda de outro site é recusada.
 * O cookie SameSite=Lax já barra a maioria, mas o upload (multipart) é uma "requisição simples" que dispensa o CORS
 * e pode partir de outra porta do mesmo site. Sem cabeçalho Origin (curl, scripts) a requisição passa: só o navegador
 * pode ser enganado a usar o cookie do usuário.
 */
export const exigirOrigemConfiavel: RequestHandler = (req, _res, next) => {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
  const origem = req.headers.origin;
  if (origem && !config.frontendOrigens.includes(origem)) throw new HttpError(403, "Origem não autorizada");
  next();
};

// ───────────── Limite de tentativas de login ─────────────

const MAX_FALHAS = 5;
const JANELA_MS = 15 * 60_000;
const falhas = new Map<string, { quantidade: number; desde: number }>();

/** Lança 429 se este e-mail/IP já errou a senha vezes demais. */
export function verificarTentativas(chave: string) {
  const f = falhas.get(chave);
  if (!f) return;
  if (Date.now() - f.desde > JANELA_MS) {
    falhas.delete(chave);
    return;
  }
  if (f.quantidade >= MAX_FALHAS) {
    const minutos = Math.ceil((JANELA_MS - (Date.now() - f.desde)) / 60_000);
    throw new HttpError(429, `Muitas tentativas de login. Tente de novo em ${minutos} min.`);
  }
}

export function registrarFalha(chave: string) {
  const f = falhas.get(chave);
  if (!f || Date.now() - f.desde > JANELA_MS) falhas.set(chave, { quantidade: 1, desde: Date.now() });
  else f.quantidade++;
}

export const limparFalhas = (chave: string) => falhas.delete(chave);
