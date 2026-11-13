import { Router } from "express";
import { prisma } from "../prisma";
import { HttpError } from "../erros";
import { validarId } from "../parametros";
import { setorDoSlug } from "../setores";
import { situacaoCalibracao, situacaoManutencao, proximaData } from "../status";
import { dia, serializarDetalhe, serializarEquipamentoBase } from "../serializar";
import { equipamentoAtualizar, equipamentoCriar } from "../validacao";
import { removerArquivos } from "../storage";
import { equipamentosComUltimos, maisRecentePrimeiro } from "../consultas";

export const equipamentosRouter = Router();
equipamentosRouter.param("id", validarId);

/**
 * Lista os equipamentos de um setor, já com a última calibração, a última
 * manutenção e as situações (vencido / à vencer...) calculadas.
 * Uma única resposta alimenta as 3 abas: Geral, Calibração e Manutenção.
 */
equipamentosRouter.get("/setores/:setor/equipamentos", async (req, res) => {
  const setor = setorDoSlug(req.params.setor);

  const itens = await equipamentosComUltimos({ setor });

  res.json(
    itens.map((e) => {
      const cal = e.calibracoes[0] ?? null;
      const man = e.manutencoes[0] ?? null;

      return {
        ...serializarEquipamentoBase(e),
        situacaoCalibracao: situacaoCalibracao(e, cal),
        situacaoManutencao: situacaoManutencao(e, man),
        calibracao: cal && {
          id: cal.id,
          numeroCertificado: cal.numeroCertificado,
          escala: cal.escala,
          faixaCalibracao: cal.faixaCalibracao,
          dataCalibracao: dia(cal.dataCalibracao),
          intervaloMeses: cal.intervaloMeses,
          proximaCalibracao: dia(proximaData(cal.dataCalibracao, cal.proximaCalibracao, cal.intervaloMeses)),
          erroMaximo: cal.erroMaximo,
          normasReferencia: cal.normasReferencia,
          certificadoNome: cal.certificadoKey ? (cal.certificadoNome ?? "certificado") : null,
        },
        manutencao: man && {
          dataManutencao: dia(man.dataManutencao),
          periodicidadeMeses: man.periodicidadeMeses,
          proximaManutencao: dia(proximaData(man.dataManutencao, man.proximaManutencao, man.periodicidadeMeses)),
        },
      };
    })
  );
});

equipamentosRouter.post("/setores/:setor/equipamentos", async (req, res) => {
  const setor = setorDoSlug(req.params.setor);
  const dados = equipamentoCriar.parse(req.body);

  const criado = await prisma.equipamento.create({ data: { ...dados, setor } });
  res.status(201).json(serializarEquipamentoBase(criado));
});

/** Equipamento + histórico completo (calibrações, manutenções e análises críticas). */
equipamentosRouter.get("/equipamentos/:id", async (req, res) => {
  const e = await prisma.equipamento.findUnique({
    where: { id: req.params.id },
    include: {
      calibracoes: { orderBy: maisRecentePrimeiro("dataCalibracao") },
      manutencoes: { orderBy: maisRecentePrimeiro("dataManutencao") },
      analisesCriticas: { orderBy: { dataAnalise: "desc" } },
    },
  });
  if (!e) throw new HttpError(404, "Equipamento não encontrado");
  res.json(serializarDetalhe(e));
});

// O setor não muda depois de criado (o código é único dentro do setor).
equipamentosRouter.put("/equipamentos/:id", async (req, res) => {
  const dados = equipamentoAtualizar.parse(req.body);
  const atualizado = await prisma.equipamento.update({ where: { id: req.params.id }, data: dados });
  res.json(serializarEquipamentoBase(atualizado));
});

/** Apaga o equipamento, todo o histórico (cascata no banco) e os arquivos no MinIO. */
equipamentosRouter.delete("/equipamentos/:id", async (req, res) => {
  const e = await prisma.equipamento.findUnique({
    where: { id: req.params.id },
    select: {
      calibracoes: { select: { certificadoKey: true } },
      analisesCriticas: { select: { arquivoKey: true } },
    },
  });
  if (!e) throw new HttpError(404, "Equipamento não encontrado");

  await prisma.equipamento.delete({ where: { id: req.params.id } });
  await removerArquivos([...e.calibracoes.map((c) => c.certificadoKey), ...e.analisesCriticas.map((a) => a.arquivoKey)]);
  res.status(204).end();
});
