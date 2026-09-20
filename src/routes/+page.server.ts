import { initDb } from '$lib/db';
import { listSigns, listUnitsByBook } from '$lib/server/signs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  await initDb();

  const result = await listSigns({
    search: url.searchParams.get('search') ?? '',
    book: url.searchParams.get('book') ?? '',
    unit: url.searchParams.get('unit') ?? '',
    page: Number(url.searchParams.get('page') ?? 1),
  });

  return {
    ...result,
    unitsByBook: await listUnitsByBook(),
    filters: {
      search: url.searchParams.get('search') ?? '',
      book: url.searchParams.get('book') ?? '',
      unit: url.searchParams.get('unit') ?? '',
    },
  };
};