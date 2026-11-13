import { Router } from "express";
import { prisma } from "../prisma";
import { HttpError } from "../erros";
import { validarId } from "../parametros";
import { serializarManutencao } from "../serializar";
import { manutencaoAtualizar, manutencaoCriar } from "../validacao";

export const manutencoesRouter = Router();
manutencoesRouter.param("id", validarId);

manutencoesRouter.post("/equipamentos/:id/manutencoes", async (req, res) => {
  const dados = manutencaoCriar.parse(req.body);
  const existe = await prisma.equipamento.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!existe) throw new HttpError(404, "Equipamento não encontrado");

  const criada = await prisma.manutencao.create({ data: { ...dados, equipamentoId: req.params.id } });
  res.status(201).json(serializarManutencao(criada));
});

manutencoesRouter.put("/manutencoes/:id", async (req, res) => {
  const dados = manutencaoAtualizar.parse(req.body);
  const atualizada = await prisma.manutencao.update({ where: { id: req.params.id }, data: dados });
  res.json(serializarManutencao(atualizada));
});

manutencoesRouter.delete("/manutencoes/:id", async (req, res) => {
  await prisma.manutencao.delete({ where: { id: req.params.id } }); // P2025 -> 404 no tratador de erros
  res.status(204).end();
});
