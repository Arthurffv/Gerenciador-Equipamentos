import "./config"; // precisa ser o primeiro import: carrega o .env
import express from "express";
import cors from "cors";
import { config } from "./config";
import { exigirEscrita, exigirLogin, exigirOrigemConfiavel } from "./auth";
import { tratarErros } from "./erros";
import { garantirBucket } from "./storage";
import { equipamentosRouter } from "./routes/equipamentos";
import { calibracoesRouter } from "./routes/calibracoes";
import { manutencoesRouter } from "./routes/manutencoes";
import { analisesRouter } from "./routes/analises";
import { authRouter } from "./routes/auth";
import { buscaRouter } from "./routes/busca";
import { dashboardRouter } from "./routes/dashboard";
import { usuariosRouter } from "./routes/usuarios";

const app = express();
app.use(cors({ origin: config.frontendOrigens, credentials: true })); // credentials: o navegador envia o cookie de sessão
app.use(exigirOrigemConfiavel); // depois do CORS: recusa alteração vinda de outro site
app.use(express.json({ limit: "1mb" }));

app.get("/api/saude", (_req, res) => {
  res.json({ ok: true });
});

// Login e logout são públicos. Todo o resto exige sessão; criar/editar/excluir exige Editor ou Administrador.
app.use("/api/auth", authRouter);
app.use(
  "/api",
  exigirLogin,
  exigirEscrita,
  dashboardRouter,
  buscaRouter,
  equipamentosRouter,
  calibracoesRouter,
  manutencoesRouter,
  analisesRouter
);
app.use("/api/usuarios", exigirLogin, usuariosRouter);

app.use((_req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});
app.use(tratarErros);

app.listen(config.port, () => {
  console.log(`API rodando em http://localhost:${config.port}`);
  // Não derruba a API se o MinIO estiver fora: só os endpoints de arquivo ficam indisponíveis.
  garantirBucket().catch((err) => console.warn("MinIO indisponível — upload/download de arquivos não vai funcionar:", err.message));
});
