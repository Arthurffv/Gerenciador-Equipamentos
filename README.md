# Gestão de Equipamentos

Sistema web para centralizar o cadastro de equipamentos, o controle de calibrações e as
manutenções (substitui a planilha FOR 0042). Setores: Campo, Laboratório e Vidrarias.

**Stack:** React + TypeScript (Vite, Tailwind) · Node.js + Express + Prisma · PostgreSQL · MinIO · Docker Compose

## Pré-requisitos

- [Node.js](https://nodejs.org) 20.19+ ou 22 LTS
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (aberto e com "Engine running")
- [Git](https://git-scm.com/download/win)
- Recomendação (Windows): não deixe a pasta do projeto dentro do OneDrive. Use algo como `C:\dev\`.

## Primeira configuração (uma vez só)

Rode os comandos no PowerShell, na pasta raiz do projeto.

**1. Variáveis de ambiente**
```powershell
copy .env.example .env
copy backend\.env.example backend\.env
```
Se a porta 5432 do seu computador já estiver em uso, troque `POSTGRES_PORT` no `.env` e a porta
no `DATABASE_URL` do `backend\.env` (as duas precisam ser iguais).

**2. Banco de dados e storage (Docker)**
```powershell
docker compose up -d
docker compose ps
```
O `eqp-postgres` deve ficar *healthy* e o `eqp-minio` *Up*.

**3. Backend**
```powershell
cd backend
npm install
npx prisma migrate dev
npx tsx scripts/criar-bucket.ts
```

**4. Dados das planilhas**

As planilhas **não** ficam no GitHub (são dados da empresa). Peça os 3 arquivos `.xlsx` (Campo,
Laboratório e Vidrarias) a quem já os tem e coloque-os em `backend/dados/`. Depois:
```powershell
npx tsx scripts/importar-planilhas.ts --dry   # só confere, não grava
npx tsx scripts/importar-planilhas.ts         # grava no banco
```

**5. Frontend**
```powershell
cd ..\frontend
npm install
```

## Rotina diária

Use dois terminais:

```powershell
# terminal 1 – API (http://localhost:3001)
cd backend
npm run dev

# terminal 2 – interface (http://localhost:5173)
cd frontend
npm run dev
```

Docker parado? `docker compose up -d` na raiz.

## Trabalhando em dupla

- Antes de começar: `git pull`. Ao terminar: `git add .`, `git commit -m "o que mudou"`, `git push`.
- Combinem quem mexe em quê. Mudanças em `backend/prisma/schema.prisma` geram uma pasta em
  `backend/prisma/migrations`: commitem juntas e, quando a outra pessoa puxar, rode `npx prisma migrate dev`.
- Nunca commitem `.env` nem as planilhas (já estão no `.gitignore`).

## Endereços úteis

| O quê | Endereço |
|---|---|
| Interface | http://localhost:5173 |
| API (teste) | http://localhost:3001/api/saude |
| Console do MinIO | http://localhost:9001 (`minioadmin` / `minioadmin123`) |
| Prisma Studio (ver o banco) | `cd backend` e `npx prisma studio` → http://localhost:5555 |

## Problemas comuns

- **`Cannot connect to the Docker daemon`**: abra o Docker Desktop.
- **`port is already allocated`**: troque `POSTGRES_PORT` (veja o passo 1) e rode `docker compose up -d` de novo.
- **Prisma `P1000/P1001`**: confira se a porta do `backend\.env` é a mesma do `.env` da raiz e se o Postgres está *healthy*.
- **Prisma `P1012 DATABASE_URL not found`**: o `backend\.env` não existe ou está vazio.
- **Página mostra "Não foi possível conectar à API"**: o `npm run dev` do backend não está rodando.
- **`npm` bloqueado no PowerShell**: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
