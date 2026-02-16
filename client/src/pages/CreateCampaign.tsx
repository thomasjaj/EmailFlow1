import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import EmailTemplateBuilder from "@/components/EmailTemplateBuilder";
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Eye, 
  Settings,
  Users,
  Mail,
  Calendar,
  BarChart3
} from "lucide-react";

interface ContactList {
  id: string;
  name: string;
  description?: string;
}

interface SmtpServer {
  id: string;
  name: string;
  host: string;
  status: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export default function CreateCampaign() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [campaignData, setCampaignData] = useState({
    name: "",
    subject: "",
    fromName: "",
    fromEmail: "",
    htmlContent: "",
    textContent: "",
    templateId: "",
    recipientLists: [] as string[],
    smtpServerId: "",
    scheduledAt: "",
    sendImmediately: true,
    trackOpens: true,
    trackClicks: true,
    trackUnsubscribes: false,
    trackBounces: false,
    enableAbTesting: false,
  });
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Fetch contact lists
  const { data: contactLists } = useQuery<ContactList[]>({
    queryKey: ['/api/contact-lists'],
  });

  // Fetch SMTP servers
  const { data: smtpServers } = useQuery<SmtpServer[]>({
    queryKey: ['/api/smtp-servers'],
  });

  // Fetch templates
  const { data: templates } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/templates'],
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/campaigns', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Campaign created successfully",
        description: "Your campaign has been created and is ready to send.",
      });
      setLocation('/campaigns');
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error creating campaign",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/campaigns/${editingCampaignId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Campaign updated successfully",
        description: "Your changes have been saved.",
      });
      setLocation('/campaigns');
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error updating campaign",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/campaigns/test-email', {
        smtpServerId: campaignData.smtpServerId,
        toEmail: testEmail,
        fromName: campaignData.fromName,
        fromEmail: campaignData.fromEmail,
        subject: campaignData.subject,
        htmlContent: campaignData.htmlContent,
        textContent: campaignData.textContent,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: "Check your inbox for the test message.",
      });
      setShowTestDialog(false);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Test email failed",
        description: error?.message || "Please check your SMTP settings and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (isDraft: boolean = false) => {
    if (!campaignData.name || !campaignData.subject || !campaignData.htmlContent) {
      toast({
        title: "Missing required fields",
        description: "Please fill in campaign name, subject, and content.",
        variant: "destructive",
      });
      return;
    }

    if (campaignData.recipientLists.length === 0) {
      toast({
        title: "No recipients selected",
        description: "Please select at least one contact list.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...campaignData,
      status: isDraft ? 'draft' : (campaignData.sendImmediately ? 'sending' : 'scheduled'),
      scheduledAt: campaignData.sendImmediately ? null : campaignData.scheduledAt || null,
    };

    if (editingCampaignId) {
      updateCampaignMutation.mutate(payload);
    } else {
      createCampaignMutation.mutate(payload);
    }
  };

  const handleListSelection = (listId: string, checked: boolean) => {
    if (checked) {
      setCampaignData(prev => ({
        ...prev,
        recipientLists: [...prev.recipientLists, listId]
      }));
    } else {
      setCampaignData(prev => ({
        ...prev,
        recipientLists: prev.recipientLists.filter(id => id !== listId)
      }));
    }
  };

  const handleBack = () => {
    setLocation('/campaigns');
  };

  const handleOpenTestDialog = () => {
    if (!campaignData.smtpServerId || !campaignData.fromEmail || !campaignData.subject || !campaignData.htmlContent) {
      toast({
        title: "Missing required fields",
        description: "Select an SMTP server and fill in From Email, Subject, and Content first.",
        variant: "destructive",
      });
      return;
    }
    setShowTestDialog(true);
  };

  const handleSendTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Test email required",
        description: "Enter a recipient email address.",
        variant: "destructive",
      });
      return;
    }
    sendTestEmailMutation.mutate();
  };

  const handleTemplateSelect = (templateId: string) => {
    setCampaignData((prev) => ({ ...prev, templateId }));
    const template = templates?.find((item) => item.id === templateId);
    if (!template) return;
    setCampaignData((prev) => ({
      ...prev,
      subject: template.subject || prev.subject,
      htmlContent: template.htmlContent || prev.htmlContent,
      textContent: template.textContent || prev.textContent,
    }));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const campaignId = params.get('edit');
    if (!campaignId) return;

    setEditingCampaignId(campaignId);
    apiRequest('GET', `/api/campaigns/${campaignId}`)
      .then((res) => res.json())
      .then((campaign) => {
        setCampaignData({
          name: campaign.name || "",
          subject: campaign.subject || "",
          fromName: campaign.fromName || "",
          fromEmail: campaign.fromEmail || "",
          htmlContent: campaign.htmlContent || "",
          textContent: campaign.textContent || "",
          templateId: campaign.templateId ? String(campaign.templateId) : "",
          recipientLists: [],
          smtpServerId: campaign.smtpServerId ? String(campaign.smtpServerId) : "",
          scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.slice(0, 16) : "",
          sendImmediately: campaign.status !== "scheduled",
          trackOpens: true,
          trackClicks: true,
          trackUnsubscribes: false,
          trackBounces: false,
          enableAbTesting: false,
        });
      })
      .catch((error) => {
        toast({
          title: "Failed to load campaign",
          description: error?.message || "Please try again.",
          variant: "destructive",
        });
      });
  }, [toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Create Campaign</h1>
            <p className="text-slate-600 mt-1">Set up a new email marketing campaign.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {editingCampaignId ? "Update Draft" : "Save as Draft"}
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={handleOpenTestDialog}>
            <Eye className="h-4 w-4" />
            Preview & Test
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {editingCampaignId
              ? (updateCampaignMutation.isPending ? 'Updating...' : 'Update Campaign')
              : (createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign')}
          </Button>
        </div>
      </div>

      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="testEmail">Recipient Email</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendTestEmail} disabled={sendTestEmailMutation.isPending}>
                {sendTestEmailMutation.isPending ? "Sending..." : "Send Test"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="recipients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recipients
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Tracking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Campaign Name*</Label>
                      <Input
                        id="name"
                        value={campaignData.name}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter campaign name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpServer">SMTP Server</Label>
                      <Select value={campaignData.smtpServerId} onValueChange={(value) => setCampaignData(prev => ({ ...prev, smtpServerId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select SMTP server" />
                        </SelectTrigger>
                        <SelectContent>
                          {smtpServers?.map((server) => (
                            <SelectItem key={server.id} value={server.id}>
                              {server.name} ({server.host})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject Line*</Label>
                    <Input
                      id="subject"
                      value={campaignData.subject}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject line"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fromName">From Name</Label>
                      <Input
                        id="fromName"
                        value={campaignData.fromName}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, fromName: e.target.value }))}
                        placeholder="Your Company"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fromEmail">From Email</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={campaignData.fromEmail}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, fromEmail: e.target.value }))}
                        placeholder="noreply@company.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipients">
              <Card>
                <CardHeader>
                  <CardTitle>Select Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  {contactLists && contactLists.length > 0 ? (
                    <div className="space-y-3">
                      {contactLists.map((list) => (
                        <div key={list.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={list.id}
                            checked={campaignData.recipientLists.includes(list.id)}
                            onCheckedChange={(checked) => handleListSelection(list.id, checked as boolean)}
                          />
                          <label htmlFor={list.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {list.name}
                          </label>
                          {list.description && (
                            <span className="text-sm text-slate-500">- {list.description}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No contact lists found</h3>
                      <p className="text-slate-500 mb-4">Create contact lists first to select recipients.</p>
                      <Button variant="outline" onClick={() => setLocation('/contacts')}>
                        Go to Contacts
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle>Email Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label htmlFor="templateSelect">Use Template</Label>
                    <Select value={campaignData.templateId} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <EmailTemplateBuilder
                    value={campaignData.htmlContent}
                    onChange={(html, text) => setCampaignData(prev => ({ 
                      ...prev, 
                      htmlContent: html,
                      textContent: text || ''
                    }))}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tracking">
              <Card>
                <CardHeader>
                  <CardTitle>Tracking & Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trackOpens"
                      checked={campaignData.trackOpens}
                      onCheckedChange={(checked) => setCampaignData(prev => ({ ...prev, trackOpens: checked as boolean }))}
                    />
                    <label htmlFor="trackOpens" className="text-sm font-medium">Track opens</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trackClicks"
                      checked={campaignData.trackClicks}
                      onCheckedChange={(checked) => setCampaignData(prev => ({ ...prev, trackClicks: checked as boolean }))}
                    />
                    <label htmlFor="trackClicks" className="text-sm font-medium">Track clicks</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trackUnsubscribes"
                      checked={campaignData.trackUnsubscribes}
                      onCheckedChange={(checked) => setCampaignData(prev => ({ ...prev, trackUnsubscribes: checked as boolean }))}
                    />
                    <label htmlFor="trackUnsubscribes" className="text-sm font-medium">Track unsubscribes</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trackBounces"
                      checked={campaignData.trackBounces}
                      onCheckedChange={(checked) => setCampaignData(prev => ({ ...prev, trackBounces: checked as boolean }))}
                    />
                    <label htmlFor="trackBounces" className="text-sm font-medium">Track bounces</label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Send Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Send Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={campaignData.sendImmediately ? "immediate" : "scheduled"}
                onValueChange={(value) => setCampaignData(prev => ({ ...prev, sendImmediately: value === "immediate" }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <label htmlFor="immediate" className="text-sm">Send immediately</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <label htmlFor="scheduled" className="text-sm">Schedule for later</label>
                </div>
              </RadioGroup>

              {!campaignData.sendImmediately && (
                <div className="mt-4">
                  <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={campaignData.scheduledAt}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* A/B Testing */}
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="enableAbTesting"
                  checked={campaignData.enableAbTesting}
                  onCheckedChange={(checked) => setCampaignData(prev => ({ ...prev, enableAbTesting: checked as boolean }))}
                />
                <label htmlFor="enableAbTesting" className="text-sm font-medium">Enable A/B testing</label>
              </div>
              <p className="text-sm text-slate-500">
                Test subject lines, send times, or content variations to optimize performance.
              </p>
            </CardContent>
          </Card>

          {/* Campaign Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Recipients:</span>
                <span className="font-medium">{campaignData.recipientLists.length} lists selected</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tracking:</span>
                <span className="font-medium">
                  {[
                    campaignData.trackOpens && 'Opens',
                    campaignData.trackClicks && 'Clicks',
                    campaignData.trackUnsubscribes && 'Unsubscribes',
                    campaignData.trackBounces && 'Bounces'
                  ].filter(Boolean).join(', ') || 'None'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Send Time:</span>
                <span className="font-medium">
                  {campaignData.sendImmediately ? 'Immediately' : 'Scheduled'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
