import { Router } from "express";
import { prisma } from "../prisma";
import { HttpError } from "../erros";
import { validarId } from "../parametros";
import { serializarCalibracao } from "../serializar";
import { calibracaoAtualizar, calibracaoCriar } from "../validacao";
import { removerArquivos } from "../storage";
import { rotasDeArquivo } from "./arquivos";

export const calibracoesRouter = Router();
calibracoesRouter.param("id", validarId);

calibracoesRouter.post("/equipamentos/:id/calibracoes", async (req, res) => {
  const dados = calibracaoCriar.parse(req.body);
  const existe = await prisma.equipamento.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!existe) throw new HttpError(404, "Equipamento não encontrado");

  const criada = await prisma.calibracao.create({ data: { ...dados, equipamentoId: req.params.id } });
  res.status(201).json(serializarCalibracao(criada));
});

calibracoesRouter.put("/calibracoes/:id", async (req, res) => {
  const dados = calibracaoAtualizar.parse(req.body);
  const atualizada = await prisma.calibracao.update({ where: { id: req.params.id }, data: dados });
  res.json(serializarCalibracao(atualizada));
});

calibracoesRouter.delete("/calibracoes/:id", async (req, res) => {
  const atual = await prisma.calibracao.findUnique({ where: { id: req.params.id }, select: { certificadoKey: true } });
  if (!atual) throw new HttpError(404, "Calibração não encontrada");

  await prisma.calibracao.delete({ where: { id: req.params.id } });
  await removerArquivos([atual.certificadoKey]);
  res.status(204).end();
});

// Certificado: POST/GET/DELETE /api/calibracoes/:id/certificado
rotasDeArquivo(calibracoesRouter, {
  pasta: "calibracoes",
  colecao: "calibracoes",
  rota: "certificado",
  buscar: async (id) => {
    const c = await prisma.calibracao.findUnique({
      where: { id },
      select: { equipamentoId: true, certificadoKey: true, certificadoNome: true },
    });
    return c && { equipamentoId: c.equipamentoId, chave: c.certificadoKey, nome: c.certificadoNome };
  },
  salvar: (id, chave, nome) =>
    prisma.calibracao.update({
      where: { id },
      data: { certificadoKey: chave, certificadoNome: nome, certificadoUrl: null },
    }),
});
