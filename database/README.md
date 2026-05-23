# goeunserverhub database

- `geserverhub.sql` — MySQL dump (filename legacy; import into database `goeunserverhub`).
- `prisma/migrate-energy-geserverhub.sql` — energy table DDL only (empty schema).

## Restore (WSL)

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS goeunserverhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p goeunserverhub < database/geserverhub.sql
```

Or use the project script:

```bash
bash scripts/db-restore.sh database/geserverhub.sql
```

## Fresh export

```bash
npm run db:export
```
