# goeunserverhub — 28 tables

Database name: **`goeunserverhub`** (dump file: `geserverhub.sql`)

## Prisma app (19)

| Table | Purpose |
|-------|---------|
| `User` | Users & auth |
| `Account` | OAuth accounts |
| `Session` | Sessions |
| `VerificationToken` | Email verification |
| `Client` | Hub clients |
| `Service` | Services catalog |
| `ClientService` | Client ↔ service |
| `Invoice` | Invoices |
| `Receipt` | Receipts |
| `ReceiptItem` | Receipt line items |
| `Customer` | End customers |
| `Notification` | Notifications |
| `Expense` | Expenses |
| `Product` | Products |
| `PartnerTask` | Partner tasks |
| `PartnerTransaction` | Partner ledger |
| `PartnerProduct` | Partner marketplace |
| `MFactoryInquiry` | M-Factory booking form |
| `CargoOrder` | Cargo orders |

## GE Energy (9) — raw MySQL, see `prisma/migrate-energy-geserverhub.sql`

| Table | Purpose |
|-------|---------|
| `devices` | Meters / devices |
| `power_records` | Energy readings |
| `power_records_preinstall` | Pre-install readings |
| `user_feedback` | User feedback |
| `support_tickets` | Support tickets |
| `device_notifications` | Device alerts |
| `mqtt_settings` | MQTT broker config |
| `device_connectivity` | Modbus / gateway per device |
| `ai_settings` | OpenAI token per user |

## GE Energy Tech orders (2) — `prisma/migrate-ge-energy-tech-orders.sql`

| Table | Purpose |
|-------|---------|
| `geet_meter_order` | Smart meter purchase orders (PK `id`, unique `order_no`) |
| `geet_meter_order_event` | Shipment timeline events (FK → `geet_meter_order.id`) |

**Total: 19 + 9 + 2 = 30** (plus ERP tables in separate migration)

Restore: `bash scripts/db-restore.sh` or `npm run db:setup-energy`  
Meter orders: `npm run db:setup-geet-orders`
