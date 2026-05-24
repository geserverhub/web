/**
 * Import users from phpMyAdmin dump (e.g. User (4).sql).
 * Usage: node scripts/import-user-sql.mjs "/mnt/c/Users/note/Downloads/User (4).sql"
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const sqlPath =
  process.argv[2] ||
  'C:/Users/note/Downloads/User (4).sql';

const dbName = process.env.DB_NAME || 'goeunserverhub';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'geserverhub',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  multipleStatements: true,
});

const raw = readFileSync(sqlPath, 'utf8');

// Parse INSERT rows from dump
const insertMatch = raw.match(
  /INSERT INTO `User`[\s\S]+?VALUES\s*([\s\S]+?);/i
);
if (!insertMatch) {
  console.error('No INSERT INTO User found in file');
  process.exit(1);
}

const valueBlock = insertMatch[1];
const rowRegex =
  /\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*([^,]+),\s*([^,]+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)/g;

const rows = [];
let m;
while ((m = rowRegex.exec(valueBlock)) !== null) {
  rows.push({
    id: m[1],
    name: m[2],
    username: m[3],
    email: m[4],
    emailVerified: m[5] === 'NULL' ? null : m[5],
    image: m[6] === 'NULL' ? null : m[6],
    password: m[7],
    role: m[8],
    createdAt: m[9],
    updatedAt: m[10],
    clientId: m[11],
  });
}

const [[hub]] = await conn.query(
  "SELECT id FROM Client WHERE slug = 'goeun-server-hub' LIMIT 1"
);
const defaultClientId = hub?.id || null;

console.log(`Importing ${rows.length} user(s) into ${dbName}...`);

for (const row of rows) {
  let password = row.password;
  if (!password.startsWith('$2')) {
    password = await bcrypt.hash(password, 12);
    console.log(`  hashed plaintext password for ${row.username}`);
  }

  let clientId = row.clientId;
  const [[client]] = await conn.query('SELECT id FROM Client WHERE id = ? LIMIT 1', [
    clientId,
  ]);
  if (!client) {
    clientId = defaultClientId;
    console.log(`  ${row.username}: clientId remapped → goeun-server-hub`);
  }

  await conn.query(
    `INSERT INTO User (id, name, username, email, emailVerified, image, password, role, createdAt, updatedAt, clientId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       username = VALUES(username),
       email = VALUES(email),
       password = VALUES(password),
       role = VALUES(role),
       updatedAt = VALUES(updatedAt),
       clientId = VALUES(clientId)`,
    [
      row.id,
      row.name,
      row.username,
      row.email,
      null,
      null,
      password,
      row.role,
      row.createdAt,
      row.updatedAt,
      clientId,
    ]
  );
  console.log(`  OK ${row.name} (${row.username}) role=${row.role}`);
}

const [users] = await conn.query(
  'SELECT name, username, email, role FROM User ORDER BY role, username'
);
console.log('\nUsers now:');
console.table(users);
await conn.end();
