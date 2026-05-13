import { createClient } from '@libsql/client';
import { TURSO_URL, TURSO_AUTH_TOKEN } from '$env/static/private';

export const db = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS signs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      gloss TEXT NOT NULL,
      handshape TEXT NOT NULL,
      location TEXT NOT NULL,
      movement TEXT NOT NULL,
      palm_orientation TEXT NOT NULL,
      non_manual_signals TEXT NOT NULL,
      gif_url TEXT NOT NULL,
      submitted_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sign_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sign_id INTEGER NOT NULL,
      book TEXT NOT NULL,
      unit TEXT NOT NULL,
      FOREIGN KEY (sign_id) REFERENCES signs(id)
    )
  `);
}