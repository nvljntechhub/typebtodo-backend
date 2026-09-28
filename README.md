# TODO Backend

Authored by Navalojanan Navaratnarajah

NestJS + TypeORM REST API for a TODO app. Auth is cookie-based JWT. Local
Postgres and Redis run in Docker.

## Prerequisites

- Node.js 24 (matches the Dockerfile)
- npm
- Docker Desktop (or another Docker Compose runtime)

## Setup and run

1. Install dependencies:

```bash
npm install
```

2. Create a local env file. The app loads `.env.${NODE_ENV}` and defaults
   `NODE_ENV` to `development`, so the file it reads is `.env.development`.
   Start from the example (do not commit real secrets — `.env.*` is gitignored):

```bash
cp .env.example .env.development
```

Fill in `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (for example
`openssl rand -hex 32`). Compose loads this same file into the Postgres
container, so `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`
do not need to be copied into `docker-compose.yml`. The API still
connects to host port `5433`.

3. Start Postgres and Redis:

```bash
docker compose up -d
```

4. Apply migrations (this builds first; TypeORM runs against `dist/`):

```bash
npm run migration:run
```

5. Start the API:

```bash
npm run start:dev
```

The server listens on `PORT` (default `5001`) at `0.0.0.0`, with a global
prefix of `api/v1`. Health of the process is “it stays up and accepts
requests” — there is no `/health` route.

```bash
# watch mode
npm run start:dev

# production-style local run
npm run build
npm run start:prod
```

## Local database

Postgres 16 and Redis 7 are defined in `docker-compose.yml`. The API does
not run in Docker in the default workflow; only the data stores do.

| Service | Host | Port | Notes |
| --- | --- | --- | --- |
| Postgres | `localhost` | **5433** | Mapped from container `5432` so it does not collide with a local Postgres on 5432 |
| Redis | `localhost` | `6379` | Required for login (refresh tokens) |

Default compose values (must match `.env.development`):

| Variable | Value |
| --- | --- |
| `POSTGRES_HOST` | `localhost` |
| `POSTGRES_PORT` | `5433` |
| `POSTGRES_USER` | `user` |
| `POSTGRES_PASSWORD` | value in `.env.development` (Compose `env_file`) |
| `POSTGRES_DB` | `todobackend-db` |

Data lives in the `postgres_data` Docker volume. `docker compose down`
keeps it; `docker compose down -v` deletes the database.

TypeORM `synchronize` is **off**. Schema changes go through migrations
only. The CLI always loads `.env.development`:

```bash
npm run migration:generate -- AddSomething
npm run migration:run
npm run migration:revert
```

If login or migrations fail with a connection error, check in this order:
the compose stack is up (`docker compose ps`), host port is `5433` not
`5432`, and `POSTGRES_PASSWORD` matches the container. Changing the
compose password after the first `up` does not update an existing volume.

In production the ORM enables SSL (`rejectUnauthorized: false`). Locally
SSL is off.

## Environment

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port (default `5001`) |
| `NODE_ENV` | `development` \| `production` — also selects the env file |
| `FRONTEND_URL` | Comma-separated CORS origins |
| `POSTGRES_*` | Database connection |
| `JWT_ACCESS_SECRET` / `JWT_ACCESS_EXPIRES_IN` | Access token |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | Refresh token |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection |

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | — | Create an account (`name`, `email`, `password` ≥ 8 chars) |
| `POST` | `/api/v1/auth/login` | — | Log in; sets HttpOnly `access_token` and `refresh_token` cookies |
| `GET` | `/api/v1/auth/me` | cookie or Bearer | Current session user |
| `POST` | `/api/v1/auth/logout` | — | Clears auth cookies |
| `GET` | `/api/v1/todos` | yes | List the caller's todos |
| `POST` | `/api/v1/todos` | yes | Create a todo |
| `PUT` | `/api/v1/todos/:id` | yes | Update title/description |
| `PATCH` | `/api/v1/todos/:id/done` | yes | Toggle done |
| `DELETE` | `/api/v1/todos/:id` | yes | Delete a todo |

## Assumptions and limitations

- **Local-first.** Compose is for Postgres and Redis only. There is a
  multi-stage Dockerfile, but no compose service for the Nest process.
- **Env file name is fixed.** The app reads `.env.development` (or
  `.env.production` when `NODE_ENV=production`). It does not load
  `.env.development.local`. The TypeORM scripts always use
  `.env.development`.
- **Redis is not optional.** Login writes a hashed refresh token to Redis.
  The API will not start usefully if Redis is down. There is no
  `/auth/refresh` route; stored refresh tokens are unused after login.
  Logout clears cookies only and does not delete the Redis key.
- **Cookies and CORS.** Auth cookies are HttpOnly. In development they use
  `SameSite=Lax` and are not `Secure`. In production they use
  `SameSite=None` and `Secure`, so HTTPS is required. The client must send
  credentials. Production CORS is an allowlist from `FRONTEND_URL`. In
  development, `localhost`, `127.0.0.1`, and private IPv4 origins are also
  allowed.
- **Todos are per user.** List/update/delete only affect rows owned by the
  JWT subject. There is no pagination, search, or sharing.
- **No account recovery.** Email is unique. There is no verification,
  password reset, or roles beyond a hardcoded `user` claim.
- **Migrations can fail on dirty data.** Adding a `NOT NULL` column to a
  table that already has rows will abort. Reset with
  `docker compose down -v` only if you can lose local data, then run
  migrations again.
- **Tests are not wired up.** `npm test` / `npm run test:e2e` exist, but
  there are no spec files in the repo.

## Scripts

```bash
npm run start:dev
npm run build
npm run start:prod
npm run lint
npm test
npm run migration:generate -- <Name>
npm run migration:run
npm run migration:revert
```
