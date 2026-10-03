import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const signs = sqliteTable(
  'signs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    word: text('word').notNull(),
    gloss: text('gloss'),
    handshape: text('handshape'),
    location: text('location'),
    movement: text('movement'),
    palmOrientation: text('palm_orientation'),
    nonManualSignals: text('non_manual_signals'),
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

export const sentences = sqliteTable(
  'sentences',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    text: text('text').notNull(),
    gifUrl: text('gif_url').notNull(),
    gifSize: integer('gif_size').notNull().default(0),
    submittedAt: text('submitted_at').notNull(),
  },
  (table) => ({
    textIndex: index('sentences_text_idx').on(table.text),
  }),
);

export const sentenceSigns = sqliteTable(
  'sentence_signs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sentenceId: integer('sentence_id').notNull(),
    signId: integer('sign_id').notNull(),
    position: integer('position').notNull(),
  },
  (table) => ({
    sentenceIndex: index('sentence_signs_sentence_id_idx').on(table.sentenceId),
    signIndex: index('sentence_signs_sign_id_idx').on(table.signId),
    sentencePositionIndex: uniqueIndex('sentence_signs_sentence_position_idx').on(
      table.sentenceId,
      table.position,
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