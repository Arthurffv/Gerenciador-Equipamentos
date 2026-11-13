import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (senha: string, salt: Buffer, tamanho: number) => Promise<Buffer>;

/** Formato guardado no banco: scrypt$<salt>$<hash> (ambos em base64). Nunca se guarda a senha. */
export async function gerarHash(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(senha, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function conferirSenha(senha: string, guardado: string): Promise<boolean> {
  const [algoritmo, saltB64, hashB64] = guardado.split("$");
  if (algoritmo !== "scrypt" || !saltB64 || !hashB64) return false;
  const esperado = Buffer.from(hashB64, "base64");
  const calculado = await scrypt(senha, Buffer.from(saltB64, "base64"), esperado.length);
  return timingSafeEqual(calculado, esperado);
}

/** Usado quando o e-mail não existe, para o tempo de resposta não revelar quais e-mails estão cadastrados. */
export const hashFalso = gerarHash("senha-que-ninguem-usa");
