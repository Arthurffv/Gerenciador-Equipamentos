import { z } from "zod";

z.config(z.locales.pt()); // mensagens de erro em português

// ───────────── Blocos reutilizáveis ─────────────

/** Texto opcional: "" e null viram null; ausente (undefined) continua ausente, para não apagar nada num PUT parcial. */
const texto = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres`)
    .nullish()
    .transform((v) => (v === undefined ? undefined : v ? v : null));

const textoObrigatorio = (nome: string, max = 500) =>
  z.string(`Informe ${nome}`).trim().min(1, `Informe ${nome}`).max(max, `Use no máximo ${max} caracteres`);

const dataISO = z
  .string("Informe a data")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD")
  .refine((s) => !Number.isNaN(Date.parse(s + "T00:00:00Z")) && new Date(s + "T00:00:00Z").toISOString().startsWith(s), "Data inválida")
  .transform((s) => new Date(s + "T00:00:00.000Z"));

const DIA_MS = 86_400_000;
const DATA_MINIMA = Date.UTC(1990, 0, 1);
const DATA_MAXIMA_PREVISTA = Date.UTC(2100, 11, 31);

/** Data de algo que JÁ aconteceu (calibração, manutenção, análise): de 1990 até hoje (com 2 dias de folga de fuso). */
const dataRealizada = dataISO.refine(
  (d) => d.getTime() >= DATA_MINIMA && d.getTime() <= Date.now() + 2 * DIA_MS,
  "A data não pode ser anterior a 1990 nem estar no futuro"
);

/** Data prevista (próxima calibração/manutenção): de 1990 até 2100 (barra erro de digitação no ano). */
const dataPrevista = dataISO.refine((d) => d.getTime() >= DATA_MINIMA && d.getTime() <= DATA_MAXIMA_PREVISTA, "Informe uma data entre 1990 e 2100");

/** Aceita valor, null ou "" (vira null) ou ausente (undefined). */
const opcional = <T extends z.ZodType>(schema: T) =>
  z.union([z.literal("").transform(() => null), z.null(), schema]).optional();

const dataRealizadaOpc = opcional(dataRealizada);
const dataPrevistaOpc = opcional(dataPrevista);
const meses = opcional(z.number("Informe um número").int("Use um número inteiro").min(1, "Mínimo 1 mês").max(600, "Máximo 600 meses"));

// ───────────── Equipamento ─────────────

const QUALIFICACAO = z.enum(["CRITICO", "NAO_CRITICO"], "Qualificação inválida");
const STATUS = z.enum(["USO", "FORA_DE_USO", "MANUTENCAO", "OBSOLETO"], "Status inválido");

const equipamentoBase = z.object({
  codigo: textoObrigatorio("o código", 60).transform((s) => s.toUpperCase()),
  nome: textoObrigatorio("o nome do equipamento", 200),
  amostrador: texto(200),
  numeroSerie: texto(100),
  modelo: texto(150),
  fabricante: texto(150),
  qualificacao: QUALIFICACAO,
  status: STATUS,
  localizacaoAtual: texto(200),
  observacoes: texto(2000),
});

// Na criação, qualificação e status têm padrão; na atualização tudo é opcional (só muda o que veio).
export const equipamentoCriar = equipamentoBase.extend({
  qualificacao: QUALIFICACAO.default("CRITICO"),
  status: STATUS.default("USO"),
});
export const equipamentoAtualizar = equipamentoBase.partial();

// ───────────── Calibração ─────────────

const calibracaoBase = z.object({
  numeroCertificado: texto(100),
  escala: texto(100),
  faixaCalibracao: texto(200),
  dataCalibracao: dataRealizadaOpc,
  intervaloMeses: meses,
  proximaCalibracao: dataPrevistaOpc,
  erroMaximo: texto(100),
  normasReferencia: texto(300),
  laboratorio: texto(200),
  resultado: opcional(z.enum(["APROVADA", "APROVADA_COM_RESTRICAO", "REPROVADA"], "Resultado inválido")),
  observacoes: texto(2000),
});

export const calibracaoCriar = calibracaoBase.refine((c) => c.dataCalibracao || c.numeroCertificado, {
  message: "Informe a data da calibração ou o número do certificado",
  path: ["dataCalibracao"],
});
export const calibracaoAtualizar = calibracaoBase.partial();

// ───────────── Manutenção ─────────────

const manutencaoBase = z.object({
  tipo: z.enum(["PREVENTIVA", "CORRETIVA"], "Tipo inválido"),
  dataManutencao: dataRealizada,
  periodicidadeMeses: meses,
  proximaManutencao: dataPrevistaOpc,
  responsavel: texto(150),
  descricao: texto(2000),
  custo: opcional(z.number("Informe um valor").min(0, "O custo não pode ser negativo").max(9_999_999_999, "Valor muito alto")),
});

export const manutencaoCriar = manutencaoBase.extend({
  tipo: manutencaoBase.shape.tipo.default("PREVENTIVA"),
});
export const manutencaoAtualizar = manutencaoBase.partial();

// ───────────── Análise crítica ─────────────

const analiseBase = z.object({
  dataAnalise: dataRealizada,
  analista: textoObrigatorio("o analista", 150),
  parecer: textoObrigatorio("o parecer", 4000),
  conforme: z.boolean("Informe se está conforme"),
  acaoNecessaria: texto(2000),
});

export const analiseCriar = analiseBase.extend({ conforme: analiseBase.shape.conforme.default(true) });
export const analiseAtualizar = analiseBase.partial();

// ───────────── Usuários e login ─────────────

const email = z.string("Informe o e-mail").trim().toLowerCase().pipe(z.email("E-mail inválido"));
const senhaNova = z.string("Informe a senha").min(8, "Use pelo menos 8 caracteres").max(128, "Use no máximo 128 caracteres");
const PAPEL = z.enum(["ADMIN", "EDITOR", "LEITOR"], "Perfil inválido");

export const login = z.object({
  email,
  senha: z.string("Informe a senha").min(1, "Informe a senha").max(128),
});

export const trocarSenha = z.object({
  senhaAtual: z.string("Informe a senha atual").min(1, "Informe a senha atual").max(128),
  novaSenha: senhaNova,
});

const usuarioBase = z.object({
  nome: textoObrigatorio("o nome", 150),
  email,
  papel: PAPEL,
  senha: senhaNova,
  ativo: z.boolean("Valor inválido"),
});

export const usuarioCriar = usuarioBase.omit({ ativo: true });
export const usuarioAtualizar = usuarioBase.partial();
