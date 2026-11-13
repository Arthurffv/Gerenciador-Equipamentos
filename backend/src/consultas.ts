import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/** Ordena do mais recente para o mais antigo; registros sem data vão para o fim. */
export const maisRecentePrimeiro = (campo: string) => ({ [campo]: { sort: "desc" as const, nulls: "last" as const } });

/** Equipamentos já com a última calibração e a última manutenção (base da lista, do painel e dos alertas). */
export const equipamentosComUltimos = (where: Prisma.EquipamentoWhereInput = {}) =>
  prisma.equipamento.findMany({
    where,
    orderBy: [{ nome: "asc" }, { codigo: "asc" }],
    include: {
      calibracoes: { orderBy: maisRecentePrimeiro("dataCalibracao"), take: 1 },
      manutencoes: { orderBy: maisRecentePrimeiro("dataManutencao"), take: 1 },
    },
  });
