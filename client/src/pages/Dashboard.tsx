import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/StatsCard";
import CampaignChart from "@/components/CampaignChart";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Users, 
  TrendingUp, 
  MousePointer, 
  Plus, 
  Download,
  Calendar,
  Activity,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";

interface DashboardStats {
  totalCampaigns: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalContacts: number;
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    recipientCount: number;
    openCount: number;
    clickCount: number;
    createdAt: string;
    sentAt?: string;
  }>;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const handleCreateCampaign = () => {
    setLocation('/campaigns/create');
  };

  const handleViewCampaigns = () => {
    setLocation('/campaigns');
  };

  const handleExport = () => {
    if (!stats) {
      toast({
        title: "Export unavailable",
        description: "No dashboard data to export yet.",
        variant: "destructive",
      });
      return;
    }

    const lines = [
      "metric,value",
      `totalCampaigns,${stats.totalCampaigns}`,
      `averageOpenRate,${stats.averageOpenRate}`,
      `averageClickRate,${stats.averageClickRate}`,
      `totalContacts,${stats.totalContacts}`,
      "",
      "recentCampaignId,name,status,recipientCount,openCount,clickCount,createdAt",
      ...(stats.recentCampaigns || []).map((c) =>
        `${c.id},"${c.name}",${c.status},${c.recipientCount},${c.openCount},${c.clickCount},${c.createdAt}`
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dashboard_export.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome back! Here's what's happening with your email campaigns.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-full"></div>
              </CardContent>
            </Card>
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
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's what's happening with your email campaigns.</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Campaigns"
          value={stats?.totalCampaigns || 0}
          change="+12%"
          changeType="positive"
          icon={Mail}
          iconColor="text-primary"
          iconBgColor="bg-blue-100"
        />
        
        <StatsCard
          title="Average Open Rate"
          value={`${stats?.averageOpenRate || 0}%`}
          change="+2.1%"
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        
        <StatsCard
          title="Average Click Rate"
          value={`${stats?.averageClickRate || 0}%`}
          change="-0.4%"
          changeType="negative"
          icon={MousePointer}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
        
        <StatsCard
          title="Total Contacts"
          value={stats?.totalContacts?.toLocaleString() || '0'}
          change="+1,245"
          changeType="positive"
          icon={Users}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CampaignChart />
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Campaign Performance</CardTitle>
              <select className="text-sm border border-slate-300 rounded-lg px-3 py-1 text-slate-600">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Open Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats?.averageOpenRate || 0}%` }}></div>
                  </div>
                  <span className="text-sm font-medium">{stats?.averageOpenRate || 0}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Click Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats?.averageClickRate || 0}%` }}></div>
                  </div>
                  <span className="text-sm font-medium">{stats?.averageClickRate || 0}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Campaigns</CardTitle>
            <Button variant="ghost" onClick={handleViewCampaigns} className="flex items-center gap-1">
              View all campaigns
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
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
                  </tr>
                </thead>
                <tbody>
                  {stats.recentCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${campaign.status === 'sent' ? 'bg-green-500' : campaign.status === 'scheduled' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                          <div>
                            <div className="font-medium text-slate-900">{campaign.name}</div>
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
                        {campaign.sentAt ? format(new Date(campaign.sentAt), 'MMM d, yyyy') : format(new Date(campaign.createdAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No campaigns yet</h3>
              <p className="text-slate-500 mb-4">Create your first email campaign to get started.</p>
              <Button onClick={handleCreateCampaign} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
