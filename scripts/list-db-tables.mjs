import { config } from "dotenv";
import mysql from "mysql2/promise";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });

const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
});

const [rows] = await conn.query(
  "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
);
console.log(rows.map((r) => r.TABLE_NAME).join("\n"));
await conn.end();
