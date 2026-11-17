import { initDb } from '$lib/db';
import { listSigns, listUnitsByBook } from '$lib/server/signs';
import type { PageServerLoad } from './$types';

const EMPTY_UNITS: Record<string, string[]> = {};

export const load: PageServerLoad = async ({ url }) => {
  const filters = {
    search: url.searchParams.get('search') ?? '',
    book: url.searchParams.get('book') ?? '',
    unit: url.searchParams.get('unit') ?? '',
  };

  try {
    await initDb();

    const result = await listSigns({
      ...filters,
      page: Number(url.searchParams.get('page') ?? 1),
    });

    return {
      ...result,
      unitsByBook: await listUnitsByBook(),
      filters,
      loadError: null,
    };
  } catch (cause) {
    console.error('Failed to load dictionary signs', cause);
    return {
      signs: [],
      page: 1,
      pageSize: 24,
      total: 0,
      totalPages: 1,
      unitsByBook: EMPTY_UNITS,
      filters,
      loadError: 'We couldn’t retrieve signs. Check your connection and try again.',
    };
  }
};