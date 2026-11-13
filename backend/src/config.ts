// Carrega o backend/.env (se existir) ANTES de qualquer outro módulo ler process.env.
// O tsx não faz isso sozinho; o Prisma só lê o DATABASE_URL.
try {
  process.loadEnvFile();
} catch {
  // sem .env: valem as variáveis do sistema e os padrões abaixo
}

const producao = process.env.NODE_ENV === "production";

if (!process.env.JWT_SECRET) {
  if (producao) throw new Error("Defina JWT_SECRET no .env (uma frase longa e aleatória).");
  console.warn("[config] JWT_SECRET não definido: usando uma chave de desenvolvimento INSEGURA. Defina no backend/.env.");
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  /** Endereços do frontend autorizados a falar com a API (separe vários por vírgula). */
  frontendOrigens: (process.env.FRONTEND_URL ?? "http://localhost:5173,http://127.0.0.1:5173").split(",").map((s) => s.trim()),
  auth: {
    segredo: process.env.JWT_SECRET ?? "desenvolvimento-inseguro-troque-no-env",
    cookie: "eqp_sessao",
    horas: Number(process.env.SESSAO_HORAS ?? 8),
    /** Cookie só trafega por HTTPS em produção. */
    seguro: producao,
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ROOT_USER ?? "minioadmin",
    secretKey: process.env.MINIO_ROOT_PASSWORD ?? "minioadmin123",
    bucket: process.env.MINIO_BUCKET ?? "certificados",
  },
  /** Tamanho máximo de cada arquivo enviado (certificado / análise crítica). */
  maxUploadBytes: 20 * 1024 * 1024,
  /** Validade do link de download gerado a partir do MinIO. */
  linkExpiraEmSegundos: 5 * 60,
};
