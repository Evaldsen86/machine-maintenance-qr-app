# Database Folder (Phase 5 Skeleton)

## Purpose
This folder contains the new PostgreSQL/Prisma schema design for future self-hosted deployment.

- Prisma schema: `database/prisma/schema.prisma`
- Schema documentation: `docs/DATABASE_SCHEMA.md`

No existing frontend or backend business logic is connected to this schema yet.

---

## Planned Migration Workflow (later phases)

This repository does not yet include Prisma CLI dependencies or migration scripts.  
When implementation begins, use this workflow:

1. Add Prisma tooling:
   - `prisma` (dev dependency)
   - `@prisma/client` (dependency)
2. Add scripts in root `package.json` (or backend `package.json`):
   - `prisma:generate`
   - `prisma:migrate:dev`
   - `prisma:migrate:deploy`
   - `prisma:studio` (optional)
3. Run initial migration:
   - `npx prisma migrate dev --schema database/prisma/schema.prisma --name init`
4. Commit:
   - `database/prisma/migrations/*`
   - generated Prisma schema changes

For production:
- Use `prisma migrate deploy` during deployment/startup
- Never run `migrate dev` directly in production

---

## Environment

Prisma schema reads:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

For Docker Compose self-hosting skeleton, this comes from `.env`.

---

## Migration Safety Rules (recommended)

1. Use additive migrations first (new columns/tables) before destructive changes.
2. For destructive operations, create a backup checkpoint first.
3. Keep backward compatibility while frontend/backend migration is in progress.
4. Validate migration on staging before production rollout.
5. Gate all production writes through backend tenant checks (`company_id`).

