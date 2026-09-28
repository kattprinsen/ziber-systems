CREATE TABLE `__new_task_log_members` (
	`task_log_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	PRIMARY KEY(`task_log_id`, `member_id`),
	FOREIGN KEY (`task_log_id`) REFERENCES `task_logs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_task_log_members`("task_log_id", "member_id") SELECT "task_log_id", "member_id" FROM `task_log_members`;--> statement-breakpoint
DROP TABLE `task_log_members`;--> statement-breakpoint
ALTER TABLE `__new_task_log_members` RENAME TO `task_log_members`;--> statement-breakpoint