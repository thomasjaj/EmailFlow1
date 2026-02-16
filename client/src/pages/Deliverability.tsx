import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  Server,
  Globe,
  Download
} from "lucide-react";

interface DeliverabilityStats {
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
  inboxPlacement: number;
  spamPlacement: number;
  reputationScore: number;
  trend: 'up' | 'down' | 'stable';
}

interface ServerHealth {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  deliveryRate: number;
  bounceRate: number;
  lastCheck: string;
  issues: string[];
}

interface DomainReputation {
  domain: string;
  reputation: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  blacklisted: boolean;
  lastChecked: string;
}

export default function Deliverability() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("30");
  const [selectedServer, setSelectedServer] = useState("all");

  const { data: deliverabilityStats } = useQuery<DeliverabilityStats>({
    queryKey: [`/api/analytics/deliverability/${dateRange}/${selectedServer}`],
  });

  const { data: serverHealth = [] } = useQuery<ServerHealth[]>({
    queryKey: ["/api/analytics/server-health"],
  });

  const { data: domainReputations = [] } = useQuery<DomainReputation[]>({
    queryKey: ["/api/analytics/domain-reputation"],
  });

  const { data: bounceAnalysis = [] } = useQuery({
    queryKey: [`/api/analytics/bounce-analysis/${dateRange}`],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
      case 'fair':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
      case 'poor':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getReputationBadge = (reputation: string) => {
    const variants = {
      excellent: "default",
      good: "secondary", 
      fair: "outline",
      poor: "destructive"
    } as const;
    
    return <Badge variant={variants[reputation as keyof typeof variants] || "outline"}>{reputation}</Badge>;
  };

  const stats = deliverabilityStats || {
    deliveryRate: 0,
    bounceRate: 0,
    complaintRate: 0,
    inboxPlacement: 0,
    spamPlacement: 0,
    reputationScore: 0,
    trend: 'stable' as const
  };

  const handleExportReport = () => {
    const lines = [
      "metric,value",
      `deliveryRate,${stats.deliveryRate}`,
      `bounceRate,${stats.bounceRate}`,
      `complaintRate,${stats.complaintRate}`,
      `inboxPlacement,${stats.inboxPlacement}`,
      `spamPlacement,${stats.spamPlacement}`,
      `reputationScore,${stats.reputationScore}`,
      "",
      "serverHealth,name,status,deliveryRate,bounceRate,lastCheck",
      ...serverHealth.map((s) => `${s.name},${s.status},${s.deliveryRate},${s.bounceRate},${s.lastCheck}`),
      "",
      "domainReputation,domain,reputation,score,blacklisted,lastChecked",
      ...domainReputations.map((d) => `${d.domain},${d.reputation},${d.score},${d.blacklisted},${d.lastChecked}`),
    ];

    if (lines.length <= 3) {
      toast({
        title: "Export unavailable",
        description: "No deliverability data to export.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "deliverability_report.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deliverability</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your email delivery performance and sender reputation.
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold">{stats.deliveryRate}%</p>
              </div>
              <CheckCircle className={`h-8 w-8 ${stats.deliveryRate > 95 ? 'text-green-600' : stats.deliveryRate > 90 ? 'text-yellow-600' : 'text-red-600'}`} />
            </div>
            <Progress value={stats.deliveryRate} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                <p className="text-2xl font-bold">{stats.bounceRate}%</p>
              </div>
              <XCircle className={`h-8 w-8 ${stats.bounceRate < 2 ? 'text-green-600' : stats.bounceRate < 5 ? 'text-yellow-600' : 'text-red-600'}`} />
            </div>
            <Progress value={stats.bounceRate} className="mt-3 [&>[data-orientation=horizontal]]:bg-red-200" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Complaint Rate</p>
                <p className="text-2xl font-bold">{stats.complaintRate}%</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${stats.complaintRate < 0.1 ? 'text-green-600' : stats.complaintRate < 0.3 ? 'text-yellow-600' : 'text-red-600'}`} />
            </div>
            <Progress value={stats.complaintRate * 10} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reputation Score</p>
                <p className="text-2xl font-bold">{stats.reputationScore}/100</p>
              </div>
              <Shield className={`h-8 w-8 ${stats.reputationScore > 80 ? 'text-green-600' : stats.reputationScore > 60 ? 'text-yellow-600' : 'text-red-600'}`} />
            </div>
            <Progress value={stats.reputationScore} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Inbox Placement */}
      <Card>
        <CardHeader>
          <CardTitle>Inbox Placement Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.inboxPlacement}%</div>
              <p className="text-sm text-muted-foreground">Inbox</p>
              <Progress value={stats.inboxPlacement} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.spamPlacement}%</div>
              <p className="text-sm text-muted-foreground">Spam/Promotions</p>
              <Progress value={stats.spamPlacement} className="mt-2 [&>[data-orientation=horizontal]]:bg-yellow-200" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{100 - stats.inboxPlacement - stats.spamPlacement}%</div>
              <p className="text-sm text-muted-foreground">Blocked/Missing</p>
              <Progress value={100 - stats.inboxPlacement - stats.spamPlacement} className="mt-2 [&>[data-orientation=horizontal]]:bg-red-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            SMTP Server Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serverHealth.length === 0 ? (
            <div className="text-center py-8">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No SMTP servers configured</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Server</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Rate</TableHead>
                  <TableHead>Bounce Rate</TableHead>
                  <TableHead>Last Check</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serverHealth.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell className="font-medium">{server.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(server.status)}
                        <Badge 
                          variant={
                            server.status === 'healthy' ? 'default' :
                            server.status === 'warning' ? 'secondary' : 'destructive'
                          }
                          className="ml-2"
                        >
                          {server.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{server.deliveryRate}%</TableCell>
                    <TableCell>{server.bounceRate}%</TableCell>
                    <TableCell>{new Date(server.lastCheck).toLocaleString()}</TableCell>
                    <TableCell>
                      {server.issues.length === 0 ? (
                        <Badge variant="outline">No issues</Badge>
                      ) : (
                        <Badge variant="destructive">{server.issues.length} issues</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Domain Reputation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Domain Reputation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {domainReputations.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No domains configured</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Reputation</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Blacklist Status</TableHead>
                  <TableHead>Last Checked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domainReputations.map((domain, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{domain.domain}</TableCell>
                    <TableCell>{getReputationBadge(domain.reputation)}</TableCell>
                    <TableCell>{domain.score}/100</TableCell>
                    <TableCell>
                      {domain.blacklisted ? (
                        <Badge variant="destructive">Blacklisted</Badge>
                      ) : (
                        <Badge variant="default">Clean</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(domain.lastChecked).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Deliverability Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.bounceRate > 5 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>High bounce rate detected ({stats.bounceRate}%)</strong><br />
                Consider cleaning your contact list and removing invalid email addresses.
              </AlertDescription>
            </Alert>
          )}
          
          {stats.complaintRate > 0.3 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>High complaint rate ({stats.complaintRate}%)</strong><br />
                Review your email content and ensure proper unsubscribe mechanisms.
              </AlertDescription>
            </Alert>
          )}
          
          {stats.reputationScore < 70 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Low sender reputation score ({stats.reputationScore}/100)</strong><br />
                Implement SPF, DKIM, and DMARC authentication for your domains.
              </AlertDescription>
            </Alert>
          )}
          
          {stats.inboxPlacement < 80 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Low inbox placement rate ({stats.inboxPlacement}%)</strong><br />
                Improve engagement by segmenting your audience and personalizing content.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}