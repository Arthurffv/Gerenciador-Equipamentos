import "../src/config"; // carrega o .env
import readline from "node:readline/promises";
import { PrismaClient } from "@prisma/client";
import { gerarHash } from "../src/senha";

/**
 * Cria o primeiro administrador (ou recupera o acesso de um existente).
 *
 * Uso (dentro da pasta backend):
 *   npm run admin -- "Seu Nome" voce@empresa.com "uma-senha-forte"
 *   npm run admin            (pergunta o que faltar)
 *
 * Se o e-mail já existir, ele vira ADMIN, é reativado e a senha é redefinida.
 */
async function main() {
  const [nomeArg, emailArg, senhaArg] = process.argv.slice(2);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const perguntar = async (texto: string, valor?: string) => (valor ?? (await rl.question(texto))).trim();

  const nome = await perguntar("Nome: ", nomeArg);
  const email = (await perguntar("E-mail: ", emailArg)).toLowerCase();
  const senha = await perguntar("Senha (mínimo 8 caracteres): ", senhaArg);
  rl.close();

  if (!nome || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Informe um nome e um e-mail válido.");
  if (senha.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");

  const prisma = new PrismaClient();
  const senhaHash = await gerarHash(senha);
  const existente = await prisma.usuario.findUnique({ where: { email } });

  if (existente) {
    await prisma.usuario.update({ where: { email }, data: { nome, senhaHash, papel: "ADMIN", ativo: true } });
    console.log(`\nUsuário ${email} já existia: agora é ADMIN, está ativo e a senha foi redefinida.`);
  } else {
    await prisma.usuario.create({ data: { nome, email, senhaHash, papel: "ADMIN" } });
    console.log(`\nAdministrador ${email} criado. Já pode entrar no sistema.`);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("\nFalha:", err.message ?? err);
  process.exit(1);
});
