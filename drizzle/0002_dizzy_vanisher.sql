CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`reporter_type` text NOT NULL,
	`booking_id` text,
	`location` text,
	`category` text NOT NULL,
	`details` text NOT NULL,
	`priority` text DEFAULT 'Medium' NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL,
	`assigned_to` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `incidents_owner_created_idx` ON `incidents` (`owner_email`,`created_at`);--> statement-breakpoint
CREATE INDEX `incidents_status_created_idx` ON `incidents` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_email` text NOT NULL,
	`audience` text NOT NULL,
	`booking_id` text,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'Unread' NOT NULL,
	`created_at` text NOT NULL,
	`read_at` text
);
--> statement-breakpoint
CREATE INDEX `notifications_recipient_created_idx` ON `notifications` (`recipient_email`,`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_status_idx` ON `notifications` (`recipient_email`,`status`);--> statement-breakpoint
CREATE TABLE `provider_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`owner_email` text,
	`full_name` text NOT NULL,
	`contact` text NOT NULL,
	`location` text NOT NULL,
	`services` text NOT NULL,
	`availability` text,
	`status` text DEFAULT 'Active' NOT NULL,
	`accepting_work` integer DEFAULT 1 NOT NULL,
	`rating` integer DEFAULT 500 NOT NULL,
	`completed_jobs` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `provider_profiles_application_idx` ON `provider_profiles` (`application_id`);--> statement-breakpoint
CREATE INDEX `provider_profiles_owner_email_idx` ON `provider_profiles` (`owner_email`);--> statement-breakpoint
CREATE INDEX `provider_profiles_status_idx` ON `provider_profiles` (`status`);--> statement-breakpoint
ALTER TABLE `bookings` ADD `assigned_provider_id` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `assigned_provider_email` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `assigned_provider_name` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `accepted_at` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `en_route_at` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `started_at` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `completed_at` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `cancelled_at` text;--> statement-breakpoint
CREATE INDEX `bookings_provider_status_idx` ON `bookings` (`assigned_provider_email`,`status`);