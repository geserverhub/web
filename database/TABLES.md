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

## GE Energy app extensions (14) — `prisma/migrate-ge-energy-app-extensions.sql`

| Table | Purpose |
|-------|---------|
| `ge_electricity_rates` | Per-site / per-period electricity rate rules |
| `ge_energy_meter_device_binding` | Meter channel ↔ device mapping |
| `ge_customer_energy_saver_orders` | Energy saver product orders |
| `broadcast_messages` | Customer broadcast banners |
| `product_list` | Energy dashboard product catalog |
| `notifications` | Dashboard alert feed |
| `api_keys` | Developer API keys |
| `feedback_replies` | Feedback thread replies |
| `user_permissions` | Portal access per user |
| `ge_after_sales_chat_thread` | After-sales chat sessions |
| `ge_after_sales_chat_message` | Chat messages |
| `ge_platform_device_registration` | Device registration on signup |

**Total: 19 + 9 + 2 + 14 = 44** (plus ERP tables in separate migration)

**Full setup (recommended):** `npm run db:setup-full`  
Restore dump + migrations: `node scripts/setup-full-database.mjs --restore`  
Energy SQL only: `npm run db:setup-energy`  
Meter orders only: `npm run db:setup-geet-orders`
