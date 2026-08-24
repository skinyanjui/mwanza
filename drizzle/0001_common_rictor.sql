CREATE INDEX `applications_type_status_idx` ON `applications` (`application_type`,`status`);--> statement-breakpoint
CREATE INDEX `applications_created_idx` ON `applications` (`created_at`);--> statement-breakpoint
CREATE INDEX `bookings_owner_email_idx` ON `bookings` (`owner_email`);--> statement-breakpoint
CREATE INDEX `bookings_status_created_idx` ON `bookings` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `business_requests_created_idx` ON `business_requests` (`created_at`);--> statement-breakpoint
CREATE INDEX `business_requests_status_idx` ON `business_requests` (`status`);