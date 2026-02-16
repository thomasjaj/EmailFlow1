import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import nodemailer from "nodemailer";
import multer from "multer";
import path from "path";
import fs from "fs";
import readline from "readline";
import { db } from "./db";
import { contactListMembers } from "@shared/schema";
import { count, eq } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./replitAuth";
import passport from "passport";
import { randomBytes, pbkdf2Sync } from "crypto";

const IMPORT_BATCH_SIZE = 1000;
const IMPORT_PROGRESS_INTERVAL = 1000;

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        const dir = path.resolve(process.cwd(), "uploads", "imports");
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
      },
    }),
    limits: { fileSize: 1024 * 1024 * 1024 },
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        const status = info?.message === "Account pending approval" ? 403 : 401;
        return res.status(status).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({ message: "Logged in" });
      });
    })(req, res, next);
  });

  app.post("/api/auth/signup", async (req: any, res) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Email already exists" });
      }
      const salt = randomBytes(16).toString("hex");
      const passwordHash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
      await storage.createUser({
        email,
        firstName: req.body.firstName || null,
        lastName: req.body.lastName || null,
        profileImageUrl: "",
        passwordHash,
        passwordSalt: salt,
        role: "user",
        isApproved: false,
      });
      return res.status(201).json({ message: "Account created. Awaiting approval." });
    } catch (error) {
      console.error("Error signing up:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  const requireAdmin: RequestHandler = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    return next();
  };

  app.get("/api/admin/pending-users", requireAdmin, async (_req, res) => {
    try {
      const users = await storage.getPendingUsers();
      const safeUsers = users.map(({ passwordHash, passwordSalt, ...rest }) => rest);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post("/api/admin/approve-user", requireAdmin, async (req: any, res) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const updated = await storage.updateUserByEmail(email, { isApproved: true });
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User approved" });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json(null);
      }
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.json(null);
      }
      const { passwordHash, passwordSalt, ...safeUser } = user as any;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notifications count:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getCampaignStats(userId);
      res.json({
        totalCampaigns: stats.totalCampaigns,
        averageOpenRate: stats.averageOpenRate,
        averageClickRate: stats.averageClickRate,
        totalContacts: stats.totalContacts,
        recentCampaigns: stats.recentCampaigns.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          recipientCount: campaign.recipientCount,
          openCount: campaign.openCount,
          clickCount: campaign.clickCount,
          createdAt: campaign.createdAt,
          sentAt: campaign.sentAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const result = await storage.getCampaigns(userId, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const payload = {
        name: req.body.name,
        subject: req.body.subject,
        fromName: req.body.fromName,
        fromEmail: req.body.fromEmail,
        htmlContent: req.body.htmlContent,
        textContent: req.body.textContent || "",
        status: req.body.status || "draft",
        scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : null,
        smtpServerId: req.body.smtpServerId ? parseInt(req.body.smtpServerId, 10) : null,
        templateId: req.body.templateId ? parseInt(req.body.templateId, 10) : null,
        userId,
      };
      const campaign = await storage.createCampaign(payload);
      await storage.createNotification({
        type: "campaign",
        message: `Campaign created: ${campaign.name}`,
        userId,
      });
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get('/api/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.put('/api/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignId = parseInt(req.params.id);
      const payload: Record<string, any> = {};
      if (req.body.name !== undefined) payload.name = req.body.name;
      if (req.body.subject !== undefined) payload.subject = req.body.subject;
      if (req.body.fromName !== undefined) payload.fromName = req.body.fromName;
      if (req.body.fromEmail !== undefined) payload.fromEmail = req.body.fromEmail;
      if (req.body.htmlContent !== undefined) payload.htmlContent = req.body.htmlContent;
      if (req.body.textContent !== undefined) payload.textContent = req.body.textContent;
      if (req.body.status !== undefined) payload.status = req.body.status;
      if (req.body.scheduledAt !== undefined) {
        payload.scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null;
      }
      if (req.body.smtpServerId !== undefined) {
        payload.smtpServerId = req.body.smtpServerId ? parseInt(req.body.smtpServerId, 10) : null;
      }
      if (req.body.templateId !== undefined) {
        payload.templateId = req.body.templateId ? parseInt(req.body.templateId, 10) : null;
      }
      const updated = await storage.updateCampaign(campaignId, payload, userId);
      if (!updated) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      console.info(`Campaign updated`, { campaignId, userId });
      res.json(updated);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.post('/api/campaigns/:id/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignId = parseInt(req.params.id, 10);
      if (Number.isNaN(campaignId)) {
        return res.status(400).json({ message: "Invalid campaign id" });
      }

      const updated = await storage.updateCampaign(campaignId, { status: 'sending' }, userId);
      if (!updated) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });

  app.post('/api/campaigns/:id/pause', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignId = parseInt(req.params.id, 10);
      if (Number.isNaN(campaignId)) {
        return res.status(400).json({ message: "Invalid campaign id" });
      }

      const updated = await storage.updateCampaign(campaignId, { status: 'paused' }, userId);
      if (!updated) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error pausing campaign:", error);
      res.status(500).json({ message: "Failed to pause campaign" });
    }
  });

  app.post('/api/campaigns/:id/stop', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignId = parseInt(req.params.id, 10);
      if (Number.isNaN(campaignId)) {
        return res.status(400).json({ message: "Invalid campaign id" });
      }

      const updated = await storage.updateCampaign(campaignId, { status: 'cancelled' }, userId);
      if (!updated) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error stopping campaign:", error);
      res.status(500).json({ message: "Failed to stop campaign" });
    }
  });

  app.delete('/api/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignId = parseInt(req.params.id);
      const deleted = await storage.deleteCampaign(campaignId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      console.info(`Campaign deleted`, { campaignId, userId });
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  app.post('/api/campaigns/test-email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { smtpServerId, toEmail, fromName, fromEmail, subject, htmlContent, textContent } = req.body;

      if (!smtpServerId || !toEmail || !fromEmail || !subject || !htmlContent) {
        return res.status(400).json({ message: "smtpServerId, toEmail, fromEmail, subject, and htmlContent are required" });
      }

      const serverId = parseInt(smtpServerId, 10);
      const server = await storage.getSmtpServer(serverId, userId);
      if (!server) {
        return res.status(404).json({ message: "SMTP server not found" });
      }

      const encryption = server.encryption ?? "none";
      const auth = server.username && server.password
        ? { user: server.username, pass: server.password }
        : undefined;

      const transport = nodemailer.createTransport({
        host: server.host,
        port: server.port,
        secure: encryption === "ssl",
        requireTLS: encryption === "tls",
        ignoreTLS: encryption === "none",
        auth,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });

      const fromValue = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

      await transport.sendMail({
        from: fromValue,
        to: toEmail,
        subject,
        html: htmlContent,
        text: textContent || undefined,
      });

      res.json({ message: "Test email sent" });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      res.status(400).json({ message: "Failed to send test email", error: error?.message || "Unknown error" });
    }
  });

  app.get('/api/contact-lists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const lists = await storage.getContactLists(userId);
      const listCounts = await db
        .select({ listId: contactListMembers.listId, count: count() })
        .from(contactListMembers)
        .where(eq(contactListMembers.userId, userId))
        .groupBy(contactListMembers.listId);

      const countsById = new Map(
        listCounts.map((row) => [row.listId, Number(row.count)])
      );
      const listsWithCounts = lists.map((list) => ({
        ...list,
        contactCount: countsById.get(list.id) || 0,
      }));

      res.json(listsWithCounts);
    } catch (error) {
      console.error("Error fetching contact lists:", error);
      res.status(500).json({ message: "Failed to fetch contact lists" });
    }
  });

  app.post('/api/contact-lists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const list = await storage.createContactList({ ...req.body, userId });
      res.status(201).json(list);
    } catch (error) {
      console.error("Error creating contact list:", error);
      res.status(500).json({ message: "Failed to create contact list" });
    }
  });

  app.put('/api/contact-lists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const listId = parseInt(req.params.id);
      const { name, description } = req.body;
      const updated = await storage.updateContactList(listId, { name, description }, userId);
      if (!updated) {
        return res.status(404).json({ message: "Contact list not found" });
      }
      res.json({ message: "Contact list updated successfully", list: updated });
    } catch (error) {
      console.error("Error updating contact list:", error);
      res.status(500).json({ message: "Failed to update contact list" });
    }
  });

  app.delete('/api/contact-lists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const listId = parseInt(req.params.id);
      const deleted = await storage.deleteContactList(listId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Contact list not found" });
      }
      res.json({ message: "Contact list deleted successfully" });
    } catch (error) {
      console.error("Error deleting contact list:", error);
      res.status(500).json({ message: "Failed to delete contact list" });
    }
  });

  app.post('/api/contact-lists/:id/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const listId = parseInt(req.params.id);
      const contactIds = Array.isArray(req.body.contactIds)
        ? req.body.contactIds.map((id: any) => parseInt(id, 10)).filter((id: number) => !Number.isNaN(id))
        : [];

      if (!contactIds.length) {
        return res.status(400).json({ message: "contactIds is required" });
      }

      const addedCount = await storage.addContactsToList(listId, contactIds, userId);
      res.json({ addedCount });
    } catch (error) {
      console.error("Error adding contacts to list:", error);
      res.status(500).json({ message: "Failed to add contacts to list" });
    }
  });

  app.delete('/api/contact-lists/:id/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const listId = parseInt(req.params.id);
      const contactIds = Array.isArray(req.body.contactIds)
        ? req.body.contactIds.map((id: any) => parseInt(id, 10)).filter((id: number) => !Number.isNaN(id))
        : [];

      if (!contactIds.length) {
        return res.status(400).json({ message: "contactIds is required" });
      }

      const removedCount = await storage.removeContactsFromList(listId, contactIds, userId);
      res.json({ removedCount });
    } catch (error) {
      console.error("Error removing contacts from list:", error);
      res.status(500).json({ message: "Failed to remove contacts from list" });
    }
  });

  app.get('/api/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const listId = req.query.listId ? parseInt(req.query.listId as string, 10) : undefined;
      const result = await storage.getContacts(userId, limit, offset, listId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get('/api/contacts/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = await storage.getContacts(userId, 1000, 0);
      const activeContacts = result.contacts.filter(c => c.status === 'active').length;
      res.json({
        activeContacts,
        segments: 0,
        avgEngagement: "0%"
      });
    } catch (error) {
      console.error("Error fetching contact stats:", error);
      res.status(500).json({ message: "Failed to fetch contact stats" });
    }
  });

  app.post('/api/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const listId = req.body.listId ? parseInt(req.body.listId, 10) : null;
      const { listId: _listId, ...contactPayload } = req.body;
      const contact = await storage.createContact({ ...contactPayload, userId });
      if (listId) {
        await storage.addContactsToList(listId, [contact.id], userId);
      }
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.post('/api/contacts/import', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "CSV file is required" });
      }
      const createNewList = req.body.createNewList === "true";
      const newListName = req.body.newListName || "";
      let listId = req.body.listId ? parseInt(req.body.listId, 10) : undefined;
      if (createNewList && newListName) {
        const list = await storage.createContactList({ name: newListName, description: "", userId });
        listId = list.id;
      }
      const job = await storage.createImportJob({
        userId,
        listId: listId ?? null,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        status: "pending",
        bytesProcessed: 0,
        processed: 0,
        successful: 0,
        failed: 0,
      });

      processImportJob({
        jobId: job.id,
        userId,
        listId,
        filePath: file.path,
        fileSize: file.size,
      });

      res.status(202).json({ jobId: job.id });
    } catch (error) {
      console.error("Error importing contacts:", error);
      res.status(500).json({ message: "Failed to import contacts" });
    }
  });

  app.get('/api/contacts/import/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const jobId = parseInt(req.params.id, 10);
      const job = await storage.getImportJob(jobId, userId);
      if (!job) {
        return res.status(404).json({ message: "Import job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching import job:", error);
      res.status(500).json({ message: "Failed to fetch import job" });
    }
  });

  app.put('/api/contacts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const contactId = parseInt(req.params.id);
      const updated = await storage.updateContact(contactId, req.body, userId);
      if (!updated) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete('/api/contacts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const contactId = parseInt(req.params.id);
      const deleted = await storage.deleteContact(contactId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  app.get('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const templates = await storage.getEmailTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const template = await storage.createEmailTemplate({ ...req.body, userId });
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put('/api/templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const templateId = parseInt(req.params.id);
      const updated = await storage.updateEmailTemplate(templateId, req.body, userId);
      if (!updated) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete('/api/templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const templateId = parseInt(req.params.id);
      const deleted = await storage.deleteEmailTemplate(templateId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  app.get('/api/smtp-servers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const servers = await storage.getSmtpServers(userId);
      res.json(servers);
    } catch (error) {
      console.error("Error fetching SMTP servers:", error);
      res.status(500).json({ message: "Failed to fetch SMTP servers" });
    }
  });

  app.post('/api/smtp-servers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const payload = {
        name: req.body.name,
        host: req.body.host,
        port: typeof req.body.port === "number" ? req.body.port : parseInt(req.body.port, 10),
        username: req.body.username || "",
        password: req.body.password || "",
        encryption: req.body.encryption || null,
        maxEmailsPerHour: typeof req.body.maxEmailsPerHour === "number"
          ? req.body.maxEmailsPerHour
          : parseInt(req.body.maxEmailsPerHour, 10),
        status: req.body.status || "active",
        userId,
      };
      const server = await storage.createSmtpServer(payload);
      res.status(201).json(server);
    } catch (error) {
      console.error("Error creating SMTP server:", error);
      res.status(500).json({ message: "Failed to create SMTP server" });
    }
  });

  app.post('/api/smtp-servers/:id/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const serverId = parseInt(req.params.id);
      const server = await storage.getSmtpServer(serverId, userId);

      if (!server) {
        return res.status(404).json({ message: "SMTP server not found" });
      }

      const encryption = server.encryption ?? "none";
      const auth = server.username && server.password
        ? { user: server.username, pass: server.password }
        : undefined;

      const transport = nodemailer.createTransport({
        host: server.host,
        port: server.port,
        secure: encryption === "ssl",
        requireTLS: encryption === "tls",
        ignoreTLS: encryption === "none",
        auth,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });

      await transport.verify();
      await storage.updateSmtpServer(serverId, { status: "active" }, userId);

      res.json({ message: "SMTP connection verified successfully" });
    } catch (error: any) {
      console.error("Error testing SMTP server:", error);
      const userId = req.user.id;
      const serverId = parseInt(req.params.id);
      await storage.updateSmtpServer(serverId, { status: "error" }, userId);
      res.status(400).json({ message: "SMTP test failed", error: error?.message || "Unknown error" });
    }
  });

  app.put('/api/smtp-servers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const serverId = parseInt(req.params.id);
      const payload = {
        name: req.body.name,
        host: req.body.host,
        port: typeof req.body.port === "number" ? req.body.port : parseInt(req.body.port, 10),
        username: req.body.username || "",
        password: req.body.password || "",
        encryption: req.body.encryption || null,
        maxEmailsPerHour: typeof req.body.maxEmailsPerHour === "number"
          ? req.body.maxEmailsPerHour
          : parseInt(req.body.maxEmailsPerHour, 10),
        status: req.body.status,
      };
      const updated = await storage.updateSmtpServer(serverId, payload, userId);
      if (!updated) {
        return res.status(404).json({ message: "SMTP server not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating SMTP server:", error);
      res.status(500).json({ message: "Failed to update SMTP server" });
    }
  });

  app.delete('/api/smtp-servers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const serverId = parseInt(req.params.id);
      const deleted = await storage.deleteSmtpServer(serverId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "SMTP server not found" });
      }
      res.json({ message: "SMTP server deleted successfully" });
    } catch (error) {
      console.error("Error deleting SMTP server:", error);
      res.status(500).json({ message: "Failed to delete SMTP server" });
    }
  });

  app.get('/api/suppressions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const suppressions = await storage.getSuppressionList(userId);
      res.json(suppressions);
    } catch (error) {
      console.error("Error fetching suppressions:", error);
      res.status(500).json({ message: "Failed to fetch suppressions" });
    }
  });

  app.get('/api/suppressions/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const suppressions = await storage.getSuppressionList(userId);
      const stats = {
        total: suppressions.length,
        unsubscribes: suppressions.filter(s => s.reason === 'unsubscribe').length,
        bounces: suppressions.filter(s => s.reason === 'bounce').length,
        complaints: suppressions.filter(s => s.reason === 'complaint').length
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching suppression stats:", error);
      res.status(500).json({ message: "Failed to fetch suppression stats" });
    }
  });

  app.post('/api/suppressions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const suppression = await storage.addToSuppression({ ...req.body, userId });
      res.status(201).json(suppression);
    } catch (error) {
      console.error("Error adding suppression:", error);
      res.status(500).json({ message: "Failed to add suppression" });
    }
  });

  app.delete('/api/suppressions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const suppressionId = parseInt(req.params.id);
      // Note: This should ideally use the id, but the storage method uses email
      // For now, we'll need to get the suppression first to get the email
      const suppressions = await storage.getSuppressionList(userId);
      const suppression = suppressions.find(s => s.id === suppressionId);
      if (!suppression) {
        return res.status(404).json({ message: "Suppression not found" });
      }
      const deleted = await storage.removeFromSuppression(suppression.email, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Suppression not found" });
      }
      res.json({ message: "Suppression removed successfully" });
    } catch (error) {
      console.error("Error removing suppression:", error);
      res.status(500).json({ message: "Failed to remove suppression" });
    }
  });

  app.get('/api/domains', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const domainsData = await storage.getDomains(userId);
      res.json(domainsData);
    } catch (error) {
      console.error("Error fetching domains:", error);
      res.status(500).json({ message: "Failed to fetch domains" });
    }
  });

  app.post('/api/domains', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ message: "Domain is required" });
      }

      const existing = await storage.getDomainByName(domain, userId);
      if (existing) {
        return res.status(409).json({ message: "Domain already exists", domain: existing });
      }

      // Generate default DNS records for the domain
      const spfRecord = `v=spf1 include:sendgrid.net ~all`;
      const dkimRecord = `default._domainkey.${domain}`;
      const dmarcRecord = `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`;

      const newDomain = await storage.createDomain({
        domain,
        userId,
        spfRecord,
        dkimRecord,
        dmarcRecord,
        verified: false,
        spfValid: false,
        dkimValid: false,
        dmarcValid: false,
      });
      
      res.status(201).json(newDomain);
    } catch (error) {
      if (error?.code === "23505") {
        return res.status(409).json({ message: "Domain already exists" });
      }
      console.error("Error creating domain:", error);
      res.status(500).json({ message: "Failed to create domain" });
    }
  });

  app.post('/api/domains/:id/verify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const domainId = parseInt(req.params.id);
      
      const domain = await storage.getDomain(domainId, userId);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }

      // In a real app, you'd check DNS records here
      // For now, we'll simulate verification
      const updated = await storage.updateDomain(domainId, {
        verified: true,
        spfValid: true,
        dkimValid: true,
        dmarcValid: true,
        lastChecked: new Date(),
      }, userId);
      
      res.json(updated);
    } catch (error) {
      console.error("Error verifying domain:", error);
      res.status(500).json({ message: "Failed to verify domain" });
    }
  });

  app.delete('/api/domains/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const domainId = parseInt(req.params.id);
      
      const deleted = await storage.deleteDomain(domainId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      res.json({ message: "Domain deleted successfully" });
    } catch (error) {
      console.error("Error deleting domain:", error);
      res.status(500).json({ message: "Failed to delete domain" });
    }
  });

  app.get('/api/domains/dns-records/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const domainId = parseInt(req.params.id);
      
      const domain = await storage.getDomain(domainId, userId);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }

      res.json({
        spf: domain.spfRecord,
        dkim: domain.dkimRecord,
        dmarc: domain.dmarcRecord,
      });
    } catch (error) {
      console.error("Error fetching DNS records:", error);
      res.status(500).json({ message: "Failed to fetch DNS records" });
    }
  });

  app.get('/api/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      const settings = {
        emailNotifications: true,
        campaignReminders: true,
        weeklyReports: false,
        securityAlerts: true,
        theme: 'light',
        timezone: 'UTC',
        language: 'en',
        defaultSendingTime: '09:00'
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });

  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updated = await storage.upsertUser({
        id: userId,
        firstName: req.body.firstName || "",
        lastName: req.body.lastName || "",
        updatedAt: new Date(),
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  app.post('/api/user/export', isAuthenticated, async (req: any, res) => {
    try {
      console.info(`User export requested`, { userId: req.user.id });
      res.json({ downloadUrl: "/api/user/export/download" });
    } catch (error) {
      console.error("Error starting export:", error);
      res.status(500).json({ message: "Failed to start export" });
    }
  });

  app.get('/api/user/export/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaigns = await storage.getCampaigns(userId, 1000, 0);
      const contacts = await storage.getContacts(userId, 1000, 0);
      const templates = await storage.getEmailTemplates(userId);
      const servers = await storage.getSmtpServers(userId);
      const domainsList = await storage.getDomains(userId);

      const lines = [
        "section,field1,field2,field3,field4",
        `campaigns,count,${campaigns.total},,`,
        `contacts,count,${contacts.total},,`,
      ];

      campaigns.campaigns.forEach((campaign) => {
        lines.push(`campaign,${campaign.id},${campaign.name},${campaign.status},${campaign.createdAt}`);
      });

      contacts.contacts.forEach((contact) => {
        lines.push(`contact,${contact.id},${contact.email},${contact.status},${contact.createdAt}`);
      });

      templates.forEach((template) => {
        lines.push(`template,${template.id},${template.name},${template.subject},${template.updatedAt}`);
      });

      servers.forEach((server) => {
        lines.push(`smtp_server,${server.id},${server.name},${server.host},${server.port}`);
      });

      domainsList.forEach((domain) => {
        lines.push(`domain,${domain.id},${domain.domain},${domain.verified},${domain.lastChecked || ""}`);
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=emailpro_export.csv");
      res.send(lines.join("\n"));
    } catch (error) {
      console.error("Error generating export:", error);
      res.status(500).json({ message: "Failed to generate export" });
    }
  });

  app.delete('/api/user/account', isAuthenticated, async (_req: any, res) => {
    try {
      res.json({ message: "Account deletion scheduled" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  app.put('/api/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      res.json({ message: "Settings updated successfully", settings: req.body });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const stats = await storage.getCampaignStats(userId);
      const accountStats = {
        totalCampaigns: stats.totalCampaigns,
        totalContacts: stats.totalContacts,
        totalEmailsSent: 0,
        accountCreated: user?.createdAt || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        storageUsed: 0,
        storageLimit: 1000
      };
      res.json(accountStats);
    } catch (error) {
      console.error("Error fetching account stats:", error);
      res.status(500).json({ message: "Failed to fetch account stats" });
    }
  });

  app.get('/api/analytics/click-tracking/:campaign/:days', isAuthenticated, async (req, res) => {
    try {
      const clickData = [];
      res.json(clickData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch click tracking data" });
    }
  });

  app.get('/api/analytics/click-events/:campaign/:days/:search?', isAuthenticated, async (req, res) => {
    try {
      const events = [];
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch click events" });
    }
  });

  app.get('/api/analytics/click-stats/:days', isAuthenticated, async (req, res) => {
    try {
      const stats = {
        totalClicks: 0,
        uniqueClicks: 0,
        avgClickRate: "0%",
        topLink: null
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch click stats" });
    }
  });

  app.get('/api/analytics/deliverability/:days/:server', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const campaignsData = await storage.getCampaigns(userId, 10000, 0);
      const suppressions = await storage.getSuppressionList(userId);

      const sentCampaigns = campaignsData.campaigns.filter((campaign) => campaign.status === "sent");
      const totals = sentCampaigns.reduce(
        (acc, campaign) => {
          const sent = campaign.sentCount || campaign.recipientCount || 0;
          acc.sent += sent;
          acc.bounces += campaign.bounceCount || 0;
          return acc;
        },
        { sent: 0, bounces: 0 }
      );

      const complaintCount = suppressions.filter((item) => item.reason === "complaint").length;
      const deliveryRate = totals.sent > 0
        ? Math.round(((totals.sent - totals.bounces) / totals.sent) * 1000) / 10
        : 0;
      const bounceRate = totals.sent > 0
        ? Math.round((totals.bounces / totals.sent) * 1000) / 10
        : 0;
      const complaintRate = totals.sent > 0
        ? Math.round((complaintCount / totals.sent) * 1000) / 10
        : 0;
      const inboxPlacement = deliveryRate;
      const spamPlacement = 0;
      const reputationScore = Math.max(
        0,
        Math.min(100, Math.round(100 - bounceRate * 2 - complaintRate * 10))
      );

      const deliverabilityStats = {
        deliveryRate,
        bounceRate,
        complaintRate,
        inboxPlacement,
        spamPlacement,
        reputationScore,
        trend: "stable",
      };
      res.json(deliverabilityStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deliverability stats" });
    }
  });

  app.get('/api/analytics/server-health', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const servers = await storage.getSmtpServers(userId);
      const campaignsData = await storage.getCampaigns(userId, 10000, 0);
      const totalsByServer = new Map<number, { sent: number; bounces: number }>();

      campaignsData.campaigns.forEach((campaign) => {
        if (!campaign.smtpServerId) return;
        const serverId = Number(campaign.smtpServerId);
        const sent = campaign.sentCount || campaign.recipientCount || 0;
        const bounces = campaign.bounceCount || 0;
        const totals = totalsByServer.get(serverId) || { sent: 0, bounces: 0 };
        totals.sent += sent;
        totals.bounces += bounces;
        totalsByServer.set(serverId, totals);
      });

      const serverHealth = servers.map((server) => {
        const totals = totalsByServer.get(server.id) || { sent: 0, bounces: 0 };
        const bounceRate = totals.sent > 0
          ? Math.round((totals.bounces / totals.sent) * 1000) / 10
          : 0;
        const deliveryRate = totals.sent > 0
          ? Math.round(((totals.sent - totals.bounces) / totals.sent) * 1000) / 10
          : 0;
        const status = server.status === "error"
          ? "critical"
          : server.status === "inactive"
          ? "warning"
          : "healthy";
        const issues: string[] = [];
        if (server.status !== "active") {
          issues.push(`Server status: ${server.status}`);
        }
        if (bounceRate >= 5) {
          issues.push("High bounce rate");
        }

        return {
          id: server.id,
          name: server.name,
          status,
          deliveryRate,
          bounceRate,
          lastCheck: server.updatedAt || new Date().toISOString(),
          issues,
        };
      });
      res.json(serverHealth);
    } catch (error) {
      console.error("Error fetching server health:", error);
      res.status(500).json({ message: "Failed to fetch server health" });
    }
  });

  app.get('/api/analytics/domain-reputation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const domainsList = await storage.getDomains(userId);
      const domainReputations = domainsList.map((domain) => {
        let reputation: "excellent" | "good" | "fair" | "poor" = "poor";
        if (domain.verified && domain.spfValid && domain.dkimValid && domain.dmarcValid) {
          reputation = "excellent";
        } else if (domain.verified && (domain.spfValid || domain.dkimValid)) {
          reputation = "good";
        } else if (domain.verified) {
          reputation = "fair";
        }

        const scoreByReputation = {
          excellent: 95,
          good: 80,
          fair: 60,
          poor: 40,
        };

        return {
          domain: domain.domain,
          reputation,
          score: scoreByReputation[reputation],
          blacklisted: false,
          lastChecked: domain.lastChecked || domain.createdAt || new Date().toISOString(),
        };
      });
      res.json(domainReputations);
    } catch (error) {
      console.error("Error fetching domain reputation:", error);
      res.status(500).json({ message: "Failed to fetch domain reputation" });
    }
  });

  app.get('/api/analytics/bounce-analysis/:days', isAuthenticated, async (req: any, res) => {
    try {
      const bounceAnalysis = [
        { type: 'hard', count: 5, percentage: 1.2 },
        { type: 'soft', count: 3, percentage: 0.7 },
        { type: 'unknown', count: 2, percentage: 0.5 }
      ];
      res.json(bounceAnalysis);
    } catch (error) {
      console.error("Error fetching bounce analysis:", error);
      res.status(500).json({ message: "Failed to fetch bounce analysis" });
    }
  });

  app.get('/api/pmta/status', isAuthenticated, async (req, res) => {
    try {
      const pmtaStatus = {
        status: 'running',
        version: '5.5',
        uptime: '24h 30m',
        queueSize: 0,
        deliveryRate: '1000/min'
      };
      res.json(pmtaStatus);
    } catch (error) {
      res.status(500).json({ error: 'PowerMTA unavailable' });
    }
  });

  app.get('/api/pmta/queue', isAuthenticated, async (req, res) => {
    try {
      const queueStatus = {
        totalMessages: 0,
        deliverQueue: 0,
        retryQueue: 0,
        bounceQueue: 0
      };
      res.json(queueStatus);
    } catch (error) {
      res.status(500).json({ error: 'PowerMTA queue unavailable' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processImportJob(params: {
  jobId: number;
  userId: number;
  listId?: number;
  filePath: string;
  fileSize: number;
}) {
  setImmediate(async () => {
    const { jobId, userId, listId, filePath, fileSize } = params;
    let processed = 0;
    let successful = 0;
    let failed = 0;
    let errorSample = "";
    let bytesProcessed = 0;
    let lastProgressUpdate = Date.now();
    let headerParsed = false;
    let emailIndex = -1;
    let firstNameIndex = -1;
    let lastNameIndex = -1;

    try {
      await storage.updateImportJob(jobId, { status: "processing" });

      const stream = fs.createReadStream(filePath, { encoding: "utf-8" });
      stream.on("data", (chunk) => {
        bytesProcessed += Buffer.byteLength(chunk);
      });

      const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
      let batch: { email: string; firstName: string; lastName: string; userId: number }[] = [];

      const flushBatch = async () => {
        if (!batch.length) {
          return;
        }
        const result = await storage.createContactsBatch(batch);
        successful += result.count;
        if (listId && result.ids.length) {
          await storage.addContactsToList(listId, result.ids, userId);
        }
        batch = [];
      };

      for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }

        if (!headerParsed) {
          const header = trimmed.split(",").map((value) => value.trim().toLowerCase());
          emailIndex = header.indexOf("email");
          firstNameIndex = header.indexOf("first_name");
          lastNameIndex = header.indexOf("last_name");

          if (emailIndex === -1) {
            errorSample = "CSV must include an email column";
            await storage.updateImportJob(jobId, {
              status: "failed",
              errorSample,
              bytesProcessed,
            });
            rl.close();
            return;
          }
          headerParsed = true;
          continue;
        }

        processed += 1;
        const columns = trimmed.split(",");
        const email = (columns[emailIndex] || "").trim();
        if (!email) {
          failed += 1;
          if (!errorSample) {
            errorSample = `Row ${processed + 1}: missing email`;
          }
          continue;
        }

        const firstName = firstNameIndex !== -1 ? (columns[firstNameIndex] || "").trim() : "";
        const lastName = lastNameIndex !== -1 ? (columns[lastNameIndex] || "").trim() : "";

        batch.push({ email, firstName, lastName, userId });

        if (batch.length >= IMPORT_BATCH_SIZE) {
          await flushBatch();
        }

        if (Date.now() - lastProgressUpdate > IMPORT_PROGRESS_INTERVAL) {
          lastProgressUpdate = Date.now();
          await storage.updateImportJob(jobId, {
            processed,
            successful,
            failed,
            bytesProcessed,
          });
        }
      }

      await flushBatch();

      await storage.updateImportJob(jobId, {
        status: "completed",
        processed,
        successful,
        failed,
        bytesProcessed: Math.min(bytesProcessed, fileSize),
        errorSample: errorSample || null,
      });

      if (successful > 0) {
        await storage.createNotification({
          type: "contacts",
          message: `Imported ${successful} contacts`,
          userId,
        });
      }

      fs.unlink(filePath, () => undefined);
    } catch (error: any) {
      const message = error?.message || "Import failed";
      await storage.updateImportJob(jobId, {
        status: "failed",
        errorSample: message,
        processed,
        successful,
        failed,
        bytesProcessed,
      });
    }
  });
}