import { Router } from "express";
import { abrirSessao, encerrarSessao, exigirLogin, limparFalhas, registrarFalha, verificarTentativas } from "../auth";
import { HttpError } from "../erros";
import { prisma } from "../prisma";
import { conferirSenha, gerarHash, hashFalso } from "../senha";
import { login, trocarSenha } from "../validacao";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, senha } = login.parse(req.body);
  const chave = `${req.ip}|${email}`;
  verificarTentativas(chave);

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  // Confere a senha mesmo se o e-mail não existe: o tempo de resposta não revela quais e-mails são cadastrados.
  const senhaCorreta = await conferirSenha(senha, usuario?.senhaHash ?? (await hashFalso));

  if (!usuario || !usuario.ativo || !senhaCorreta) {
    registrarFalha(chave);
    throw new HttpError(401, "E-mail ou senha incorretos");
  }

  limparFalhas(chave);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcesso: new Date() } });
  abrirSessao(res, usuario.id);
  res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel });
});

authRouter.post("/logout", (_req, res) => {
  encerrarSessao(res);
  res.status(204).end();
});

/** Quem está logado (o frontend chama ao abrir a página para saber se há sessão). */
authRouter.get("/eu", exigirLogin, (req, res) => {
  res.json(req.usuario);
});

authRouter.put("/senha", exigirLogin, async (req, res) => {
  const { senhaAtual, novaSenha } = trocarSenha.parse(req.body);
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario || !(await conferirSenha(senhaAtual, usuario.senhaHash))) {
    throw new HttpError(400, "A senha atual está incorreta");
  }
  await prisma.usuario.update({ where: { id: usuario.id }, data: { senhaHash: await gerarHash(novaSenha) } });
  res.status(204).end();
});
