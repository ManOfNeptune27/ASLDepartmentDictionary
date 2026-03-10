import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { sourceData, sources, type WordEntry } from '$lib';

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
    const unit = toText(formData.get('unit'));
    const newUnit = toText(formData.get('newUnit'));
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

    if (!unit) {
      errors.unit = 'Please select a unit.';
    } else if (unit === ADD_NEW_UNIT_VALUE && !newUnit) {
      errors.newUnit = 'New unit name is required.';
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
          errors.word = `${duplicateNotice} Check “Allow duplicate / alternate version” to continue.`;
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
          unit,
          newUnit,
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
          unit,
          newUnit,
          handshape,
          location,
          movement,
          palmOrientation,
          nonManualSignals,
          allowDuplicate: allowDuplicate ? 'true' : ''
        }
      });
    }

    const submission = {
      word,
      gloss,
      books,
      unit: unit === ADD_NEW_UNIT_VALUE ? newUnit : unit,
      handshape,
      location,
      movement,
      palmOrientation,
      nonManualSignals,
      allowDuplicate,
      gifFileName: gifFile.name,
      gifSize: gifFile.size,
      submittedAt: new Date().toISOString()
    };

    return {
      success: true,
      message: 'Submission received. Connect this action to your MySQL insert next.',
      duplicateNotice,
      submission
    };
  }
};