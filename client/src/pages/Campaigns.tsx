import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Download, 
  Mail,
  Calendar,
  Users,
  Eye,
  Copy,
  Edit,
  Send,
  Pause,
  Square,
  Trash,
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useState } from "react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  fromName?: string;
  fromEmail?: string;
  htmlContent?: string;
  textContent?: string;
  smtpServerId?: string | number | null;
  status: string;
  recipientCount: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
}

interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
}

export default function Campaigns() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);

  const { data: campaignsData, isLoading } = useQuery<CampaignsResponse>({
    queryKey: ['/api/campaigns'],
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/campaigns/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({ title: "Campaign deleted" });
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
        title: "Delete failed",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/campaigns/${id}/send`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({ title: "Campaign sending" });
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
        title: "Send failed",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const pauseCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/campaigns/${id}/pause`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({ title: "Campaign paused" });
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
        title: "Pause failed",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const stopCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/campaigns/${id}/stop`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({ title: "Campaign stopped" });
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
        title: "Stop failed",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const duplicateCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('GET', `/api/campaigns/${id}`);
      const campaign = await response.json();
      const payload = {
        name: `${campaign.name} (Copy)`,
        subject: campaign.subject,
        fromName: campaign.fromName,
        fromEmail: campaign.fromEmail,
        htmlContent: campaign.htmlContent,
        textContent: campaign.textContent,
        smtpServerId: campaign.smtpServerId,
        status: "draft",
      };
      const create = await apiRequest('POST', '/api/campaigns', payload);
      return create.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({ title: "Campaign duplicated" });
    },
    onError: (error: any) => {
      toast({
        title: "Duplicate failed",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCampaign = () => {
    setLocation('/campaigns/create');
  };

  const handleExport = () => {
    if (!campaignsData?.campaigns?.length) {
      toast({
        title: "Export unavailable",
        description: "No campaigns to export.",
        variant: "destructive",
      });
      return;
    }

    const lines = [
      "id,name,subject,status,recipients,createdAt",
      ...campaignsData.campaigns.map((c) =>
        `${c.id},"${c.name}","${c.subject}",${c.status},${c.recipientCount},${c.createdAt}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "campaigns_export.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };


  const handleDeleteCampaign = (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      deleteCampaignMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateOpenRate = (openCount: number, recipientCount: number) => {
    if (recipientCount === 0) return 0;
    return Math.round((openCount / recipientCount) * 100 * 10) / 10;
  };

  const calculateClickRate = (clickCount: number, recipientCount: number) => {
    if (recipientCount === 0) return 0;
    return Math.round((clickCount / recipientCount) * 100 * 10) / 10;
  };

  const filteredCampaigns = campaignsData?.campaigns?.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Campaigns</h1>
            <p className="text-slate-600 mt-1">Manage your email campaigns and track their performance.</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Campaigns</h1>
          <p className="text-slate-600 mt-1">Manage your email campaigns and track their performance.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreateCampaign} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-600">Total Campaigns</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{campaignsData?.total || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-slate-600">Scheduled</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {filteredCampaigns.filter(c => c.status === 'scheduled').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-slate-600">Active</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {filteredCampaigns.filter(c => c.status === 'sending').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-slate-600">Drafts</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {filteredCampaigns.filter(c => c.status === 'draft').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-slate-600"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="sending">Sending</option>
          <option value="sent">Sent</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Campaign</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Recipients</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Open Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Click Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500 min-w-[360px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => {
                    const canSend = ['draft', 'paused', 'scheduled'].includes(campaign.status);
                    const canPause = ['sending'].includes(campaign.status);
                    const canStop = ['sending', 'scheduled'].includes(campaign.status);
                    const isSendDisabled = !canSend || sendCampaignMutation.isPending;
                    const isPauseDisabled = !canPause || pauseCampaignMutation.isPending;
                    const isStopDisabled = !canStop || stopCampaignMutation.isPending;

                    return (
                    <tr key={campaign.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            campaign.status === 'sent' ? 'bg-green-500' :
                            campaign.status === 'scheduled' ? 'bg-yellow-500' :
                            campaign.status === 'sending' ? 'bg-blue-500' :
                            'bg-gray-500'
                          }`}></div>
                          <div>
                            <div className="font-medium text-slate-900">{campaign.name}</div>
                            <div className="text-sm text-slate-500">{campaign.subject}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-900">
                        {campaign.recipientCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-900">
                        {campaign.status === 'sent' ? `${calculateOpenRate(campaign.openCount, campaign.recipientCount)}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-900">
                        {campaign.status === 'sent' ? `${calculateClickRate(campaign.clickCount, campaign.recipientCount)}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {campaign.sentAt ? format(new Date(campaign.sentAt), 'MMM d, yyyy') : 
                         campaign.scheduledAt ? format(new Date(campaign.scheduledAt), 'MMM d, yyyy') :
                         format(new Date(campaign.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-right min-w-[360px]">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setPreviewCampaign(campaign)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => duplicateCampaignMutation.mutate(campaign.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${isSendDisabled ? 'opacity-50' : ''}`}
                            onClick={() => {
                              if (isSendDisabled) return;
                              sendCampaignMutation.mutate(campaign.id);
                            }}
                            aria-disabled={isSendDisabled}
                            title="Send"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${isPauseDisabled ? 'opacity-50' : ''}`}
                            onClick={() => {
                              if (isPauseDisabled) return;
                              pauseCampaignMutation.mutate(campaign.id);
                            }}
                            aria-disabled={isPauseDisabled}
                            title="Pause"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${isStopDisabled ? 'opacity-50' : ''}`}
                            onClick={() => {
                              if (isStopDisabled) return;
                              stopCampaignMutation.mutate(campaign.id);
                            }}
                            aria-disabled={isStopDisabled}
                            title="Stop"
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No campaigns found</h3>
              <p className="text-slate-500 mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? "Try adjusting your search or filters." 
                  : "Create your first email campaign to get started."}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={handleCreateCampaign} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewCampaign} onOpenChange={() => setPreviewCampaign(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Preview</DialogTitle>
          </DialogHeader>
          {previewCampaign && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Name: {previewCampaign.name}</p>
                <p className="text-sm text-slate-600">Subject: {previewCampaign.subject}</p>
                <p className="text-sm text-slate-600">Status: {previewCampaign.status}</p>
              </div>
              {previewCampaign.htmlContent ? (
                <div
                  className="border rounded-lg p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: previewCampaign.htmlContent }}
                />
              ) : (
                <p className="text-sm text-slate-500">No HTML content available for preview.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
