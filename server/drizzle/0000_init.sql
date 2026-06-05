CREATE TABLE IF NOT EXISTS `health_checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`checked_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `plants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`common_name` text NOT NULL,
	`latin_name` text NOT NULL,
	`watering_interval_days` integer NOT NULL,
	`light` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_name_unique` ON `rooms` (`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_plants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`room_id` integer,
	`nickname` text,
	`added_at` text NOT NULL,
	`last_watered_at` text,
	`snoozed_until` text,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
