CREATE TABLE `reminder_messages` (
	`domain` text NOT NULL,
	`item_id` integer NOT NULL,
	`channel_id` text NOT NULL,
	`message_id` text NOT NULL,
	PRIMARY KEY(`domain`, `item_id`)
);
