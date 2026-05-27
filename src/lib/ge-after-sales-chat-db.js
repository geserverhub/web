import { randomUUID } from 'crypto';
import { queryGeserverhub } from '@/lib/geserverhub-db';

let ensured = false;

export async function ensureAfterSalesChatSchema() {
  if (ensured) return;

  await queryGeserverhub(`
    CREATE TABLE IF NOT EXISTS ge_after_sales_chat_thread (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      thread_code VARCHAR(64) NOT NULL,
      customer_lang VARCHAR(16) NULL,
      customer_name VARCHAR(191) NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      last_message_preview VARCHAR(500) NULL,
      last_customer_message_at DATETIME NULL,
      last_agent_message_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_ge_after_sales_chat_thread_code (thread_code),
      KEY idx_ge_after_sales_chat_thread_status (status),
      KEY idx_ge_after_sales_chat_thread_updated (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await queryGeserverhub(`
    CREATE TABLE IF NOT EXISTS ge_after_sales_chat_message (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      thread_id BIGINT UNSIGNED NOT NULL,
      sender VARCHAR(20) NOT NULL,
      sender_name VARCHAR(191) NULL,
      message_text TEXT NOT NULL,
      read_by_customer TINYINT(1) NOT NULL DEFAULT 0,
      read_by_agent TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_ge_after_sales_chat_message_thread (thread_id, id),
      CONSTRAINT fk_ge_after_sales_chat_message_thread
        FOREIGN KEY (thread_id) REFERENCES ge_after_sales_chat_thread(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  ensured = true;
}

function makeThreadCode() {
  return `chat_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export async function ensureThreadByCode(threadCode, lang = 'en') {
  await ensureAfterSalesChatSchema();
  const code = String(threadCode || '').trim();
  if (code) {
    const rows = await queryGeserverhub(
      `SELECT * FROM ge_after_sales_chat_thread WHERE thread_code = ? LIMIT 1`,
      [code]
    );
    if (rows[0]) return rows[0];
  }

  const newCode = makeThreadCode();
  await queryGeserverhub(
    `INSERT INTO ge_after_sales_chat_thread (thread_code, customer_lang, status) VALUES (?, ?, 'open')`,
    [newCode, lang || null]
  );
  const rows = await queryGeserverhub(
    `SELECT * FROM ge_after_sales_chat_thread WHERE thread_code = ? LIMIT 1`,
    [newCode]
  );
  return rows[0] || null;
}

export async function getThreadByCode(threadCode) {
  await ensureAfterSalesChatSchema();
  const code = String(threadCode || '').trim();
  if (!code) return null;
  const rows = await queryGeserverhub(
    `SELECT * FROM ge_after_sales_chat_thread WHERE thread_code = ? LIMIT 1`,
    [code]
  );
  return rows[0] || null;
}

export async function appendChatMessage({ threadId, sender, senderName, text }) {
  await ensureAfterSalesChatSchema();
  const cleanText = String(text || '').trim();
  if (!cleanText) throw new Error('Message is empty');

  await queryGeserverhub(
    `INSERT INTO ge_after_sales_chat_message (thread_id, sender, sender_name, message_text, read_by_customer, read_by_agent)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      threadId,
      sender,
      senderName || null,
      cleanText,
      sender === 'customer' ? 1 : 0,
      sender === 'agent' ? 1 : 0,
    ]
  );

  const field = sender === 'agent' ? 'last_agent_message_at' : 'last_customer_message_at';
  await queryGeserverhub(
    `UPDATE ge_after_sales_chat_thread
     SET ${field} = NOW(), last_message_preview = ?, status = 'open'
     WHERE id = ?`,
    [cleanText.slice(0, 500), threadId]
  );
}

export async function listThreadMessages(threadId, afterId = 0) {
  await ensureAfterSalesChatSchema();
  const rows = await queryGeserverhub(
    `SELECT id, sender, sender_name, message_text, created_at
     FROM ge_after_sales_chat_message
     WHERE thread_id = ? AND id > ?
     ORDER BY id ASC
     LIMIT 300`,
    [threadId, Number(afterId) || 0]
  );
  return rows;
}

export async function listChatThreads(limit = 100) {
  await ensureAfterSalesChatSchema();
  const rows = await queryGeserverhub(
    `SELECT
       t.id,
       t.thread_code,
       t.customer_lang,
       t.customer_name,
       t.status,
       t.last_message_preview,
       t.last_customer_message_at,
       t.last_agent_message_at,
       t.created_at,
       t.updated_at,
       (
         SELECT COUNT(*)
         FROM ge_after_sales_chat_message m
         WHERE m.thread_id = t.id
           AND m.sender = 'customer'
           AND m.read_by_agent = 0
       ) AS unread_customer_count
     FROM ge_after_sales_chat_thread t
     ORDER BY t.updated_at DESC
     LIMIT ?`,
    [Number(limit) || 100]
  );
  return rows;
}

export async function markThreadReadByAgent(threadId) {
  await queryGeserverhub(
    `UPDATE ge_after_sales_chat_message
     SET read_by_agent = 1
     WHERE thread_id = ? AND sender = 'customer'`,
    [threadId]
  );
}

export async function markThreadReadByCustomer(threadId) {
  await queryGeserverhub(
    `UPDATE ge_after_sales_chat_message
     SET read_by_customer = 1
     WHERE thread_id = ? AND sender = 'agent'`,
    [threadId]
  );
}
