import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sourceData, sources, type WordEntry } from '$lib';
import { db, initDb } from '$lib/db';
import { uploadGif, deleteGif } from '$lib/r2';
import { env } from '$env/dynamic/private';
import { isLoggedInUserAdmin, getLoggedInUser } from '$lib/server/auth';

const allowedGifMimeTypes = ['image/gif'];
const ADD_NEW_UNIT_VALUE = '__add_new_unit__';

function toText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeWord(value: string) {
  return value.trim().toLowerCase();
}

function toWordText(entry: WordEntry) {
  return typeof entry === 'string' ? entry : entry.word;
}

export const load: PageServerLoad = async ({ cookies }) => {
  await initDb();

  const signsResult = await db.execute(`
    SELECT s.id, s.word, s.gloss, s.gif_url, s.submitted_at
    FROM signs s
    ORDER BY s.word ASC
  `);

  const booksResult = await db.execute(`
    SELECT sb.sign_id, sb.book, sb.unit FROM sign_books sb
  `);

  const unitsByBook = booksResult.rows.reduce((acc: Record<string, string[]>, row) => {
    const book = String(row.book);
    const unit = String(row.unit);
    if (!acc[book]) acc[book] = [];
    if (!acc[book].includes(unit)) acc[book].push(unit);
    return acc;
  }, {});

  const signs = signsResult.rows.map((row) => {
    const books = booksResult.rows
      .filter((b) => b.sign_id === row.id)
      .map((b) => ({ book: String(b.book), unit: String(b.unit) }));
    return {
      id: Number(row.id),
      word: String(row.word),
      gloss: String(row.gloss),
      gifUrl: String(row.gif_url),
      submittedAt: String(row.submitted_at),
      books
    };
  });

  const teachersResult = await db.execute(`SELECT id, username, created_at FROM teachers ORDER BY created_at ASC`);
  const teachers = teachersResult.rows.map((row) => ({
    id: Number(row.id),
    username: String(row.username),
    createdAt: String(row.created_at)
  }));

  const storageSizeResult = await db.execute(`SELECT SUM(gif_size) as total FROM signs`);
  const totalStorageBytes = Number(storageSizeResult.rows[0]?.total ?? 0);
  const storageLimitBytes = 9.8 * 1024 * 1024 * 1024;
  const storagePercent = Math.round((totalStorageBytes / storageLimitBytes) * 100);
  const storageMB = (totalStorageBytes / (1024 * 1024)).toFixed(1);

  const isAdmin = isLoggedInUserAdmin(cookies);

  return { signs, unitsByBook, teachers, isAdmin, storagePercent, storageMB };
};

export const actions: Actions = {
  upload: async ({ request }) => {
    const formData = await request.formData();

    const word = toText(formData.get('word'));
    const gloss = toText(formData.get('gloss'));
    const books = formData.getAll('books').map((value) => toText(value)).filter(Boolean);

    const rawPairs = formData.getAll('bookUnitPair').map((v) => toText(v)).filter(Boolean);
    const PAIR_SEP = '|||';
    const bookUnitPairs: { book: string; unit: string }[] = rawPairs.map((raw) => {
      const parts = raw.split(PAIR_SEP);
      const book = parts[0] ?? '';
      const unitVal = parts[1] ?? '';
      const customUnit = parts[2] ?? '';
      const unit = unitVal === ADD_NEW_UNIT_VALUE ? customUnit : unitVal;
      return { book, unit };
    });

    const allowDuplicate = toText(formData.get('allowDuplicate')) === 'true';
    const handshape = toText(formData.get('handshape'));
    const location = toText(formData.get('location'));
    const movement = toText(formData.get('movement'));
    const palmOrientation = toText(formData.get('palmOrientation'));
    const nonManualSignals = toText(formData.get('nonManualSignals'));
    const gifEntry = formData.get('gif');
    let gifFile: File | null = null;

    const errors: Record<string, string> = {};

    if (!word) errors.word = 'Word is required.';
    if (!gloss) errors.gloss = 'Gloss is required.';
    if (books.length === 0) errors.books = 'Select at least one book.';

    const missingUnits = books.filter((book) => {
      const pair = bookUnitPairs.find((p) => p.book === book);
      return !pair || !pair.unit.trim();
    });
    if (missingUnits.length > 0) {
      errors.bookUnitPairs = `Please select a unit for: ${missingUnits.join(', ')}.`;
    }

    if (!handshape) errors.handshape = 'Handshape is required.';
    if (!location) errors.location = 'Location is required.';
    if (!movement) errors.movement = 'Movement is required.';
    if (!palmOrientation) errors.palmOrientation = 'Palm orientation is required.';
    if (!nonManualSignals) errors.nonManualSignals = 'Non-manual signals are required.';

    const submittedWord = normalizeWord(word);
    let duplicateNotice = '';

    if (submittedWord) {
      const locations = sources.flatMap((source) =>
        sourceData[source.id].units.flatMap((unitData) =>
          unitData.words
            .map((entry) => toWordText(entry))
            .filter((existingWord) => normalizeWord(existingWord) === submittedWord)
            .map(() => `${source.label} / ${unitData.name}`)
        )
      );

      if (locations.length > 0) {
        duplicateNotice = `This word is already present in ${locations.join('; ')}.`;
        if (!allowDuplicate) {
          errors.word = `${duplicateNotice} Check "Allow duplicate / alternate version" to continue.`;
        }
      }
    }

    if (!(gifEntry instanceof File) || gifEntry.size === 0) {
      errors.gif = 'A GIF file is required.';
    } else if (!allowedGifMimeTypes.includes(gifEntry.type)) {
      errors.gif = 'Only .gif uploads are allowed.';
    } else {
      gifFile = gifEntry;
    }

    if (Object.keys(errors).length > 0) {
      return fail(400, {
        success: false,
        errors,
        values: {
          word, gloss, books, bookUnitPairs: rawPairs,
          handshape, location, movement, palmOrientation,
          nonManualSignals, allowDuplicate: allowDuplicate ? 'true' : ''
        }
      });
    }

    if (!gifFile) {
      return fail(400, {
        success: false,
        errors: { gif: 'A GIF file is required.' } as Record<string, string>,
        values: {
          word, gloss, books, bookUnitPairs: rawPairs,
          handshape, location, movement, palmOrientation,
          nonManualSignals, allowDuplicate: allowDuplicate ? 'true' : ''
        }
      });
    }

    await initDb();

    const STORAGE_LIMIT_BYTES = 9.8 * 1024 * 1024 * 1024;
    const totalSizeResult = await db.execute(`SELECT SUM(gif_size) as total FROM signs`);
    const totalSize = Number(totalSizeResult.rows[0]?.total ?? 0);

    if (totalSize + gifFile.size > STORAGE_LIMIT_BYTES) {
      return fail(400, {
        success: false,
        errors: { gif: 'Storage limit reached (9.8GB). Please contact the administrator to remove old GIFs before uploading new ones.' } as Record<string, string>,
        values: {
          word, gloss, books, bookUnitPairs: rawPairs,
          handshape, location, movement, palmOrientation,
          nonManualSignals, allowDuplicate: allowDuplicate ? 'true' : ''
        }
      });
    }

    const gifUrl = await uploadGif(gifFile);

    const result = await db.execute({
      sql: `INSERT INTO signs (word, gloss, handshape, location, movement, palm_orientation, non_manual_signals, gif_url, gif_size, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [word, gloss, handshape, location, movement, palmOrientation, nonManualSignals, gifUrl, gifFile.size, new Date().toISOString()]
    });

    const signId = result.lastInsertRowid;
    if (!signId) {
      return fail(500, {
        success: false,
        errors: { general: 'Failed to save sign to database.' } as Record<string, string>
      });
    }

    for (const pair of bookUnitPairs) {
      await db.execute({
        sql: `INSERT INTO sign_books (sign_id, book, unit) VALUES (?, ?, ?)`,
        args: [Number(signId), pair.book, pair.unit]
      });
    }

    return {
      success: true,
      message: 'Sign submitted successfully!',
      duplicateNotice,
      submission: {
        word,
        gloss,
        gifFileName: gifFile.name,
        bookUnitPairs: bookUnitPairs.map((pair) => ({ book: pair.book, unit: pair.unit }))
      }
    };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = toText(formData.get('id'));
    const gifUrl = toText(formData.get('gifUrl'));

    if (!id) return fail(400, { success: false, errors: { general: 'Missing sign ID.' } });

    await db.execute({ sql: `DELETE FROM sign_books WHERE sign_id = ?`, args: [Number(id)] });
    await db.execute({ sql: `DELETE FROM signs WHERE id = ?`, args: [Number(id)] });

    if (gifUrl) await deleteGif(gifUrl);

    return { success: true, message: 'Sign deleted successfully.' };
  },

  addTeacher: async ({ request, cookies }) => {
    const formData = await request.formData();
    const username = toText(formData.get('teacherUsername'));
    const password = toText(formData.get('teacherPassword'));

    if (!username || !password) {
      return fail(400, { success: false, errors: { teacher: 'Username and password are required.' } } as any);
    }

    if (!isLoggedInUserAdmin(cookies)) {
      return fail(403, { success: false, errors: { teacher: 'Only the admin can manage teacher accounts.' } } as any);
    }

    try {
      await db.execute({
        sql: `INSERT INTO teachers (username, password, created_at) VALUES (?, ?, ?)`,
        args: [username, password, new Date().toISOString()]
      });
    } catch {
      return fail(400, { success: false, errors: { teacher: 'That username is already taken.' } } as any);
    }

    return { success: true, message: 'Teacher account created!' };
  },

  deleteTeacher: async ({ request, cookies }) => {
    const formData = await request.formData();
    const id = toText(formData.get('teacherId'));

    if (!id) return fail(400, { success: false, errors: { teacher: 'Missing teacher ID.' } });

    if (!isLoggedInUserAdmin(cookies)) {
      return fail(403, { success: false, errors: { teacher: 'Only the admin can manage teacher accounts.' } } as any);
    }

    await db.execute({
      sql: `DELETE FROM teachers WHERE id = ?`,
      args: [Number(id)]
    });

    return { success: true, message: 'Teacher account removed.' };
  }

};