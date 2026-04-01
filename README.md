# Warehouse Finance Tracker BE

Backend API for warehouse stock and finance management.

## Tech Stack

- Runtime: `Bun`
- Language: `TypeScript`
- HTTP Framework: `Hono`
- Validation: `Zod` + `@hono/zod-validator`
- Database: `PostgreSQL`
- Logging: `Pino`
- Lint/Format: `Biome`

## Prerequisites

- `Bun >= 1.0.0`
- `PostgreSQL` (default local port `5432`)
- Optional: Docker (for local Postgres/Redis via `docker-compose`)

## Project Docs

- Main internal docs: [`docs/README.md`](docs/README.md)
- Source of truth for schema: [`docs/data/DATABASE_SCHEMA.md`](docs/data/DATABASE_SCHEMA.md)
- Migration reference: [`docs/data/MIGRATION_GUIDE.md`](docs/data/MIGRATION_GUIDE.md)

## Installation

1. Install dependencies:

```bash
bun install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Update `.env` values if needed (DB host, DB name, secrets, etc.).

## Running Locally (Recommended Order)

1. Start PostgreSQL.
2. Run migrations.
3. (Optional) Seed data.
4. Start API server.

### Option A: Use local PostgreSQL

```bash
bun run db:migrate
bun run db:seed
bun run dev
```

### Option B: Use Docker Compose

```bash
docker compose up -d
bun run db:migrate
bun run db:seed
bun run dev
```

Server default: `http://localhost:3000`

## Available Scripts

### App

- `bun run dev`: Start development server with watch mode.
- `bun run start`: Start app without watch mode.
- `bun run build`: Build app to `dist/`.

### Database

- `bun run db:help`: Show migration command help.
- `bun run db:migrate`: Run all pending migrations.
- `bun run db:migrate:select -- <filename>`: Run one migration file.
- `bun run db:rollback`: Roll back last migration.
- `bun run db:status`: Show migration status.
- `bun run db:reset`: Drop and recreate DB structures (development only).
- `bun run db:seed`: Seed sample data.

### Quality

- `bun run typecheck`: Run TypeScript type checking.
- `bun run lint`: Run Biome checks.
- `bun run lint:fix`: Auto-fix Biome issues.
- `bun run format`: Format code with Biome.
- `bun run test`: Run tests.

## Migration Notes

- Migration files are ordered and executed by filename.
- Current migration sequence is in `/migrations` from `001` to `018`.
- If local history is inconsistent after migration renaming/reordering, run:

```bash
bun run db:reset
bun run db:migrate
```

## Configuration

Key environment variables:

- App: `NODE_ENV`, `PORT`, `HOST`
- Database: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- JWT: `JWT_SECRET`, `JWT_EXPIRY`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRY`
- Logging: `LOG_LEVEL`, `LOG_PRETTY`

See full list in [`.env.example`](.env.example).
