import { HttpError } from "./erros";

// slug da URL -> valor do enum Setor no banco
export const SETORES = {
  campo: "CAMPO",
  laboratorio: "LABORATORIO",
  vidrarias: "VIDRARIAS",
} as const;

export type SetorBanco = (typeof SETORES)[keyof typeof SETORES];

export function setorDoSlug(slug: string): SetorBanco {
  const setor = SETORES[slug as keyof typeof SETORES];
  if (!setor) throw new HttpError(404, "Setor inválido");
  return setor;
}
