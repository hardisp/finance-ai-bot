# FinanceAI — Sprint 1 Starter Repo


# FinanceAI — Sprint 1 Starter

## Quick start (local)

1. Copy `.env.example` to `.env` and fill values.
2. Ensure Docker & Docker Compose are installed.
3. Run:

```bash
docker compose up -d
```

4. Backend migrations (if using Prisma):

```bash
# run inside container or locally with prisma installed
docker exec -it financeai_backend npx prisma migrate dev --name init
```

5. Open frontend: [http://localhost:3000](http://localhost:3000)

## Google OAuth test user

When you create your Google Cloud OAuth consent screen (External/testing), add the test user:

* `webshookeng@gmail.com`

This allows that address to authorize the OAuth client while the app is in testing status.

---

## Structure


```
financeai/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   │   └── 202510190001_init/
│   │   │       └── migration.sql
│   │   └── seed.ts
│   └── src/
│       ├── index.ts
│       └── routes/
│           ├── googleOauth.ts
│           └── hubspotOauth.ts
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    └── src/pages/index.tsx
```

## Makefile

# FinanceAI — Sprint 1 Starter Repo (with Makefile + Prisma migration + seed)

This version extends the Sprint 1 starter with a **Makefile** for simple local development, including commands to run Docker, apply migrations, and seed the database.

---

## Repo structure

```sh
financeai/
├── docker-compose.yml
├── Makefile
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   │   └── 202510190001_init/migration.sql
│   │   └── seed.ts
│   └── src/
│       ├── index.ts
│       └── routes/
│       │   ├── googleOauth.ts
│       │   └── hubspotOauth.ts
│       │   └── user.ts
│       └── controllers/
│       │   ├── googleOauthController.ts
│       │   └── hubspotOauthController.ts
│       │   └── userController.ts
│       │   └── user.ts
│       └── middleware/
│       │   ├── requireAuth.ts
│       │   └── hubspotOauthController.ts
│       │   └── userController.ts
│       └── utils/
│           └── jwt.ts
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    └── src/pages/index.tsx
```

### Folder structure addition

```sh
backend/
└── src/
    ├── services/
    │   ├── ragService.ts
    │   └── chatAgent.ts
```

- `ragService.ts` → handles fetching emails & HubSpot contacts/notes, storing embeddings in PostgreSQL/Redis (pgvector or similar).
- `chatAgent.ts` → the LLM interface that uses embeddings from ragService to answer questions.

---

 
## Makefile for FinanceAI development
 

### Usage

#### Start the app

```bash
make up
```

#### Run migrations

```bash
make migrate
```

#### Seed demo data

```bash
make seed
```

#### Rebuild everything

```bash
make rebuild
```

#### Reset the entire database (⚠️ destructive)

```bash
make reset
```

| Command        | Description                                |
| -------------- | ------------------------------------------ |
| `make build`   | Build all images with cache                |
| `make rebuild` | Rebuild all images from scratch (no cache) |
| `make up`      | Start containers in background             |
| `make down`    | Stop and remove containers                 |
| `make migrate` | Apply Prisma migrations                    |
| `make seed`    | Run Prisma seed data                       |
| `make restart` | Rebuild + restart everything cleanly       |


---


## Redis Check

```sh
docker exec -it financeai_redis redis-cli
```

```sh
HGETALL user:<userId>:taskEmbeddings
```

## New Routes & Endpoints

| Route                   | Method | Description                                                      |
| ----------------------- | ------ | ---------------------------------------------------------------- |
| `/api/tasks`            | POST   | Add a new task for the authenticated user                        |
| `/api/tasks/:id`        | PATCH  | Update a task (description/status)                               |
| `/api/tasks/:id`        | DELETE | Delete a task                                                    |
| `/api/instructions`     | POST   | Add an ongoing instruction                                       |
| `/api/instructions/:id` | PATCH  | Update an instruction                                            |
| `/api/instructions/:id` | DELETE | Delete an instruction                                            |
| `/api/index-user`       | POST   | Re-index all user data into Redis (RAG)                          |
| `/api/query`            | POST   | Query user data via embeddings                                   |
| `/api/dashboard`        | GET    | Get a summary of user data (tasks, instructions, recent queries) |
| `/api/suggestions`      | POST   | Suggest next action based on query and instructions              |
