ALTER TABLE `task_logs` ADD `discord_message_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `task_logs_discord_message_id_unique` ON `task_logs` (`discord_message_id`);