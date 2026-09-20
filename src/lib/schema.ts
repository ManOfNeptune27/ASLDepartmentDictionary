import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const signs = sqliteTable(
  'signs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    word: text('word').notNull(),
    gloss: text('gloss').notNull(),
    handshape: text('handshape').notNull(),
    location: text('location').notNull(),
    movement: text('movement').notNull(),
    palmOrientation: text('palm_orientation').notNull(),
    nonManualSignals: text('non_manual_signals').notNull(),
    gifUrl: text('gif_url').notNull(),
    gifSize: integer('gif_size').notNull().default(0),
    submittedAt: text('submitted_at').notNull(),
  },
  (table) => ({
    wordIndex: index('signs_word_idx').on(table.word),
  }),
);

export const signBooks = sqliteTable(
  'sign_books',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    signId: integer('sign_id').notNull(),
    book: text('book').notNull(),
    unit: text('unit').notNull(),
  },
  (table) => ({
    signIndex: index('sign_books_sign_id_idx').on(table.signId),
    bookUnitIndex: index('sign_books_book_unit_idx').on(table.book, table.unit),
    uniqueAssignment: uniqueIndex('sign_books_sign_book_unit_idx').on(
      table.signId,
      table.book,
      table.unit,
    ),
  }),
);

export const teachers = sqliteTable(
  'teachers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull(),
    password: text('password').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    usernameIndex: uniqueIndex('teachers_username_idx').on(table.username),
  }),
);