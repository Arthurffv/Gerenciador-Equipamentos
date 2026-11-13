import path from "node:path";
import { Client } from "minio";
import { config } from "./config";
import { HttpError } from "./erros";

const { bucket, ...conexao } = config.minio;
const client = new Client(conexao);

/** Tipos aceitos nos anexos. O Content-Type vem da extensão, não do que o navegador declarou. */
export const TIPOS_PERMITIDOS: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export const extensaoDe = (nome: string) => path.extname(nome).toLowerCase();

const comeca = (b: Buffer, ...bytes: number[]) => bytes.every((x, i) => b[i] === x);

/** Confere os primeiros bytes do arquivo: barra arquivo corrompido ou de outro tipo renomeado (ex.: página HTML chamada de .pdf). */
export function conteudoCombinaComExtensao(ext: string, b: Buffer): boolean {
  switch (ext) {
    case ".pdf":
      return b.subarray(0, 1024).includes("%PDF-"); // a norma admite lixo antes do cabeçalho, até 1 KB
    case ".png":
      return comeca(b, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case ".jpg":
    case ".jpeg":
      return comeca(b, 0xff, 0xd8, 0xff);
    case ".docx":
    case ".xlsx":
      return comeca(b, 0x50, 0x4b, 0x03, 0x04); // são arquivos ZIP
    case ".doc":
    case ".xls":
      return comeca(b, 0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1); // formato antigo do Office
    default:
      return false;
  }
}

function indisponivel(err: unknown): never {
  console.error("[storage]", err);
  throw new HttpError(503, "Armazenamento de arquivos indisponível. O MinIO está rodando (docker compose up -d)?");
}

/** Cria o bucket se não existir. Chamado na inicialização da API. */
export async function garantirBucket(): Promise<void> {
  if (!(await client.bucketExists(bucket))) {
    await client.makeBucket(bucket);
    console.log(`Bucket "${bucket}" criado no MinIO.`);
  }
}

export async function enviarArquivo(chave: string, conteudo: Buffer, contentType: string): Promise<void> {
  try {
    await client.putObject(bucket, chave, conteudo, conteudo.length, { "Content-Type": contentType });
  } catch (err) {
    indisponivel(err);
  }
}

/** Link temporário de leitura. O arquivo nunca é público: quem não tem o link não acessa. */
export async function linkDoArquivo(chave: string, nomeOriginal: string, baixar: boolean): Promise<string> {
  const nomeCodificado = encodeURIComponent(nomeOriginal).replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  const tipo = TIPOS_PERMITIDOS[extensaoDe(nomeOriginal)] ?? "application/octet-stream";
  try {
    return await client.presignedGetObject(bucket, chave, config.linkExpiraEmSegundos, {
      "response-content-disposition": `${baixar ? "attachment" : "inline"}; filename*=UTF-8''${nomeCodificado}`,
      "response-content-type": tipo,
    });
  } catch (err) {
    indisponivel(err);
  }
}

/** Remoção "melhor esforço": se falhar, só avisa no log (o registro no banco já foi tratado). */
export async function removerArquivos(chaves: (string | null | undefined)[]): Promise<void> {
  for (const chave of chaves) {
    if (!chave) continue;
    try {
      await client.removeObject(bucket, chave);
    } catch (err) {
      console.warn(`[storage] não foi possível remover "${chave}":`, err);
    }
  }
}
