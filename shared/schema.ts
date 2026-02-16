import { sql } from 'drizzle-orm';
import {
  index,
  json,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  serial,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - using serial for PostgreSQL compatibility  
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash", { length: 255 }),
  passwordSalt: varchar("password_salt", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled']);
export const contactStatusEnum = pgEnum('contact_status', ['active', 'unsubscribed', 'bounced', 'complained']);
export const serverStatusEnum = pgEnum('server_status', ['active', 'inactive', 'error']);

// SMTP Servers
export const smtpServers = pgTable("smtp_servers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  host: varchar("host", { length: 255 }).notNull(),
  port: integer("port").notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  encryption: varchar("encryption", { length: 10 }),
  maxEmailsPerHour: integer("max_emails_per_hour").default(100),
  status: serverStatusEnum("status").default('active'),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contact Lists
export const contactLists = pgTable("contact_lists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contacts
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  status: contactStatusEnum("status").default('active'),
  subscriptionDate: timestamp("subscription_date").defaultNow(),
  lastEngagementDate: timestamp("last_engagement_date"),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contact List Memberships
export const contactListMembers = pgTable(
  "contact_list_members",
  {
    listId: integer("list_id").notNull().references(() => contactLists.id, { onDelete: 'cascade' }),
    contactId: integer("contact_id").notNull().references(() => contacts.id, { onDelete: 'cascade' }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.listId, table.contactId] }),
    index("IDX_contact_list_members_user").on(table.userId),
  ],
);

// Email Templates
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  isDefault: boolean("is_default").default(false),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  fromName: varchar("from_name", { length: 255 }).notNull(),
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  status: campaignStatusEnum("status").default('draft'),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").default(0),
  sentCount: integer("sent_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  bounceCount: integer("bounce_count").default(0),
  unsubscribeCount: integer("unsubscribe_count").default(0),
  templateId: integer("template_id").references(() => emailTemplates.id),
  smtpServerId: integer("smtp_server_id").references(() => smtpServers.id),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppression table
export const suppressionList = pgTable("suppression_list", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  reason: varchar("reason", { length: 100 }).notNull(),
  source: varchar("source", { length: 100 }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contact import jobs
export const importJobs = pgTable("import_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  listId: integer("list_id").references(() => contactLists.id, { onDelete: 'set null' }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").default(0),
  bytesProcessed: integer("bytes_processed").default(0),
  status: varchar("status", { length: 30 }).default("pending"),
  processed: integer("processed").default(0),
  successful: integer("successful").default(0),
  failed: integer("failed").default(0),
  errorSample: text("error_sample"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Domains table
export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  verified: boolean("verified").default(false),
  spfRecord: varchar("spf_record", { length: 500 }),
  spfValid: boolean("spf_valid").default(false),
  dkimRecord: varchar("dkim_record", { length: 500 }),
  dkimValid: boolean("dkim_valid").default(false),
  dmarcRecord: varchar("dmarc_record", { length: 500 }),
  dmarcValid: boolean("dmarc_valid").default(false),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastChecked: timestamp("last_checked"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Basic Types without zod dependencies
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type SmtpServer = typeof smtpServers.$inferSelect;
export type ContactList = typeof contactLists.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type ContactListMember = typeof contactListMembers.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Suppression = typeof suppressionList.$inferSelect;
export type Domain = typeof domains.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ImportJob = typeof importJobs.$inferSelect;

export type InsertSmtpServer = typeof smtpServers.$inferInsert;
export type InsertContactList = typeof contactLists.$inferInsert;
export type InsertContact = typeof contacts.$inferInsert;
export type InsertContactListMember = typeof contactListMembers.$inferInsert;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export type InsertCampaign = typeof campaigns.$inferInsert;
export type InsertSuppression = typeof suppressionList.$inferInsert;
export type InsertDomain = typeof domains.$inferInsert;
export type InsertNotification = typeof notifications.$inferInsert;
export type InsertImportJob = typeof importJobs.$inferInsert;

// Simplified schemas for forms (mock objects that work with the frontend)
export const insertSmtpServerSchema = {
  parse: (data: any) => data,
};

export const insertContactListSchema = {
  parse: (data: any) => data,
};

export const insertContactSchema = {
  parse: (data: any) => data,
};

export const insertEmailTemplateSchema = {
  parse: (data: any) => data,
};

export const insertCampaignSchema = {
  parse: (data: any) => data,
};

export const insertSuppressionSchema = {
  parse: (data: any) => data,
};