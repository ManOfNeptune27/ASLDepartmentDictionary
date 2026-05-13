import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { sourceData, sources, type WordEntry } from '$lib';
import { db, initDb } from '$lib/db';
import { uploadGif } from '$lib/r2';

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

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();

    const word = toText(formData.get('word'));
    const gloss = toText(formData.get('gloss'));
    const books = formData
      .getAll('books')
      .map((value) => toText(value))
      .filter(Boolean);

    const rawPairs = formData
      .getAll('bookUnitPair')
      .map((v) => toText(v))
      .filter(Boolean);
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
        duplicateNotice = `This word is already present in ${locations.join('; ')}. It may already be uploaded in a different book/unit.`;
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
          word,
          gloss,
          books,
          bookUnitPairs: rawPairs,
          handshape,
          location,
          movement,
          palmOrientation,
          nonManualSignals,
          allowDuplicate: allowDuplicate ? 'true' : ''
        }
      });
    }

    if (!gifFile) {
      return fail(400, {
        success: false,
        errors: { gif: 'A GIF file is required.' } as Record<string, string>,
        values: {
          word,
          gloss,
          books,
          bookUnitPairs: rawPairs,
          handshape,
          location,
          movement,
          palmOrientation,
          nonManualSignals,
          allowDuplicate: allowDuplicate ? 'true' : ''
        }
      });
    }

    await initDb();

    const gifUrl = await uploadGif(gifFile);

    const result = await db.execute({
      sql: `INSERT INTO signs (word, gloss, handshape, location, movement, palm_orientation, non_manual_signals, gif_url, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [word, gloss, handshape, location, movement, palmOrientation, nonManualSignals, gifUrl, new Date().toISOString()]
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
        bookUnitPairs: bookUnitPairs.map((pair) => ({
          book: pair.book,
          unit: pair.unit
        }))
      }
    };
  }
};