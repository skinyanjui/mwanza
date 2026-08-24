CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text,
	`application_type` text NOT NULL,
	`role_or_territory` text NOT NULL,
	`full_name` text NOT NULL,
	`contact` text NOT NULL,
	`location` text NOT NULL,
	`details` text NOT NULL,
	`services` text,
	`availability` text,
	`status` text DEFAULT 'Received' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text,
	`customer_type` text NOT NULL,
	`company` text,
	`service` text NOT NULL,
	`service_option` text NOT NULL,
	`address` text NOT NULL,
	`instructions` text,
	`scope` text,
	`frequency` text DEFAULT 'One time' NOT NULL,
	`locations` integer DEFAULT 1 NOT NULL,
	`scheduled_day` text NOT NULL,
	`scheduled_date` text,
	`scheduled_time` text NOT NULL,
	`contact_name` text NOT NULL,
	`contact` text NOT NULL,
	`payment` text NOT NULL,
	`total` integer,
	`status` text DEFAULT 'Confirmation pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `business_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text,
	`business_name` text NOT NULL,
	`services` text NOT NULL,
	`frequency` text NOT NULL,
	`location_count` integer NOT NULL,
	`contact` text NOT NULL,
	`status` text DEFAULT 'New lead' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
