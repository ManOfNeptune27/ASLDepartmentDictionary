PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `signs_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `word` text NOT NULL,
  `gloss` text,
  `handshape` text,
  `location` text,
  `movement` text,
  `palm_orientation` text,
  `non_manual_signals` text,
  `gif_url` text NOT NULL,
  `gif_size` integer DEFAULT 0 NOT NULL,
  `submitted_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `signs_new` (
  `id`, `word`, `gloss`, `handshape`, `location`, `movement`,
  `palm_orientation`, `non_manual_signals`, `gif_url`, `gif_size`, `submitted_at`
)
SELECT
  `id`, `word`, NULLIF(`gloss`, 'N/A'), NULLIF(`handshape`, 'N/A'),
  NULLIF(`location`, 'N/A'), NULLIF(`movement`, 'N/A'),
  NULLIF(`palm_orientation`, 'N/A'), NULLIF(`non_manual_signals`, 'N/A'),
  `gif_url`, `gif_size`, `submitted_at`
FROM `signs`;
--> statement-breakpoint
DROP INDEX IF EXISTS `signs_word_idx`;
--> statement-breakpoint
DROP TABLE `signs`;
--> statement-breakpoint
ALTER TABLE `signs_new` RENAME TO `signs`;
--> statement-breakpoint
CREATE INDEX `signs_word_idx` ON `signs` (`word`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
