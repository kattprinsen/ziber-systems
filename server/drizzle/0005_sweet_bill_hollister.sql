CREATE TABLE `task_log_members_backfill` (
	`task_log_id` integer NOT NULL,
	`member_id` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `task_log_members_backfill` (`task_log_id`, `member_id`) SELECT `id`, `member_id` FROM `task_logs`;
--> statement-breakpoint
CREATE TABLE `__new_task_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`completed_at` text NOT NULL,
	`source` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_task_logs` (`id`, `task_id`, `completed_at`, `source`) SELECT `id`, `task_id`, `completed_at`, `source` FROM `task_logs`;
--> statement-breakpoint
DROP TABLE `task_logs`;
--> statement-breakpoint
ALTER TABLE `__new_task_logs` RENAME TO `task_logs`;
--> statement-breakpoint
CREATE TABLE `task_log_members` (
	`task_log_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	FOREIGN KEY (`task_log_id`) REFERENCES `task_logs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `task_log_members` (`task_log_id`, `member_id`) SELECT `task_log_id`, `member_id` FROM `task_log_members_backfill`;
--> statement-breakpoint
DROP TABLE `task_log_members_backfill`;
