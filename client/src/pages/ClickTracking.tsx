import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MousePointer, TrendingUp, Link2, BarChart3, Search, ExternalLink, Download } from "lucide-react";

interface ClickData {
  id: string;
  url: string;
  campaignName: string;
  clickCount: number;
  uniqueClicks: number;
  clickRate: number;
  lastClicked: string;
  topLocations: { country: string; clicks: number }[];
  topDevices: { device: string; clicks: number }[];
}

interface ClickEvent {
  id: string;
  url: string;
  campaignName: string;
  recipientEmail: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  clickedAt: string;
}

export default function ClickTracking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [dateRange, setDateRange] = useState("30");

  const { data: clickData = [], isLoading } = useQuery<ClickData[]>({
    queryKey: [`/api/analytics/click-tracking/${selectedCampaign}/${dateRange}`],
  });

  const { data: clickEvents = [] } = useQuery<ClickEvent[]>({
    queryKey: [`/api/analytics/click-events/${selectedCampaign}/${dateRange}/${searchTerm || ''}`],
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
  });

  // Ensure campaigns is always an array
  const campaignList = Array.isArray(campaigns) ? campaigns : (campaigns?.campaigns || []);

  const { data: clickStats = {
    totalClicks: 0,
    uniqueClicks: 0,
    avgClickRate: "0%",
    topLink: null
  } } = useQuery({
    queryKey: [`/api/analytics/click-stats/${dateRange}`],
  });

  const filteredClickData = clickData.filter((click) =>
    click.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    click.campaignName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportClickData = () => {
    const csvContent = [
      "url,campaign,total_clicks,unique_clicks,click_rate,last_clicked",
      ...filteredClickData.map(click => 
        `"${click.url}","${click.campaignName}",${click.clickCount},${click.uniqueClicks},${click.clickRate}%,"${click.lastClicked}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'click_tracking_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Click Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Monitor link clicks and user engagement across your campaigns.
          </p>
        </div>
        <Button variant="outline" onClick={exportClickData}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MousePointer className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{clickStats.totalClicks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Unique Clicks</p>
                <p className="text-2xl font-bold">{clickStats.uniqueClicks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg. Click Rate</p>
                <p className="text-2xl font-bold">{clickStats.avgClickRate || "0%"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Link2 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Top Performing Link</p>
                <p className="text-sm font-bold truncate">{clickStats.topLink || "None"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search links or campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaignList.map((campaign: any) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Click Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Link Performance ({filteredClickData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClickData.length === 0 ? (
            <div className="text-center py-8">
              <MousePointer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No click data found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "No links match your search criteria." : "No clicks have been recorded yet."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link URL</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Total Clicks</TableHead>
                  <TableHead>Unique Clicks</TableHead>
                  <TableHead>Click Rate</TableHead>
                  <TableHead>Last Clicked</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClickData.map((click) => (
                  <TableRow key={click.id}>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center">
                        <Link2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="font-medium truncate">{click.url}</div>
                          <div className="text-sm text-muted-foreground">
                            {new URL(click.url).hostname}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{click.campaignName}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{click.clickCount}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{click.uniqueClicks}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={click.clickRate > 5 ? "default" : click.clickRate > 2 ? "secondary" : "outline"}
                      >
                        {click.clickRate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(click.lastClicked).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <a href={click.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Click Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Click Events</CardTitle>
        </CardHeader>
        <CardContent>
          {clickEvents.length === 0 ? (
            <div className="text-center py-8">
              <MousePointer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No recent clicks</h3>
              <p className="text-muted-foreground">
                Click events will appear here as they happen.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clickEvents.slice(0, 20).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.recipientEmail}</TableCell>
                    <TableCell className="max-w-xs truncate">{event.url}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.campaignName}</Badge>
                    </TableCell>
                    <TableCell>{event.location || "Unknown"}</TableCell>
                    <TableCell className="text-sm">{event.userAgent ? event.userAgent.split(' ')[0] : "Unknown"}</TableCell>
                    <TableCell>
                      {new Date(event.clickedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}