import express from "express";
import cors from "cors";
import { prisma } from "./prisma";
import { situacaoCalibracao, situacaoManutencao, proximaData } from "./status";

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));

// slug da URL -> valor do enum Setor no banco
const SETORES = {
  campo: "CAMPO",
  laboratorio: "LABORATORIO",
  vidrarias: "VIDRARIAS",
} as const;

type SetorSlug = keyof typeof SETORES;

/** Data sem hora: "2026-05-04" (evita problemas de fuso no navegador). */
const dia = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

app.get("/api/saude", (_req, res) => {
  res.json({ ok: true });
});

/**
 * Lista os equipamentos de um setor, já com a última calibração, a última
 * manutenção e as situações (vencido / à vencer...) calculadas.
 * Uma única resposta alimenta as 3 páginas: Geral, Calibração e Manutenção.
 */
app.get("/api/setores/:setor/equipamentos", async (req, res) => {
  const slug = req.params.setor as SetorSlug;
  const setor = SETORES[slug];
  if (!setor) {
    res.status(404).json({ erro: "Setor inválido" });
    return;
  }

  try {
    const itens = await prisma.equipamento.findMany({
      where: { setor },
      orderBy: [{ nome: "asc" }, { codigo: "asc" }],
      include: {
        calibracoes: { orderBy: { dataCalibracao: { sort: "desc", nulls: "last" } }, take: 1 },
        manutencoes: { orderBy: { dataManutencao: { sort: "desc", nulls: "last" } }, take: 1 },
      },
    });

    const resposta = itens.map((e) => {
      const cal = e.calibracoes[0] ?? null;
      const man = e.manutencoes[0] ?? null;

      return {
        id: e.id,
        codigo: e.codigo,
        nome: e.nome,
        amostrador: e.amostrador,
        numeroSerie: e.numeroSerie,
        modelo: e.modelo,
        fabricante: e.fabricante,
        qualificacao: e.qualificacao,
        status: e.status,
        localizacaoAtual: e.localizacaoAtual,
        situacaoCalibracao: situacaoCalibracao(e, cal),
        situacaoManutencao: situacaoManutencao(e, man),
        calibracao: cal && {
          numeroCertificado: cal.numeroCertificado,
          escala: cal.escala,
          faixaCalibracao: cal.faixaCalibracao,
          dataCalibracao: dia(cal.dataCalibracao),
          intervaloMeses: cal.intervaloMeses,
          proximaCalibracao: dia(proximaData(cal.dataCalibracao, cal.proximaCalibracao, cal.intervaloMeses)),
          erroMaximo: cal.erroMaximo,
          normasReferencia: cal.normasReferencia,
        },
        manutencao: man && {
          dataManutencao: dia(man.dataManutencao),
          periodicidadeMeses: man.periodicidadeMeses,
          proximaManutencao: dia(proximaData(man.dataManutencao, man.proximaManutencao, man.periodicidadeMeses)),
        },
      };
    });

    res.json(resposta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao consultar o banco de dados" });
  }
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
