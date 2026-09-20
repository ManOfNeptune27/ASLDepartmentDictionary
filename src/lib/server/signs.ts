import { and, asc, countDistinct, eq, like, sql } from 'drizzle-orm';
import { drizzleDb } from '$lib/db';
import { signBooks, signs } from '$lib/schema';

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;

export type SignFilters = {
  search?: string;
  book?: string;
  unit?: string;
  page?: number;
  pageSize?: number;
};

function parseBooks(value: string | null) {
  if (!value) return [];
  try {
    return JSON.parse(value) as { book: string; unit: string }[];
  } catch {
    return [];
  }
}

export async function listSigns(filters: SignFilters = {}) {
  const pageSize = Math.min(Math.max(filters.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const page = Math.max(filters.page ?? 1, 1);
  const search = filters.search?.trim() ?? '';
  const conditions = [];

  if (search) conditions.push(like(signs.word, `%${search}%`));
  if (filters.book) conditions.push(eq(signBooks.book, filters.book));
  if (filters.unit) conditions.push(eq(signBooks.unit, filters.unit));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const totalResult = await drizzleDb
    .select({ total: countDistinct(signs.id) })
    .from(signs)
    .leftJoin(signBooks, eq(signBooks.signId, signs.id))
    .where(where);

  const total = Number(totalResult[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const bookData = sql<string>`json_group_array(json_object('book', ${signBooks.book}, 'unit', ${signBooks.unit}))`;
  const orderByWord = sql`lower(${signs.word})`;

  const rows = await drizzleDb
    .select({
      id: signs.id,
      word: signs.word,
      gloss: signs.gloss,
      gifUrl: signs.gifUrl,
      handshape: signs.handshape,
      location: signs.location,
      movement: signs.movement,
      palmOrientation: signs.palmOrientation,
      nonManualSignals: signs.nonManualSignals,
      books: bookData,
    })
    .from(signs)
    .leftJoin(signBooks, eq(signBooks.signId, signs.id))
    .where(where)
    .groupBy(signs.id)
    .orderBy(asc(orderByWord), asc(signs.id))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  return {
    signs: rows.map((row) => ({
      id: row.id,
      word: row.word,
      gloss: row.gloss,
      gifUrl: row.gifUrl,
      parameters: {
        handshape: row.handshape,
        location: row.location,
        movement: row.movement,
        palmOrientation: row.palmOrientation,
        nonManualSignals: row.nonManualSignals,
      },
      books: parseBooks(row.books),
    })),
    page: currentPage,
    pageSize,
    total,
    totalPages,
  };
}

export async function listUnitsByBook() {
  const rows = await drizzleDb
    .selectDistinct({ book: signBooks.book, unit: signBooks.unit })
    .from(signBooks)
    .orderBy(asc(signBooks.book), asc(signBooks.unit));

  return rows.reduce<Record<string, string[]>>((result, row) => {
    result[row.book] ??= [];
    result[row.book].push(row.unit);
    return result;
  }, {});
}