import { Router } from "express";
import { prisma } from "../prisma";
import { HttpError } from "../erros";
import { validarId } from "../parametros";
import { serializarAnalise } from "../serializar";
import { analiseAtualizar, analiseCriar } from "../validacao";
import { removerArquivos } from "../storage";
import { rotasDeArquivo } from "./arquivos";

export const analisesRouter = Router();
analisesRouter.param("id", validarId);

analisesRouter.post("/equipamentos/:id/analises-criticas", async (req, res) => {
  const dados = analiseCriar.parse(req.body);
  const existe = await prisma.equipamento.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!existe) throw new HttpError(404, "Equipamento não encontrado");

  const criada = await prisma.analiseCritica.create({ data: { ...dados, equipamentoId: req.params.id } });
  res.status(201).json(serializarAnalise(criada));
});

analisesRouter.put("/analises-criticas/:id", async (req, res) => {
  const dados = analiseAtualizar.parse(req.body);
  const atualizada = await prisma.analiseCritica.update({ where: { id: req.params.id }, data: dados });
  res.json(serializarAnalise(atualizada));
});

analisesRouter.delete("/analises-criticas/:id", async (req, res) => {
  const atual = await prisma.analiseCritica.findUnique({ where: { id: req.params.id }, select: { arquivoKey: true } });
  if (!atual) throw new HttpError(404, "Análise crítica não encontrada");

  await prisma.analiseCritica.delete({ where: { id: req.params.id } });
  await removerArquivos([atual.arquivoKey]);
  res.status(204).end();
});

// Documento da análise: POST/GET/DELETE /api/analises-criticas/:id/arquivo
rotasDeArquivo(analisesRouter, {
  pasta: "analises",
  colecao: "analises-criticas",
  rota: "arquivo",
  buscar: async (id) => {
    const a = await prisma.analiseCritica.findUnique({
      where: { id },
      select: { equipamentoId: true, arquivoKey: true, arquivoNome: true },
    });
    return a && { equipamentoId: a.equipamentoId, chave: a.arquivoKey, nome: a.arquivoNome };
  },
  salvar: (id, chave, nome) => prisma.analiseCritica.update({ where: { id }, data: { arquivoKey: chave, arquivoNome: nome } }),
});
