import { db, initDb } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  await initDb();

  const signsResult = await db.execute(`
    SELECT s.id, s.word, s.gloss, s.handshape, s.location, s.movement, 
           s.palm_orientation, s.non_manual_signals, s.gif_url
    FROM signs s
    ORDER BY s.word ASC
  `);

  const booksResult = await db.execute(`
    SELECT sb.sign_id, sb.book, sb.unit
    FROM sign_books sb
  `);

  const signs = signsResult.rows.map((row) => {
    const books = booksResult.rows
      .filter((b) => b.sign_id === row.id)
      .map((b) => ({ book: String(b.book), unit: String(b.unit) }));

    return {
      id: Number(row.id),
      word: String(row.word),
      gloss: String(row.gloss),
      gifUrl: String(row.gif_url),
      parameters: {
        handshape: String(row.handshape),
        location: String(row.location),
        movement: String(row.movement),
        palmOrientation: String(row.palm_orientation),
        nonManualSignals: String(row.non_manual_signals)
      },
      books
    };
  });

  return { signs };
};
