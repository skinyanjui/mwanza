import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email"),
  customerType: text("customer_type").notNull(),
  company: text("company"),
  service: text("service").notNull(),
  option: text("service_option").notNull(),
  address: text("address").notNull(),
  instructions: text("instructions"),
  scope: text("scope"),
  frequency: text("frequency").notNull().default("One time"),
  locations: integer("locations").notNull().default(1),
  scheduledDay: text("scheduled_day").notNull(),
  scheduledDate: text("scheduled_date"),
  scheduledTime: text("scheduled_time").notNull(),
  contactName: text("contact_name").notNull(),
  contact: text("contact").notNull(),
  payment: text("payment").notNull(),
  total: integer("total"),
  status: text("status").notNull().default("Confirmation pending"),
  assignedProviderId: text("assigned_provider_id"),
  assignedProviderEmail: text("assigned_provider_email"),
  assignedProviderName: text("assigned_provider_name"),
  acceptedAt: text("accepted_at"),
  enRouteAt: text("en_route_at"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  cancelledAt: text("cancelled_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("bookings_owner_email_idx").on(table.ownerEmail),
  index("bookings_status_created_idx").on(table.status, table.createdAt),
  index("bookings_provider_status_idx").on(table.assignedProviderEmail, table.status),
]);

export const businessRequests = sqliteTable("business_requests", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email"),
  businessName: text("business_name").notNull(),
  services: text("services").notNull(),
  frequency: text("frequency").notNull(),
  locationCount: integer("location_count").notNull(),
  contact: text("contact").notNull(),
  status: text("status").notNull().default("New lead"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("business_requests_created_idx").on(table.createdAt), index("business_requests_status_idx").on(table.status)]);

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email"),
  applicationType: text("application_type").notNull(),
  roleOrTerritory: text("role_or_territory").notNull(),
  fullName: text("full_name").notNull(),
  contact: text("contact").notNull(),
  location: text("location").notNull(),
  details: text("details").notNull(),
  services: text("services"),
  availability: text("availability"),
  status: text("status").notNull().default("Received"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("applications_type_status_idx").on(table.applicationType, table.status), index("applications_created_idx").on(table.createdAt)]);

export const providerProfiles = sqliteTable("provider_profiles", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull(),
  ownerEmail: text("owner_email"),
  fullName: text("full_name").notNull(),
  contact: text("contact").notNull(),
  location: text("location").notNull(),
  services: text("services").notNull(),
  availability: text("availability"),
  status: text("status").notNull().default("Active"),
  acceptingWork: integer("accepting_work").notNull().default(1),
  rating: integer("rating").notNull().default(500),
  completedJobs: integer("completed_jobs").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("provider_profiles_application_idx").on(table.applicationId),
  index("provider_profiles_owner_email_idx").on(table.ownerEmail),
  index("provider_profiles_status_idx").on(table.status),
]);

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  recipientEmail: text("recipient_email").notNull(),
  audience: text("audience").notNull(),
  bookingId: text("booking_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("Unread"),
  createdAt: text("created_at").notNull(),
  readAt: text("read_at"),
}, (table) => [
  index("notifications_recipient_created_idx").on(table.recipientEmail, table.createdAt),
  index("notifications_recipient_status_idx").on(table.recipientEmail, table.status),
]);

export const incidents = sqliteTable("incidents", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  reporterType: text("reporter_type").notNull(),
  bookingId: text("booking_id"),
  location: text("location"),
  category: text("category").notNull(),
  details: text("details").notNull(),
  priority: text("priority").notNull().default("Medium"),
  status: text("status").notNull().default("Open"),
  assignedTo: text("assigned_to"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("incidents_owner_created_idx").on(table.ownerEmail, table.createdAt),
  index("incidents_status_created_idx").on(table.status, table.createdAt),
]);

export const accountProfiles = sqliteTable("account_profiles", {
  email: text("email").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  accountType: text("account_type").notNull().default("Home"),
  businessName: text("business_name"),
  serviceArea: text("service_area").notNull().default("Nairobi"),
  status: text("status").notNull().default("Active"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("account_profiles_type_idx").on(table.accountType),
  index("account_profiles_status_idx").on(table.status),
]);
