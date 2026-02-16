import {
  users,
  smtpServers,
  contactLists,
  contacts,
  contactListMembers,
  emailTemplates,
  campaigns,
  suppressionList,
  domains,
  notifications,
  importJobs,
  type User,
  type UpsertUser,
  type SmtpServer,
  type InsertSmtpServer,
  type ContactList,
  type InsertContactList,
  type Contact,
  type ContactListMember,
  type InsertContact,
  type InsertContactListMember,
  type EmailTemplate,
  type InsertEmailTemplate,
  type Campaign,
  type InsertCampaign,
  type Suppression,
  type InsertSuppression,
  type Domain,
  type InsertDomain,
  type Notification,
  type InsertNotification,
  type ImportJob,
  type InsertImportJob,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  updateUserByEmail(email: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  getPendingUsers(): Promise<User[]>;

  // SMTP Server operations
  getSmtpServers(userId: number): Promise<SmtpServer[]>;
  getSmtpServer(id: number, userId: number): Promise<SmtpServer | undefined>;
  createSmtpServer(server: InsertSmtpServer): Promise<SmtpServer>;
  updateSmtpServer(id: number, server: Partial<InsertSmtpServer>, userId: number): Promise<SmtpServer | undefined>;
  deleteSmtpServer(id: number, userId: number): Promise<boolean>;

  // Contact List operations
  getContactLists(userId: number): Promise<ContactList[]>;
  getContactList(id: number, userId: number): Promise<ContactList | undefined>;
  createContactList(list: InsertContactList): Promise<ContactList>;
  updateContactList(id: number, list: Partial<InsertContactList>, userId: number): Promise<ContactList | undefined>;
  deleteContactList(id: number, userId: number): Promise<boolean>;

  // Contact operations
  getContacts(userId: number, limit?: number, offset?: number, listId?: number): Promise<{ contacts: Contact[], total: number }>;
  getContact(id: number, userId: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  createContactsBatch(contacts: InsertContact[]): Promise<{ ids: number[]; count: number }>;
  updateContact(id: number, contact: Partial<InsertContact>, userId: number): Promise<Contact | undefined>;
  deleteContact(id: number, userId: number): Promise<boolean>;
  addContactsToList(listId: number, contactIds: number[], userId: number): Promise<number>;
  removeContactsFromList(listId: number, contactIds: number[], userId: number): Promise<number>;

  // Email Template operations
  getEmailTemplates(userId: number): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number, userId: number): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>, userId: number): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number, userId: number): Promise<boolean>;

  // Campaign operations
  getCampaigns(userId: number, limit?: number, offset?: number): Promise<{ campaigns: Campaign[], total: number }>;
  getCampaign(id: number, userId: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>, userId: number): Promise<Campaign | undefined>;
  deleteCampaign(id: number, userId: number): Promise<boolean>;
  getCampaignStats(userId: number): Promise<{
    totalCampaigns: number;
    averageOpenRate: number;
    averageClickRate: number;
    totalContacts: number;
    recentCampaigns: Campaign[];
  }>;

  // Suppression operations
  getSuppressionList(userId: number): Promise<Suppression[]>;
  addToSuppression(suppression: InsertSuppression): Promise<Suppression>;
  removeFromSuppression(email: string, userId: number): Promise<boolean>;
  isEmailSuppressed(email: string, userId: number): Promise<boolean>;

  // Domain operations
  getDomains(userId: number): Promise<Domain[]>;
  getDomain(id: number, userId: number): Promise<Domain | undefined>;
  getDomainByName(domainName: string, userId: number): Promise<Domain | undefined>;
  createDomain(domain: InsertDomain): Promise<Domain>;
  updateDomain(id: number, domain: Partial<InsertDomain>, userId: number): Promise<Domain | undefined>;
  deleteDomain(id: number, userId: number): Promise<boolean>;

  // Notification operations
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;

  // Import job operations
  createImportJob(job: InsertImportJob): Promise<ImportJob>;
  updateImportJob(id: number, updates: Partial<InsertImportJob>): Promise<ImportJob | undefined>;
  getImportJob(id: number, userId: number): Promise<ImportJob | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserByEmail(email: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();
    return user;
  }

  async getPendingUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isApproved, false))
      .orderBy(desc(users.createdAt));
  }

  // SMTP Server operations
  async getSmtpServers(userId: number): Promise<SmtpServer[]> {
    return await db.select().from(smtpServers).where(eq(smtpServers.userId, userId)).orderBy(desc(smtpServers.createdAt));
  }

  async getSmtpServer(id: number, userId: number): Promise<SmtpServer | undefined> {
    const [server] = await db.select().from(smtpServers).where(and(eq(smtpServers.id, id), eq(smtpServers.userId, userId)));
    return server;
  }

  async createSmtpServer(server: InsertSmtpServer): Promise<SmtpServer> {
    const [newServer] = await db.insert(smtpServers).values(server).returning();
    return newServer;
  }

  async updateSmtpServer(id: number, server: Partial<InsertSmtpServer>, userId: number): Promise<SmtpServer | undefined> {
    const [updatedServer] = await db
      .update(smtpServers)
      .set({ ...server, updatedAt: new Date() })
      .where(and(eq(smtpServers.id, id), eq(smtpServers.userId, userId)))
      .returning();
    return updatedServer;
  }

  async deleteSmtpServer(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(smtpServers).where(and(eq(smtpServers.id, id), eq(smtpServers.userId, userId)));
    return result.rowCount > 0;
  }

  // Contact List operations
  async getContactLists(userId: number): Promise<ContactList[]> {
    return await db.select().from(contactLists).where(eq(contactLists.userId, userId)).orderBy(desc(contactLists.createdAt));
  }

  async getContactList(id: number, userId: number): Promise<ContactList | undefined> {
    const [list] = await db.select().from(contactLists).where(and(eq(contactLists.id, id), eq(contactLists.userId, userId)));
    return list;
  }

  async createContactList(list: InsertContactList): Promise<ContactList> {
    const [newList] = await db.insert(contactLists).values(list).returning();
    return newList;
  }

  async updateContactList(id: number, list: Partial<InsertContactList>, userId: number): Promise<ContactList | undefined> {
    const [updatedList] = await db
      .update(contactLists)
      .set({ ...list, updatedAt: new Date() })
      .where(and(eq(contactLists.id, id), eq(contactLists.userId, userId)))
      .returning();
    return updatedList;
  }

  async deleteContactList(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(contactLists).where(and(eq(contactLists.id, id), eq(contactLists.userId, userId)));
    return result.rowCount > 0;
  }

  // Contact operations
  async getContacts(userId: number, limit = 50, offset = 0, listId?: number): Promise<{ contacts: Contact[], total: number }> {
    if (listId) {
      const joined = await db
        .select()
        .from(contacts)
        .innerJoin(contactListMembers, eq(contactListMembers.contactId, contacts.id))
        .where(and(eq(contacts.userId, userId), eq(contactListMembers.listId, listId)))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(contacts.createdAt));

      const [totalResult] = await db
        .select({ count: count() })
        .from(contacts)
        .innerJoin(contactListMembers, eq(contactListMembers.contactId, contacts.id))
        .where(and(eq(contacts.userId, userId), eq(contactListMembers.listId, listId)));

      return {
        contacts: joined.map((row) => row.contacts),
        total: totalResult.count,
      };
    }

    const contactsList = await db.select().from(contacts)
      .where(eq(contacts.userId, userId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(contacts.createdAt));

    const [totalResult] = await db.select({ count: count() }).from(contacts).where(eq(contacts.userId, userId));

    return {
      contacts: contactsList,
      total: totalResult.count,
    };
  }

  async getContact(id: number, userId: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async createContactsBatch(batch: InsertContact[]): Promise<{ ids: number[]; count: number }> {
    if (!batch.length) {
      return { ids: [], count: 0 };
    }
    const inserted = await db.insert(contacts).values(batch).returning({ id: contacts.id });
    return { ids: inserted.map((row) => row.id), count: inserted.length };
  }

  async updateContact(id: number, contact: Partial<InsertContact>, userId: number): Promise<Contact | undefined> {
    const [updatedContact] = await db
      .update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return result.rowCount > 0;
  }

  async addContactsToList(listId: number, contactIds: number[], userId: number): Promise<number> {
    if (!contactIds.length) return 0;

    const [list] = await db.select().from(contactLists)
      .where(and(eq(contactLists.id, listId), eq(contactLists.userId, userId)));
    if (!list) return 0;

    const validContacts = await db.select({ id: contacts.id }).from(contacts)
      .where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)));

    const values: InsertContactListMember[] = validContacts.map((row) => ({
      listId,
      contactId: row.id,
      userId,
    }));

    if (!values.length) return 0;

    const result = await db.insert(contactListMembers)
      .values(values)
      .onConflictDoNothing()
      .returning();

    return result.length;
  }

  async removeContactsFromList(listId: number, contactIds: number[], userId: number): Promise<number> {
    if (!contactIds.length) return 0;

    const result = await db
      .delete(contactListMembers)
      .where(
        and(
          eq(contactListMembers.listId, listId),
          eq(contactListMembers.userId, userId),
          inArray(contactListMembers.contactId, contactIds),
        ),
      );
    return result.rowCount || 0;
  }

  // Email Template operations
  async getEmailTemplates(userId: number): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId)).orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: number, userId: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>, userId: number): Promise<EmailTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)))
      .returning();
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(emailTemplates).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
    return result.rowCount > 0;
  }

  // Campaign operations
  async getCampaigns(userId: number, limit = 50, offset = 0): Promise<{ campaigns: Campaign[], total: number }> {
    const campaignsList = await db.select().from(campaigns)
      .where(eq(campaigns.userId, userId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(campaigns.createdAt));
    
    const [totalResult] = await db.select({ count: count() }).from(campaigns).where(eq(campaigns.userId, userId));
    
    return {
      campaigns: campaignsList,
      total: totalResult.count,
    };
  }

  async getCampaign(id: number, userId: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateCampaign(id: number, campaign: Partial<InsertCampaign>, userId: number): Promise<Campaign | undefined> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ ...campaign, updatedAt: new Date() })
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)))
      .returning();
    return updatedCampaign;
  }

  async deleteCampaign(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return result.rowCount > 0;
  }

  async getCampaignStats(userId: number): Promise<{
    totalCampaigns: number;
    averageOpenRate: number;
    averageClickRate: number;
    totalContacts: number;
    recentCampaigns: Campaign[];
  }> {
    // Total campaigns
    const [totalCampaignsResult] = await db.select({ count: count() }).from(campaigns).where(eq(campaigns.userId, userId));
    
    // Total contacts
    const [totalContactsResult] = await db.select({ count: count() }).from(contacts).where(eq(contacts.userId, userId));
    
    const [aggregate] = await db
      .select({
        sentCount: sql<number>`COALESCE(SUM(${campaigns.sentCount}), 0)`,
        openCount: sql<number>`COALESCE(SUM(${campaigns.openCount}), 0)`,
        clickCount: sql<number>`COALESCE(SUM(${campaigns.clickCount}), 0)`,
      })
      .from(campaigns)
      .where(and(eq(campaigns.userId, userId), eq(campaigns.status, "sent")));

    const sentCount = Number(aggregate?.sentCount || 0);
    const openCount = Number(aggregate?.openCount || 0);
    const clickCount = Number(aggregate?.clickCount || 0);
    const averageOpenRate = sentCount > 0
      ? Math.round((openCount / sentCount) * 1000) / 10
      : 0;
    const averageClickRate = sentCount > 0
      ? Math.round((clickCount / sentCount) * 1000) / 10
      : 0;

    // Recent campaigns
    const recentCampaigns = await db.select().from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt))
      .limit(5);

    return {
      totalCampaigns: totalCampaignsResult.count,
      averageOpenRate,
      averageClickRate,
      totalContacts: totalContactsResult.count,
      recentCampaigns,
    };
  }

  // Suppression operations
  async getSuppressionList(userId: number): Promise<Suppression[]> {
    return await db.select().from(suppressionList).where(eq(suppressionList.userId, userId)).orderBy(desc(suppressionList.createdAt));
  }

  async addToSuppression(suppression: InsertSuppression): Promise<Suppression> {
    const [newSuppression] = await db.insert(suppressionList).values(suppression).returning();
    return newSuppression;
  }

  async removeFromSuppression(email: string, userId: number): Promise<boolean> {
    const result = await db.delete(suppressionList).where(and(eq(suppressionList.email, email), eq(suppressionList.userId, userId)));
    return result.rowCount > 0;
  }

  async isEmailSuppressed(email: string, userId: number): Promise<boolean> {
    const [suppressed] = await db.select().from(suppressionList).where(and(eq(suppressionList.email, email), eq(suppressionList.userId, userId)));
    return !!suppressed;
  }

  // Domain operations
  async getDomains(userId: number): Promise<Domain[]> {
    return await db.select().from(domains).where(eq(domains.userId, userId)).orderBy(desc(domains.createdAt));
  }

  async getDomain(id: number, userId: number): Promise<Domain | undefined> {
    const [domain] = await db.select().from(domains).where(and(eq(domains.id, id), eq(domains.userId, userId)));
    return domain;
  }

  async getDomainByName(domainName: string, userId: number): Promise<Domain | undefined> {
    const [domain] = await db.select().from(domains)
      .where(and(eq(domains.domain, domainName), eq(domains.userId, userId)));
    return domain;
  }

  async createDomain(domainData: InsertDomain): Promise<Domain> {
    const [newDomain] = await db.insert(domains).values(domainData).returning();
    return newDomain;
  }

  async updateDomain(id: number, domainData: Partial<InsertDomain>, userId: number): Promise<Domain | undefined> {
    const [updated] = await db
      .update(domains)
      .set({
        ...domainData,
        updatedAt: new Date(),
      })
      .where(and(eq(domains.id, id), eq(domains.userId, userId)))
      .returning();
    return updated;
  }

  async deleteDomain(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(domains).where(and(eq(domains.id, id), eq(domains.userId, userId)));
    return result.rowCount > 0;
  }

  // Notification operations
  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), sql`${notifications.readAt} IS NULL`));
    return result.count;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [record] = await db.insert(notifications).values(notification).returning();
    return record;
  }

  // Import job operations
  async createImportJob(job: InsertImportJob): Promise<ImportJob> {
    const [record] = await db.insert(importJobs).values(job).returning();
    return record;
  }

  async updateImportJob(id: number, updates: Partial<InsertImportJob>): Promise<ImportJob | undefined> {
    const [record] = await db
      .update(importJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(importJobs.id, id))
      .returning();
    return record;
  }

  async getImportJob(id: number, userId: number): Promise<ImportJob | undefined> {
    const [record] = await db
      .select()
      .from(importJobs)
      .where(and(eq(importJobs.id, id), eq(importJobs.userId, userId)));
    return record;
  }
}

export const storage = new DatabaseStorage();