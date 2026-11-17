import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db, initDb } from '$lib/db';
import {
  SIGN_CONTENT_FIELDS,
  SIGN_CONTENT_MIN_FILLED_FIELDS,
} from '$lib/signContent';
import {
  countRecentReports,
  insertSignReport,
  isHoneypotFilled,
  reportDescription,
  reportDescriptionError,
  REPORT_SUBMITTED_MESSAGE,
  REPORT_WINDOW_LIMIT,
} from '$lib/server/signReports';

function signIdFromParam(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

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

  const parameterGroups = [
    { key: 'handshape', column: 'handshape', label: 'Related by handshape' },
    { key: 'location', column: 'location', label: 'Related by location' },
    { key: 'movement', column: 'movement', label: 'Related by movement' },
    { key: 'palmOrientation', column: 'palm_orientation', label: 'Related by palm orientation' },
    { key: 'nonManualSignals', column: 'non_manual_signals', label: 'Related by non-manual signals' },
  ] as const;

  const relatedCategory = books.find((book) => book.category)?.category;
  const relatedGroups = [];
  if (relatedCategory) {
    const relatedUnitResult = await db.execute({
      sql: `SELECT DISTINCT s.id, s.word
            FROM signs s
            JOIN sign_books sb ON sb.sign_id = s.id
            WHERE s.id != ? AND sb.unit = ?
            ORDER BY LOWER(s.word), s.id
            LIMIT 6`,
      args: [sign.id, relatedCategory],
    });

    if (relatedUnitResult.rows.length > 0) {
      relatedGroups.push({
        label: 'Related signs in the same unit',
        signs: relatedUnitResult.rows.map((related) => ({
          id: Number(related.id),
          word: publicValue(related.word),
        })),
      });
    }
  }

  for (const parameter of parameterGroups) {
    const value = sign[parameter.key];
    if (!value) continue;

    const relatedResult = await db.execute({
      sql: `SELECT DISTINCT s.id, s.word
            FROM signs s
            WHERE s.id != ?
              AND s.${parameter.column} IS NOT NULL
              AND TRIM(s.${parameter.column}) != ''
              AND UPPER(TRIM(s.${parameter.column})) != 'N/A'
              AND LOWER(TRIM(s.${parameter.column})) = LOWER(TRIM(?))
            ORDER BY LOWER(s.word), s.id
            LIMIT 6`,
      args: [sign.id, value],
    });

    if (relatedResult.rows.length > 0) {
      relatedGroups.push({
        label: parameter.label,
        signs: relatedResult.rows.map((related) => ({
          id: Number(related.id),
          word: publicValue(related.word),
        })),
      });
    }
  }

  const contentText = [
    sign.word,
    ...SIGN_CONTENT_FIELDS.map((field) => sign[field]),
    ...books.flatMap((book) => [book.source, book.category]),
  ].filter(Boolean).join(' ');

  return {
    sign,
    books,
    relatedGroups,
    filledFieldCount,
    isContentReady,
    contentText,
  };
};

export const actions: Actions = {
  report: async ({ request, params }) => {
    const formData = await request.formData();
    const description = reportDescription(formData.get('description'));

    if (isHoneypotFilled(formData.get('leave_blank'))) {
      return { reportSuccess: true, reportMessage: REPORT_SUBMITTED_MESSAGE };
    }

    const signId = signIdFromParam(params.id);
    if (!signId) {
      return fail(404, { reportError: 'This sign could not be found.', description });
    }

    await initDb();
    const signResult = await db.execute({
      sql: `SELECT id, word FROM signs WHERE id = ?`,
      args: [signId],
    });
    const row = signResult.rows[0];
    if (!row) {
      return fail(404, { reportError: 'This sign could not be found.', description });
    }

    const descriptionError = reportDescriptionError(description);
    if (descriptionError) {
      return fail(400, { reportError: descriptionError, description });
    }

    if ((await countRecentReports(signId)) >= REPORT_WINDOW_LIMIT) {
      return fail(429, {
        reportError: 'This sign has received several reports in a short time. Please try again later.',
        description,
      });
    }

    const signWord = String(row.word ?? '').trim() || `Sign ${signId}`;
    try {
      await insertSignReport(signId, signWord, description);
    } catch {
      return fail(500, {
        reportError: 'The report could not be saved. Please try again.',
        description,
      });
    }

    return { reportSuccess: true, reportMessage: REPORT_SUBMITTED_MESSAGE };
  },
};
