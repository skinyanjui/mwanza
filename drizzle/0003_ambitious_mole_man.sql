CREATE TABLE `account_profiles` (
	`email` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`account_type` text DEFAULT 'Home' NOT NULL,
	`business_name` text,
	`service_area` text DEFAULT 'Nairobi' NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `account_profiles_type_idx` ON `account_profiles` (`account_type`);--> statement-breakpoint
CREATE INDEX `account_profiles_status_idx` ON `account_profiles` (`status`);