CREATE TABLE `watering_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_plant_id` integer NOT NULL,
	`watered_at` text NOT NULL,
	`source` text NOT NULL,
	`watered_by` text,
	FOREIGN KEY (`user_plant_id`) REFERENCES `user_plants`(`id`) ON UPDATE no action ON DELETE no action
);
