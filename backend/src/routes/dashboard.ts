import { Router } from "express";
import { equipamentosComUltimos } from "../consultas";
import { dia } from "../serializar";
import { diasAte, proximaData, situacaoCalibracao, situacaoManutencao, type SituacaoPrazo } from "../status";

export const dashboardRouter = Router();

type Contagem = Record<SituacaoPrazo, number>;
const contagemVazia = (): Contagem => ({ VENCIDO: 0, A_VENCER: 0, NAO_VENCIDO: 0, SEM_REGISTRO: 0, NAO_PRECISA: 0, OBSOLETO: 0 });

/**
 * Resumo para o painel e para o sino de notificações: contagens por situação,
 * quadro por setor e a lista de vencimentos (vencidos e a vencer) em ordem de urgência.
 */
dashboardRouter.get("/dashboard", async (_req, res) => {
  const itens = await equipamentosComUltimos();
  const agora = new Date();

  const calibracao = contagemVazia();
  const manutencao = contagemVazia();
  const totais = { equipamentos: itens.length, emUso: 0, foraDeUso: 0, emManutencao: 0, obsoletos: 0 };
  const porSetor = new Map<string, { calibracao: Contagem; manutencao: Contagem; equipamentos: number }>();
  const vencimentos: {
    equipamentoId: string;
    codigo: string;
    nome: string;
    setor: string;
    tipo: "CALIBRACAO" | "MANUTENCAO";
    data: string;
    dias: number;
    situacao: "VENCIDO" | "A_VENCER";
  }[] = [];

  for (const e of itens) {
    const cal = e.calibracoes[0] ?? null;
    const man = e.manutencoes[0] ?? null;
    const sitCal = situacaoCalibracao(e, cal, agora);
    const sitMan = situacaoManutencao(e, man, agora);

    calibracao[sitCal]++;
    manutencao[sitMan]++;
    if (e.status === "USO") totais.emUso++;
    else if (e.status === "FORA_DE_USO") totais.foraDeUso++;
    else if (e.status === "MANUTENCAO") totais.emManutencao++;
    else totais.obsoletos++;

    const setor = porSetor.get(e.setor) ?? { calibracao: contagemVazia(), manutencao: contagemVazia(), equipamentos: 0 };
    setor.equipamentos++;
    setor.calibracao[sitCal]++;
    setor.manutencao[sitMan]++;
    porSetor.set(e.setor, setor);

    const alvos = [
      { tipo: "CALIBRACAO" as const, situacao: sitCal, data: cal && proximaData(cal.dataCalibracao, cal.proximaCalibracao, cal.intervaloMeses) },
      { tipo: "MANUTENCAO" as const, situacao: sitMan, data: man && proximaData(man.dataManutencao, man.proximaManutencao, man.periodicidadeMeses) },
    ];
    for (const a of alvos) {
      if ((a.situacao === "VENCIDO" || a.situacao === "A_VENCER") && a.data) {
        vencimentos.push({
          equipamentoId: e.id,
          codigo: e.codigo,
          nome: e.nome,
          setor: e.setor.toLowerCase(),
          tipo: a.tipo,
          data: dia(a.data)!,
          dias: diasAte(a.data, agora),
          situacao: a.situacao,
        });
      }
    }
  }

  vencimentos.sort((a, b) => a.dias - b.dias); // os mais atrasados primeiro

  res.json({
    totais,
    calibracao,
    manutencao,
    porSetor: (["CAMPO", "LABORATORIO", "VIDRARIAS"] as const).map((s) => ({
      setor: s.toLowerCase(),
      ...(porSetor.get(s) ?? { calibracao: contagemVazia(), manutencao: contagemVazia(), equipamentos: 0 }),
    })),
    alertas: vencimentos.length,
    vencimentos: vencimentos.slice(0, 20),
  });
});
