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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - using serial for PostgreSQL 9.2 compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
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

// Types for compatibility
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type SmtpServer = typeof smtpServers.$inferSelect;
export type ContactList = typeof contactLists.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;

// Insert schemas
export const insertSmtpServerSchema = createInsertSchema(smtpServers);
export const insertContactListSchema = createInsertSchema(contactLists);
export const insertContactSchema = createInsertSchema(contacts);
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);
export const insertCampaignSchema = createInsertSchema(campaigns);

export type InsertSmtpServer = z.infer<typeof insertSmtpServerSchema>;
export type InsertContactList = z.infer<typeof insertContactListSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;