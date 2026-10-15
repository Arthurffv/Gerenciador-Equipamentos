import { Client } from "minio";

// Cria o bucket de certificados no MinIO, se ainda não existir.
// Uso (dentro da pasta backend):  npx tsx scripts/criar-bucket.ts

const bucket = process.env.MINIO_BUCKET ?? "certificados";

const client = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ROOT_USER ?? "minioadmin",
  secretKey: process.env.MINIO_ROOT_PASSWORD ?? "minioadmin123",
});

async function main() {
  const existe = await client.bucketExists(bucket);
  if (existe) {
    console.log(`Bucket "${bucket}" já existe.`);
    return;
  }
  await client.makeBucket(bucket);
  console.log(`Bucket "${bucket}" criado com sucesso.`);
}

main().catch((err) => {
  console.error("Falha ao criar o bucket:", err.message);
  process.exit(1);
});
