import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db, initDb } from '$lib/db';
import { deleteGif, uploadGifBuffer } from '$lib/r2';
import { isTeacherAuthenticated } from '$lib/server/auth';

function getBasename(filename: string) {
  return filename.split(/[\\/]/).pop() ?? filename;
}

export const POST = async ({ request, cookies }: RequestEvent) => {
  if (!isTeacherAuthenticated(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('gif');
  if (!(file instanceof File)) {
    return json({ error: 'No GIF file was provided.' }, { status: 400 });
  }

  const filename = getBasename(file.name);
  if (!/\.gif$/i.test(filename) || (file.type && file.type !== 'image/gif')) {
    return json({ error: 'Only GIF files are accepted.' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const signature = new TextDecoder().decode(buffer.slice(0, 6));
  if (signature !== 'GIF87a' && signature !== 'GIF89a') {
    return json({ error: 'The file is not a valid GIF.' }, { status: 400 });
  }

  const word = filename.replace(/\.gif$/i, '').trim();
  if (!word) {
    return json({ error: 'The GIF filename must contain a sign name.' }, { status: 400 });
  }

  try {
    await initDb();
    const gifUrl = await uploadGifBuffer(buffer, filename);
    try {
      const result = await db.execute({
        sql: `INSERT INTO signs (word, gloss, handshape, location, movement, palm_orientation, non_manual_signals, gif_url, gif_size, submitted_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [word, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', gifUrl, file.size, new Date().toISOString()]
      });

      if (!result.lastInsertRowid) {
        await deleteGif(gifUrl);
        return json({ error: 'Failed to save the sign.' }, { status: 500 });
      }

      await db.execute({
        sql: `INSERT INTO sign_books (sign_id, book, unit) VALUES (?, ?, ?)`,
        args: [Number(result.lastInsertRowid), 'MISCELLANEOUS', 'Uncategorized']
      });
    } catch (error) {
      await deleteGif(gifUrl).catch(() => undefined);
      throw error;
    }

    return json({ success: true, filename });
  } catch (error) {
    console.error('Batch upload error:', error);
    return json({ error: 'Failed to upload and save the GIF.' }, { status: 500 });
  }
};
