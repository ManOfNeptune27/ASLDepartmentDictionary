CREATE TABLE IF NOT EXISTS `sign_books` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sign_id` integer NOT NULL,
	`book` text NOT NULL,
	`unit` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sign_books_sign_id_idx` ON `sign_books` (`sign_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sign_books_book_unit_idx` ON `sign_books` (`book`,`unit`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `sign_books_sign_book_unit_idx` ON `sign_books` (`sign_id`,`book`,`unit`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `signs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL,
	`gloss` text NOT NULL,
	`handshape` text NOT NULL,
	`location` text NOT NULL,
	`movement` text NOT NULL,
	`palm_orientation` text NOT NULL,
	`non_manual_signals` text NOT NULL,
	`gif_url` text NOT NULL,
	`gif_size` integer DEFAULT 0 NOT NULL,
	`submitted_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `signs_word_idx` ON `signs` (`word`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `teachers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `teachers_username_idx` ON `teachers` (`username`);