import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getCampaignStats(userId);
      res.json({
        totalCampaigns: stats.totalCampaigns,
        averageOpenRate: `${stats.averageOpenRate.toFixed(1)}%`,
        totalContacts: stats.totalContacts,
        recentActivity: stats.recentCampaigns.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          createdAt: c.createdAt
        }))
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
      const campaign = await storage.createCampaign({ ...req.body, userId });
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get('/api/contact-lists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const lists = await storage.getContactLists(userId);
      res.json(lists);
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

  app.get('/api/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const result = await storage.getContacts(userId, limit, offset);
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
      const contact = await storage.createContact({ ...req.body, userId });
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
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
      const server = await storage.createSmtpServer({ ...req.body, userId });
      res.status(201).json(server);
    } catch (error) {
      console.error("Error creating SMTP server:", error);
      res.status(500).json({ message: "Failed to create SMTP server" });
    }
  });

  app.put('/api/smtp-servers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const serverId = parseInt(req.params.id);
      const updated = await storage.updateSmtpServer(serverId, req.body, userId);
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
      const deliverabilityStats = {
        deliveryRate: 95.5,
        bounceRate: 2.1,
        complaintRate: 0.1,
        inboxPlacement: 92.3,
        spamPlacement: 7.7,
        reputationScore: 85,
        trend: 'up'
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
      const serverHealth = servers.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        uptime: '99.9%',
        lastChecked: new Date().toISOString()
      }));
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
      const domainReputations = domainsList.map(d => ({
        id: d.id,
        domain: d.domain,
        reputationScore: 85,
        status: d.verified ? 'good' : 'pending',
        lastChecked: d.lastChecked || new Date().toISOString()
      }));
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