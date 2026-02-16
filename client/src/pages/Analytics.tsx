import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Mail, 
  MousePointer, 
  Users, 
  AlertTriangle,
  Download,
  Calendar,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  name: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
  createdAt: string;
  sentAt?: string;
}

interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
}

interface DashboardStats {
  totalCampaigns: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalContacts: number;
}

export default function Analytics() {
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [timeRange, setTimeRange] = useState("30");

  // Fetch campaigns for analytics
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery<CampaignsResponse>({
    queryKey: ['/api/campaigns'],
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const campaigns = campaignsData?.campaigns || [];
  const sentCampaigns = campaigns.filter(c => c.status === 'sent');

  // Calculate overall metrics
  const totalSent = sentCampaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const totalOpens = sentCampaigns.reduce((sum, c) => sum + c.openCount, 0);
  const totalClicks = sentCampaigns.reduce((sum, c) => sum + c.clickCount, 0);
  const totalBounces = sentCampaigns.reduce((sum, c) => sum + c.bounceCount, 0);
  const totalUnsubscribes = sentCampaigns.reduce((sum, c) => sum + c.unsubscribeCount, 0);

  const overallOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
  const overallClickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;
  const overallBounceRate = totalSent > 0 ? (totalBounces / totalSent) * 100 : 0;
  const overallUnsubscribeRate = totalSent > 0 ? (totalUnsubscribes / totalSent) * 100 : 0;

  // Get top performing campaigns
  const topCampaigns = sentCampaigns
    .map(campaign => ({
      ...campaign,
      openRate: campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0,
      clickRate: campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0,
    }))
    .sort((a, b) => b.openRate - a.openRate)
    .slice(0, 5);

  const handleExportReport = () => {
    if (!campaigns.length) {
      toast({
        title: "Export unavailable",
        description: "No campaign data to export.",
        variant: "destructive",
      });
      return;
    }
    const lines = [
      "metric,value",
      `totalSent,${totalSent}`,
      `overallOpenRate,${overallOpenRate.toFixed(2)}`,
      `overallClickRate,${overallClickRate.toFixed(2)}`,
      `overallBounceRate,${overallBounceRate.toFixed(2)}`,
      `overallUnsubscribeRate,${overallUnsubscribeRate.toFixed(2)}`,
      "",
      "topCampaigns,name,openRate,clickRate",
      ...topCampaigns.map((c) => `${c.name},${c.openRate.toFixed(2)},${c.clickRate.toFixed(2)}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analytics_report.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (campaignsLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
            <p className="text-slate-600 mt-1">Track your email campaign performance and engagement metrics.</p>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-80 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-slate-600 mt-1">Track your email campaign performance and engagement metrics.</p>
        </div>
        <div className="flex space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2" onClick={handleExportReport}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Total Sent</p>
                <p className="text-2xl font-semibold text-slate-900">{totalSent.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 text-sm">+12%</span>
                  <span className="text-slate-500 text-sm ml-1">vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Open Rate</p>
                <p className="text-2xl font-semibold text-slate-900">{overallOpenRate.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 text-sm">+2.1%</span>
                  <span className="text-slate-500 text-sm ml-1">vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Click Rate</p>
                <p className="text-2xl font-semibold text-slate-900">{overallClickRate.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                  <span className="text-red-600 text-sm">-0.4%</span>
                  <span className="text-slate-500 text-sm ml-1">vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <MousePointer className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Bounce Rate</p>
                <p className="text-2xl font-semibold text-slate-900">{overallBounceRate.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  <ArrowDownRight className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 text-sm">-0.8%</span>
                  <span className="text-slate-500 text-sm ml-1">vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">Open Rate</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{overallOpenRate.toFixed(1)}%</div>
                  <div className="text-xs text-green-600">+2.1%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Click Rate</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{overallClickRate.toFixed(1)}%</div>
                  <div className="text-xs text-red-600">-0.4%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Bounce Rate</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{overallBounceRate.toFixed(1)}%</div>
                  <div className="text-xs text-green-600">-0.8%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Unsubscribe Rate</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{overallUnsubscribeRate.toFixed(1)}%</div>
                  <div className="text-xs text-green-600">-0.2%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Campaign Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign to analyze" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {sentCampaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCampaign === "all" ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">Select a specific campaign to view detailed metrics</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const campaign = campaigns.find(c => c.id === selectedCampaign);
                    if (!campaign) return null;
                    
                    const openRate = campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0;
                    const clickRate = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0;
                    const bounceRate = campaign.sentCount > 0 ? (campaign.bounceCount / campaign.sentCount) * 100 : 0;
                    
                    return (
                      <>
                        <div className="border-b pb-3">
                          <h4 className="font-medium text-slate-900">{campaign.name}</h4>
                          <p className="text-sm text-slate-500">Sent to {campaign.sentCount.toLocaleString()} recipients</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-lg font-semibold text-blue-600">{openRate.toFixed(1)}%</div>
                            <div className="text-xs text-slate-600">Open Rate</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-lg font-semibold text-green-600">{clickRate.toFixed(1)}%</div>
                            <div className="text-xs text-slate-600">Click Rate</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-lg font-semibold text-yellow-600">{bounceRate.toFixed(1)}%</div>
                            <div className="text-xs text-slate-600">Bounce Rate</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="text-lg font-semibold text-red-600">
                              {campaign.sentCount > 0 ? ((campaign.unsubscribeCount / campaign.sentCount) * 100).toFixed(1) : 0}%
                            </div>
                            <div className="text-xs text-slate-600">Unsubscribe Rate</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {topCampaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Campaign</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Recipients</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Open Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Click Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Sent Date</th>
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((campaign, index) => (
                    <tr key={campaign.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{campaign.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-900">
                        {campaign.sentCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(campaign.openRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{campaign.openRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(campaign.clickRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{campaign.clickRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No sent campaigns yet</h3>
              <p className="text-slate-500">Send your first campaign to see performance analytics.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
