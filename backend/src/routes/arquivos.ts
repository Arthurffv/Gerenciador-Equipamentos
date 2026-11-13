import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { config } from "../config";
import { HttpError } from "../erros";
import { TIPOS_PERMITIDOS, conteudoCombinaComExtensao, enviarArquivo, extensaoDe, linkDoArquivo, removerArquivos } from "../storage";

/** Recebe o arquivo em memória (limite de 20 MB) e já recusa extensões não permitidas. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    // o multer entrega o nome em latin1: reconverte para UTF-8 (acentos)
    file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
    if (TIPOS_PERMITIDOS[extensaoDe(file.originalname)]) cb(null, true);
    else cb(new HttpError(415, `Tipo de arquivo não permitido. Use: ${Object.keys(TIPOS_PERMITIDOS).join(", ")}`));
  },
});

/** Como a rota enxerga o registro dono do arquivo (calibração ou análise crítica). */
export type DonoDoArquivo = {
  /** Subpasta no bucket, ex.: "calibracoes" */
  pasta: string;
  /** Sufixo da rota, ex.: "certificado" -> /calibracoes/:id/certificado */
  rota: string;
  /** Prefixo da coleção na URL, ex.: "calibracoes" */
  colecao: string;
  buscar: (id: string) => Promise<{ equipamentoId: string; chave: string | null; nome: string | null } | null>;
  salvar: (id: string, chave: string | null, nome: string | null) => Promise<unknown>;
};

/**
 * Registra no router:
 *   POST   /:colecao/:id/:rota   (multipart, campo "arquivo")  envia ou substitui
 *   GET    /:colecao/:id/:rota   -> { url, nome, expiraEmSegundos }  (?baixar=1 força download)
 *   DELETE /:colecao/:id/:rota   remove
 */
export function rotasDeArquivo(router: Router, dono: DonoDoArquivo) {
  const caminho = `/${dono.colecao}/:id/${dono.rota}`;

  router.post(caminho, upload.single("arquivo"), async (req, res) => {
    const id = String(req.params.id);
    if (!req.file) throw new HttpError(400, 'Envie o arquivo no campo "arquivo"');

    const atual = await dono.buscar(id);
    if (!atual) throw new HttpError(404, "Registro não encontrado");

    const ext = extensaoDe(req.file.originalname);
    if (req.file.size === 0) throw new HttpError(400, "O arquivo está vazio");
    if (!conteudoCombinaComExtensao(ext, req.file.buffer)) {
      throw new HttpError(400, `O conteúdo do arquivo não é um ${ext} válido (corrompido ou de outro tipo renomeado?)`);
    }
    const chave = `${dono.pasta}/${atual.equipamentoId}/${id}/${randomUUID()}${ext}`;

    await enviarArquivo(chave, req.file.buffer, TIPOS_PERMITIDOS[ext]);
    try {
      await dono.salvar(id, chave, req.file.originalname);
    } catch (err) {
      await removerArquivos([chave]); // não deixa arquivo órfão no MinIO
      throw err;
    }
    await removerArquivos([atual.chave]); // substituição: apaga o anterior

    res.status(201).json({ nome: req.file.originalname });
  });

  router.get(caminho, async (req, res) => {
    const atual = await dono.buscar(String(req.params.id));
    if (!atual) throw new HttpError(404, "Registro não encontrado");
    if (!atual.chave) throw new HttpError(404, "Nenhum arquivo anexado");

    const nome = atual.nome ?? "arquivo";
    const url = await linkDoArquivo(atual.chave, nome, req.query.baixar === "1");
    res.json({ url, nome, expiraEmSegundos: config.linkExpiraEmSegundos });
  });

  router.delete(caminho, async (req, res) => {
    const id = String(req.params.id);
    const atual = await dono.buscar(id);
    if (!atual) throw new HttpError(404, "Registro não encontrado");

    await dono.salvar(id, null, null);
    await removerArquivos([atual.chave]);
    res.status(204).end();
  });
}
