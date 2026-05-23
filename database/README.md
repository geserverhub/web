# goeunserverhub database

- `geserverhub.sql` — Full MySQL dump (Prisma app tables + GE Energy monitoring tables + `MFactoryInquiry`). Import into database `goeunserverhub`.
- `prisma/migrate-energy-geserverhub.sql` — energy DDL only (devices, power_records, mqtt_settings, device_connectivity, ai_settings, …).
- `prisma/migrate-mfactory-inquiry.sql` — M-Factory booking table only.

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
