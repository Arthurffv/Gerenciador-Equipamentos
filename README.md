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

No `backend\.env`, troque o `JWT_SECRET` por uma frase longa e aleatória (ele assina as sessões de login).

**3.1. Primeiro administrador**

O sistema exige login. Crie o primeiro acesso (ainda no `backend`):
```powershell
npm run admin -- "Seu Nome" voce@empresa.com "uma-senha-forte"
```
Se o e-mail já existir, ele vira administrador, é reativado e a senha é redefinida (serve também para recuperar um acesso perdido). Os demais usuários são criados dentro do sistema, em *Usuários*.

**4. Dados das planilhas**

As planilhas **não** ficam no GitHub (são dados da empresa). Peça os 3 arquivos `.xlsx` (Campo,
Laboratório e Vidrarias) a quem já os tem e coloque-os em `backend/dados/`. Depois:
```powershell
npx tsx scripts/importar-planilhas.ts --dry          # só confere, não grava
npx tsx scripts/importar-planilhas.ts                # grava só o que ainda não existe
npx tsx scripts/importar-planilhas.ts --substituir   # recomeça do zero (pede confirmação)
```
O modo padrão **não altera nada que já está no banco**: equipamentos cujo código já existe no setor são pulados, com todo o histórico, certificados e análises. Já o `--substituir` apaga os setores importados (e os arquivos deles no MinIO) antes de importar; use só para recomeçar.

**5. Frontend**
```powershell
cd ..\frontend
npm install
```

## Rotina diária

Use dois terminais (abra o sistema por **http://localhost:5173**):

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

## O que o sistema faz hoje

- **Login e perfis de acesso:** *Administrador* faz tudo e gerencia usuários; *Editor* cadastra, edita e exclui; *Leitor* só consulta e abre arquivos. Mudar o perfil ou bloquear alguém vale na hora, mesmo para quem está com o sistema aberto.
- **Painel:** situação das calibrações e manutenções (em dia, à vencer em 30 dias, vencidos, sem registro), lista dos vencimentos por urgência e quadro por setor.
- **Cabeçalho:** busca em todos os setores (nome, código, série, modelo, fabricante), sino com os vencimentos e menu do usuário (alterar a própria senha, sair).
- **Equipamentos:** cadastrar, editar e excluir pelas telas de cada setor (botão *Novo equipamento* e ícones na linha da tabela).
- **Histórico por equipamento:** na página do equipamento (ícone de olho, ou clique no nome) ficam as **calibrações**, as **manutenções** e as **análises críticas**, cada uma com cadastro, edição e exclusão.
- **Arquivos:** a calibração aceita o **certificado** e a análise crítica aceita o **documento da análise**. Os arquivos ficam no MinIO e abrem por um link temporário (válido por 5 minutos). Tipos aceitos: PDF, PNG, JPG, DOC/DOCX, XLS/XLSX, até 20 MB. O conteúdo é conferido: arquivo vazio, corrompido ou de outro tipo renomeado (ex.: uma página HTML chamada de `.pdf`) é recusado.
- Ao excluir um registro (ou o equipamento inteiro), os arquivos dele também são apagados do MinIO.

## Segurança (resumo)

- Senhas são guardadas só como hash (`scrypt`). A sessão fica num cookie `HttpOnly`, que o JavaScript da página não lê.
- 5 senhas erradas seguidas para o mesmo e-mail bloqueiam o login por 15 minutos.
- Alterações (criar, editar, excluir, enviar arquivo, sair) só são aceitas quando vêm do endereço do frontend (`FRONTEND_URL`); isso barra outro site de usar a sessão do usuário (CSRF).
- As datas de calibração, manutenção e análise aceitam de 1990 até hoje; as datas previstas, até 2100. Isso barra erros de digitação no ano.
- Os arquivos do MinIO nunca são públicos: só abrem por links temporários que a API gera para quem está logado.
- **Limite conhecido:** *Sair* apaga o cookie do navegador, mas o token em si continua válido até expirar (`SESSAO_HORAS`, padrão 8 h). Se um token vazasse, bloquear o usuário em *Usuários* o invalida na hora.
- **Em produção:** use HTTPS (com `NODE_ENV=production` o cookie passa a exigir HTTPS), defina `JWT_SECRET`, `FRONTEND_URL` no backend e `VITE_API_URL` no build do frontend, e troque as credenciais padrão do MinIO.

## API

Base: `http://localhost:3001/api`. Erros voltam como `{ "erro": "...", "detalhes": [{ "campo", "mensagem" }] }`.
Tudo exige login (cookie), exceto `/saude` e `/auth/login`. Consultar (GET) vale para qualquer perfil; criar, editar e excluir exigem Editor ou Administrador.

| Método | Rota | O que faz |
|--------|------|-----------|
| POST | `/auth/login`, `/auth/logout` | Entra / sai |
| GET | `/auth/eu` | Quem está logado |
| PUT | `/auth/senha` | Troca a própria senha |
| GET / POST | `/usuarios` | Lista / cria usuário (só Administrador) |
| PUT | `/usuarios/:id` | Edita, muda perfil, bloqueia ou redefine a senha (só Administrador) |
| GET | `/dashboard` | Contagens, vencimentos e quadro por setor |
| GET | `/busca?q=` | Busca global de equipamentos |
| GET | `/setores/:setor/equipamentos` | Lista do setor (`campo`, `laboratorio`, `vidrarias`) com situações calculadas |
| POST | `/setores/:setor/equipamentos` | Cria equipamento |
| GET / PUT / DELETE | `/equipamentos/:id` | Detalhe com histórico / edita / exclui |
| POST | `/equipamentos/:id/calibracoes` | Cria calibração |
| PUT / DELETE | `/calibracoes/:id` | Edita / exclui |
| POST / GET / DELETE | `/calibracoes/:id/certificado` | Envia (multipart, campo `arquivo`) / devolve `{ url }` / remove |
| POST | `/equipamentos/:id/manutencoes` | Cria manutenção |
| PUT / DELETE | `/manutencoes/:id` | Edita / exclui |
| POST | `/equipamentos/:id/analises-criticas` | Cria análise crítica |
| PUT / DELETE | `/analises-criticas/:id` | Edita / exclui |
| POST / GET / DELETE | `/analises-criticas/:id/arquivo` | Envia / devolve `{ url }` / remove |

## Já tinha o projeto rodando? Depois de dar `git pull`

```powershell
cd backend
npm install
npx prisma migrate dev
npm run admin -- "Seu Nome" voce@empresa.com "uma-senha-forte"
```

- As migrations novas adicionam o arquivo da análise crítica e a tabela de usuários.
- No `backend\.env`, acrescente as linhas novas do `backend\.env.example`: `JWT_SECRET` (obrigatória para valer como segredo de verdade), `SESSAO_HORAS`, `FRONTEND_URL` e as `MINIO_*` (os padrões funcionam com o Docker do projeto, mas o backend agora lê o `.env`).
- O comando `npm run admin` cria o primeiro administrador. Sem ele ninguém consegue entrar.
- O bucket do MinIO é criado sozinho quando a API inicia.

## Endereços úteis

| O quê | Endereço |
|---|---|
| Interface (entre por **localhost**, não por 127.0.0.1) | http://localhost:5173 |
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
- **Ao enviar arquivo: "Armazenamento de arquivos indisponível"**: o MinIO não está rodando. Suba com `docker compose up -d` e confira com `docker compose ps`.
- **Validar o código do backend sem rodar:** `cd backend` e `npm run typecheck`.
- **Faço login mas ao recarregar a página volto para o login:** abra o sistema por `http://localhost:5173` (e não `127.0.0.1`) e confira se o `FRONTEND_URL` do `backend\.env` inclui o endereço que você usa.
- **Perdi o acesso de administrador:** `cd backend` e `npm run admin -- "Nome" email "nova-senha"` redefine a senha e devolve o perfil de administrador.
