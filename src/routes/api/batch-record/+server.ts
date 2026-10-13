import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db, initDb } from '$lib/db';
import { deleteGif } from '$lib/r2';
import { isTeacherAuthenticated } from '$lib/server/auth';

export const POST = async ({ request, cookies }: RequestEvent) => {
  if (!isTeacherAuthenticated(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    filename?: string;
    gifUrl?: string;
    gifSize?: number;
  } | null;
  const filename = body?.filename?.split(/[\\/]/).pop()?.trim() ?? '';
  const gifUrl = body?.gifUrl?.trim() ?? '';
  const gifSize = Number(body?.gifSize ?? 0);
  const word = filename.replace(/\.gif$/i, '').trim();

  if (!/\.gif$/i.test(filename) || !word || !gifUrl || !Number.isFinite(gifSize) || gifSize <= 0) {
    return json({ error: 'Invalid GIF record.' }, { status: 400 });
  }

  try {
    await initDb();
    const result = await db.execute({
      sql: `INSERT INTO signs (word, gloss, handshape, location, movement, palm_orientation, non_manual_signals, gif_url, gif_size, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [word, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', gifUrl, gifSize, new Date().toISOString()]
    });

    if (!result.lastInsertRowid) {
      await deleteGif(gifUrl).catch(() => undefined);
      return json({ error: 'Failed to save the sign.' }, { status: 500 });
    }

    await db.execute({
      sql: `INSERT INTO sign_books (sign_id, book, unit) VALUES (?, ?, ?)`,
      args: [Number(result.lastInsertRowid), 'MISCELLANEOUS', 'Uncategorized']
    });

    return json({ success: true, filename });
  } catch (error) {
    await deleteGif(gifUrl).catch(() => undefined);
    console.error('Batch record error:', error);
    return json({ error: 'Failed to save the GIF.' }, { status: 500 });
  }
};
