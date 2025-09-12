import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard API
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = {
        totalCampaigns: 0,
        averageOpenRate: "0%",
        totalContacts: 0,
        recentActivity: []
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Campaigns API
  app.get('/api/campaigns', isAuthenticated, async (req, res) => {
    try {
      const campaigns = { campaigns: [], total: 0 };
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Contact Lists API
  app.get('/api/contact-lists', isAuthenticated, async (req, res) => {
    try {
      const lists = [];
      res.json(lists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact lists" });
    }
  });

  // Contacts API
  app.get('/api/contacts/:listId', isAuthenticated, async (req, res) => {
    try {
      const contacts = [];
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get('/api/contacts/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = {
        activeContacts: 0,
        segments: 0,
        avgEngagement: "0%"
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact stats" });
    }
  });

  // Templates API
  app.get('/api/templates', isAuthenticated, async (req, res) => {
    try {
      const templates = [];
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // SMTP Servers API
  app.get('/api/smtp-servers', isAuthenticated, async (req, res) => {
    try {
      const servers = [];
      res.json(servers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SMTP servers" });
    }
  });

  // Suppressions API
  app.get('/api/suppressions', isAuthenticated, async (req, res) => {
    try {
      const suppressions = [];
      res.json(suppressions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppressions" });
    }
  });

  app.get('/api/suppressions/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = {
        total: 0,
        unsubscribes: 0,
        bounces: 0,
        complaints: 0
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppression stats" });
    }
  });

  // Analytics API
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

  app.get('/api/analytics/server-health', isAuthenticated, async (req, res) => {
    try {
      const serverHealth = [];
      res.json(serverHealth);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch server health" });
    }
  });

  app.get('/api/analytics/domain-reputation', isAuthenticated, async (req, res) => {
    try {
      const domainReputations = [];
      res.json(domainReputations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch domain reputation" });
    }
  });

  app.get('/api/analytics/bounce-analysis/:days', isAuthenticated, async (req, res) => {
    try {
      const bounceAnalysis = [];
      res.json(bounceAnalysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bounce analysis" });
    }
  });

  // Domains API
  app.get('/api/domains', isAuthenticated, async (req, res) => {
    try {
      const domains = [];
      res.json(domains);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch domains" });
    }
  });

  // User Settings API
  app.get('/api/user/settings', isAuthenticated, async (req, res) => {
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

  app.get('/api/user/stats', isAuthenticated, async (req, res) => {
    try {
      const accountStats = {
        totalCampaigns: 0,
        totalContacts: 0,
        totalEmailsSent: 0,
        accountCreated: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        storageUsed: 0,
        storageLimit: 1000
      };
      res.json(accountStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account stats" });
    }
  });

  // PowerMTA Integration API (when PowerMTA is available)
  app.get('/api/pmta/status', isAuthenticated, async (req, res) => {
    try {
      // This would connect to PowerMTA web monitor
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