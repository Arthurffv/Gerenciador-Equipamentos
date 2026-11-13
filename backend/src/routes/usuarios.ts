import { Router } from "express";
import type { Usuario } from "@prisma/client";
import { exigirPapel } from "../auth";
import { HttpError } from "../erros";
import { validarId } from "../parametros";
import { prisma } from "../prisma";
import { gerarHash } from "../senha";
import { usuarioAtualizar, usuarioCriar } from "../validacao";

export const usuariosRouter = Router();
usuariosRouter.param("id", validarId);
usuariosRouter.use(exigirPapel("ADMIN"));

const serializar = (u: Usuario) => ({
  id: u.id,
  nome: u.nome,
  email: u.email,
  papel: u.papel,
  ativo: u.ativo,
  ultimoAcesso: u.ultimoAcesso ? u.ultimoAcesso.toISOString() : null,
});

usuariosRouter.get("/", async (_req, res) => {
  const usuarios = await prisma.usuario.findMany({ orderBy: { nome: "asc" } });
  res.json(usuarios.map(serializar));
});

usuariosRouter.post("/", async (req, res) => {
  const { senha, ...dados } = usuarioCriar.parse(req.body);
  const criado = await prisma.usuario.create({ data: { ...dados, senhaHash: await gerarHash(senha) } });
  res.status(201).json(serializar(criado));
});

// Não há exclusão: desative o usuário (some do login, mas o registro continua).
usuariosRouter.put("/:id", async (req, res) => {
  const { senha, ...dados } = usuarioAtualizar.parse(req.body);
  const atual = await prisma.usuario.findUnique({ where: { id: req.params.id } });
  if (!atual) throw new HttpError(404, "Usuário não encontrado");

  // Evita o administrador se trancar para fora do sistema.
  if (atual.id === req.usuario!.id && ((dados.papel && dados.papel !== atual.papel) || dados.ativo === false)) {
    throw new HttpError(400, "Você não pode mudar o próprio perfil nem desativar a si mesmo");
  }

  const atualizado = await prisma.usuario.update({
    where: { id: atual.id },
    data: { ...dados, ...(senha ? { senhaHash: await gerarHash(senha) } : {}) },
  });
  res.json(serializar(atualizado));
});
