# Pod

A local-first personal AI steward for capturing, organizing, and recalling what matters—without turning every thought into a task.

> [!WARNING]
> The current app is an early TypeScript/Node.js agent prototype backed by SQLite. Its runtime uses Pi Agent Core; durable captures, tasks, and tool-call logs live in the database rather than agent session history. See [POD.md](POD.md) for product goals and boundaries.

## Current capabilities

- Write and query captures.
- Write and query tasks.
- Read the current time.
- Persist data and tool-call logs in SQLite, with schema migrations under `migrations/`.

The current entry point starts an agent loop; there is not yet a GUI or a complete capture-review workflow. Product directions in `POD.md` are goals, not implemented features. Treat this prototype as experimental.

## Requirements

- Node.js 22.12 or newer
- pnpm (the repository pins pnpm 12.8.1)

## Development

```sh
pnpm install
pnpm dev
```

Useful checks and production commands:

```sh
pnpm test       # run tests
pnpm exec tsc --noEmit
pnpm build      # compile to dist/
pnpm start      # run the compiled app (after building)
```

## SQLite data

The database and migrations are managed under `src/db/` and `migrations/`. The app creates the database directory and applies migrations when opening the database.

- Development (`pnpm dev` sets `APP_ENV=development`): `.data/dev.sqlite`
- Production (default): `$XDG_DATA_HOME/pod/data.sqlite`, or `~/.local/share/pod/data.sqlite` when `XDG_DATA_HOME` is unset
- `APP_DB_PATH`: optional explicit database file path, overriding either default

`APP_ENV` accepts `development` or `production`; if unset, it defaults to `production`. Add a new migration for schema changes rather than editing a migration that may already have been applied. Close the database connection when the process exits.

## System prompt profiles

The system prompt is assembled from `prompts/base.md` and one profile file (`prompts/production.md` or `prompts/development.md`) when the agent starts. Set `POD_PROFILE` to `production` or `development`; if unset, it defaults to `production`. Invalid values fail startup. Profile changes require starting a new agent/session.

```sh
pnpm dev                         # development prompt + development database
POD_PROFILE=production pnpm dev  # production prompt + development database
pnpm start                       # production prompt + production database
POD_PROFILE=development pnpm start # development prompt + production database
```

`POD_PROFILE` changes model instructions only. It does not change database paths, tool permissions, or approval enforcement; those remain application responsibilities.

The database is the operational store for application records and audit data. Agent session history is not a substitute for captures, tasks, review decisions, or tool-call logs.
