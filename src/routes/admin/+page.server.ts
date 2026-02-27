import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

const allowedGifMimeTypes = ['image/gif'];

function toText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();

    const word = toText(formData.get('word'));
    const book = toText(formData.get('book'));
    const unit = toText(formData.get('unit'));
    const handshape = toText(formData.get('handshape'));
    const location = toText(formData.get('location'));
    const movement = toText(formData.get('movement'));
    const palmOrientation = toText(formData.get('palmOrientation'));
    const nonManualSignals = toText(formData.get('nonManualSignals'));
    const gifEntry = formData.get('gif');
    let gifFile: File | null = null;

    const errors: Record<string, string> = {};

    if (!word) errors.word = 'Word is required.';
    if (!book) errors.book = 'Book is required.';

    const unitNumber = Number(unit);
    if (!unit) {
      errors.unit = 'Unit number is required.';
    } else if (!Number.isInteger(unitNumber) || unitNumber < 1) {
      errors.unit = 'Unit must be a whole number greater than 0.';
    }

    if (!handshape) errors.handshape = 'Handshape is required.';
    if (!location) errors.location = 'Location is required.';
    if (!movement) errors.movement = 'Movement is required.';
    if (!palmOrientation) errors.palmOrientation = 'Palm orientation is required.';
    if (!nonManualSignals) errors.nonManualSignals = 'Non-manual signals are required.';

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
          book,
          unit,
          handshape,
          location,
          movement,
          palmOrientation,
          nonManualSignals
        }
      });
    }

    if (!gifFile) {
      return fail(400, {
        success: false,
        errors: { gif: 'A GIF file is required.' } as Record<string, string>,
        values: {
          word,
          book,
          unit,
          handshape,
          location,
          movement,
          palmOrientation,
          nonManualSignals
        }
      });
    }

    const submission = {
      word,
      book,
      unit: unitNumber,
      handshape,
      location,
      movement,
      palmOrientation,
      nonManualSignals,
      gifFileName: gifFile.name,
      gifSize: gifFile.size,
      submittedAt: new Date().toISOString()
    };

    return {
      success: true,
      message: 'Submission received. Connect this action to your MySQL insert next.',
      submission
    };
  }
};