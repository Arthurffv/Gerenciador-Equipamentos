import type { RequestParamHandler } from "express";
import { HttpError } from "./erros";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Todo `:id` da API é um UUID. Qualquer outra coisa (aspas, byte nulo, texto) é "não encontrado", sem ir ao banco. */
export const validarId: RequestParamHandler = (_req, _res, next, valor) => {
  if (!UUID.test(String(valor))) throw new HttpError(404, "Registro não encontrado");
  next();
};
