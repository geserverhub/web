# goeunserverhub database

**28 tables** — see [TABLES.md](./TABLES.md) for the full list (19 Prisma + 9 GE Energy).

- `geserverhub.sql` — Full MySQL dump (all 28 tables). Import into database `goeunserverhub`.
- `seed-partner-transactions-20260529.sql` — Partner dashboard only (10 PIN/EXP rows, safe to re-run).
- `GEserverhub-full-backup-*.tar.gz` — Full repo snapshot (code + `database/`, no `node_modules`/`.next`/`.env*`). Extract then `npm install` and restore DB.
- `prisma/migrate-energy-geserverhub.sql` — energy DDL only (devices, power_records, mqtt_settings, device_connectivity, ai_settings, …).
- `prisma/migrate-mfactory-inquiry.sql` — M-Factory booking table only.

## Restore (WSL / GE-SERVER)

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS goeunserverhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p goeunserverhub < database/geserverhub.sql
```

**MariaDB / older MySQL:** dumps from MySQL 8 may use `utf8mb4_0900_ai_ci`. This repo normalizes that on export. If import fails at `broadcast_messages`, run:

```bash
sed -i 's/utf8mb4_0900_ai_ci/utf8mb4_unicode_ci/g' database/geserverhub.sql
```

Partner-only (10 rows, no full restore):

```bash
mysql -u USER -p goeunserverhub < database/seed-partner-transactions-20260529.sql
```

Or use the project script:

```bash
bash scripts/db-restore.sh database/geserverhub.sql
```

## Fresh export

```bash
npm run db:export
```
