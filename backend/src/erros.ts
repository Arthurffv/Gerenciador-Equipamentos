import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/** Último middleware: transforma qualquer erro numa resposta JSON { erro, detalhes? }. */
export const tratarErros: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ erro: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      erro: "Dados inválidos",
      detalhes: err.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message })),
    });
    return;
  }

  if (err instanceof MulterError) {
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    res.status(tooBig ? 413 : 400).json({
      erro: tooBig ? "Arquivo maior que o limite de 20 MB" : "Falha no envio do arquivo",
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const alvo = JSON.stringify(err.meta ?? {}); // o campo repetido vem em formatos diferentes conforme o motor do Prisma
      res.status(409).json({
        erro: alvo.includes("email")
          ? "Já existe um usuário com esse e-mail"
          : "Já existe um registro com esses dados (código repetido neste setor?)",
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ erro: "Registro não encontrado" });
      return;
    }
  }

  // Erros do próprio Express (ex.: JSON malformado no corpo da requisição)
  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ erro: err.type === "entity.parse.failed" ? "JSON inválido" : "Requisição inválida" });
    return;
  }

  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor" });
};
