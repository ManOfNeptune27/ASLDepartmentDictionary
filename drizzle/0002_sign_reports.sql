CREATE TABLE IF NOT EXISTS `sign_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sign_id` integer NOT NULL,
	`sign_word` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL,
	`reviewed_at` text,
	`reviewer_username` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sign_reports_sign_id_idx` ON `sign_reports` (`sign_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sign_reports_status_idx` ON `sign_reports` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sign_reports_created_at_idx` ON `sign_reports` (`created_at`);
