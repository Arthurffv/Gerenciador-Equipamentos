import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

export const buscaRouter = Router();

const consulta = z.object({ q: z.string().trim().min(2, "Digite pelo menos 2 letras").max(100) });

const semAcento = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Busca global (cabeçalho): nome, código, série, modelo, fabricante ou amostrador, em todos os setores.
 * Compara em memória, sem acento e sem diferenciar maiúsculas (igual ao filtro das tabelas), e sem os
 * curingas do SQL (% e _) que a busca do banco trataria como "qualquer coisa". Para algumas centenas
 * de equipamentos isso é instantâneo; se passar de alguns milhares, vale mover para o banco (extensão unaccent).
 */
buscaRouter.get("/busca", async (req, res) => {
  const { q } = consulta.parse(req.query);
  const termo = semAcento(q);

  const todos = await prisma.equipamento.findMany({
    orderBy: [{ nome: "asc" }, { codigo: "asc" }],
    select: { id: true, setor: true, codigo: true, nome: true, modelo: true, fabricante: true, numeroSerie: true, amostrador: true },
  });

  const achados = todos
    .filter((e) => [e.nome, e.codigo, e.numeroSerie, e.modelo, e.fabricante, e.amostrador].some((v) => v && semAcento(v).includes(termo)))
    .slice(0, 8);

  res.json(achados.map((e) => ({ id: e.id, setor: e.setor.toLowerCase(), codigo: e.codigo, nome: e.nome, modelo: e.modelo, fabricante: e.fabricante })));
});
