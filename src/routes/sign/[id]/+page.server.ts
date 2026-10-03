import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db, initDb } from '$lib/db';
import {
  SIGN_CONTENT_FIELDS,
  SIGN_CONTENT_MIN_FILLED_FIELDS,
} from '$lib/signContent';

function publicValue(value: unknown) {
  const text = String(value ?? '').trim();
  return text === 'N/A' ? '' : text;
}

export const load: PageServerLoad = async ({ params }) => {
  await initDb();

  const signResult = await db.execute({
    sql: `SELECT id, word, gloss, handshape, location, movement,
                 palm_orientation, non_manual_signals, gif_url
          FROM signs WHERE id = ?`,
    args: [Number(params.id)],
  });
  const row = signResult.rows[0];
  if (!row) throw error(404, 'Sign not found');

  const sign = {
    id: Number(row.id),
    word: publicValue(row.word),
    gloss: publicValue(row.gloss),
    handshape: publicValue(row.handshape),
    location: publicValue(row.location),
    movement: publicValue(row.movement),
    palmOrientation: publicValue(row.palm_orientation),
    nonManualSignals: publicValue(row.non_manual_signals),
    gifUrl: publicValue(row.gif_url),
  };

  const filledFieldCount = SIGN_CONTENT_FIELDS.filter((field) => Boolean(sign[field])).length;
  const isContentReady = filledFieldCount >= SIGN_CONTENT_MIN_FILLED_FIELDS;
  const booksResult = await db.execute({
    sql: `SELECT book, unit FROM sign_books WHERE sign_id = ? ORDER BY book, unit`,
    args: [sign.id],
  });
  const books = booksResult.rows.map((book) => ({
    source: publicValue(book.book),
    category: publicValue(book.unit),
  }));

  const relatedCategory = books.find((book) => book.category)?.category;
  const relatedResult = relatedCategory
    ? await db.execute({
        sql: `SELECT DISTINCT s.id, s.word
              FROM signs s
              JOIN sign_books sb ON sb.sign_id = s.id
              WHERE s.id != ? AND sb.unit = ?
              ORDER BY LOWER(s.word), s.id
              LIMIT 6`,
        args: [sign.id, relatedCategory],
      })
    : { rows: [] };

  const contentText = [
    sign.word,
    ...SIGN_CONTENT_FIELDS.map((field) => sign[field]),
    ...books.flatMap((book) => [book.source, book.category]),
  ].filter(Boolean).join(' ');

  return {
    sign,
    books,
    relatedSigns: relatedResult.rows.map((related) => ({
      id: Number(related.id),
      word: publicValue(related.word),
    })),
    filledFieldCount,
    isContentReady,
    contentText,
  };
};
