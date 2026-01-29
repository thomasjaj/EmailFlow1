import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  Globe, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  RefreshCw,
  Shield,
  Mail,
  Key
} from "lucide-react";

const domainSchema = z.object({
  domain: z.string().min(1, "Domain is required").regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, "Invalid domain format"),
});

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  spfRecord: string;
  spfValid: boolean;
  dkimRecord: string;
  dkimValid: boolean;
  dmarcRecord: string;
  dmarcValid: boolean;
  createdAt: string;
  lastChecked: string;
}

interface DnsRecords {
  spf: string;
  dkim: string;
  dmarc: string;
}

export default function Domains() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: domains = [], isLoading } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const { data: dnsRecords } = useQuery<DnsRecords>({
    queryKey: ["/api/domains/dns-records", selectedDomain?.id],
    enabled: !!selectedDomain,
  });

  const addDomainMutation = useMutation({
    mutationFn: (data: { domain: string }) => apiRequest("POST", "/api/domains", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Domain added successfully. Please configure DNS records for verification.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyDomainMutation = useMutation({
    mutationFn: (domainId: string) => apiRequest("POST", `/api/domains/${domainId}/verify`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      toast({
        title: "Success",
        description: "Domain verification completed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: (domainId: string) => apiRequest("DELETE", `/api/domains/${domainId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      toast({
        title: "Success",
        description: "Domain removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof domainSchema>>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      domain: "",
    },
  });

  const onSubmit = (data: z.infer<typeof domainSchema>) => {
    addDomainMutation.mutate(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "DNS record copied to clipboard",
    });
  };

  const getVerificationBadge = (isValid: boolean, isVerified: boolean = false) => {
    if (isVerified && isValid) {
      return <Badge variant="default" className="flex items-center"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
    } else if (isValid) {
      return <Badge variant="secondary" className="flex items-center"><CheckCircle className="h-3 w-3 mr-1" />Valid</Badge>;
    } else {
      return <Badge variant="destructive" className="flex items-center"><XCircle className="h-3 w-3 mr-1" />Invalid</Badge>;
    }
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
          <h1 className="text-3xl font-bold">Domain Authentication</h1>
          <p className="text-muted-foreground mt-1">
            Configure SPF, DKIM, and DMARC records to improve email deliverability.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Domain</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain Name</FormLabel>
                      <FormControl>
                        <Input placeholder="example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addDomainMutation.isPending}>
                    {addDomainMutation.isPending ? "Adding..." : "Add Domain"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Domains</p>
                <p className="text-2xl font-bold">{domains.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">
                  {domains.filter(d => d.verified).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">SPF Configured</p>
                <p className="text-2xl font-bold">
                  {domains.filter(d => d.spfValid).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Key className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">DKIM Configured</p>
                <p className="text-2xl font-bold">
                  {domains.filter(d => d.dkimValid).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Alert */}
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          <strong>Email Authentication Setup</strong><br />
          Configure SPF, DKIM, and DMARC records for your domains to improve email deliverability and protect against spoofing. 
          These records help email providers verify that your emails are legitimate.
        </AlertDescription>
      </Alert>

      {/* Domains List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Domains ({domains.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No domains configured</h3>
              <p className="text-muted-foreground mb-4">
                Add your first domain to start configuring email authentication.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Domain
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SPF</TableHead>
                  <TableHead>DKIM</TableHead>
                  <TableHead>DMARC</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">{domain.domain}</TableCell>
                    <TableCell>
                      {domain.verified ? (
                        <Badge variant="default" className="flex items-center w-fit">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center w-fit">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getVerificationBadge(domain.spfValid)}</TableCell>
                    <TableCell>{getVerificationBadge(domain.dkimValid)}</TableCell>
                    <TableCell>{getVerificationBadge(domain.dmarcValid)}</TableCell>
                    <TableCell>
                      {domain.lastChecked ? new Date(domain.lastChecked).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDomain(domain)}
                        >
                          Configure
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => verifyDomainMutation.mutate(domain.id)}
                          disabled={verifyDomainMutation.isPending}
                        >
                          <RefreshCw className={`h-4 w-4 ${verifyDomainMutation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${domain.domain}?`)) {
                              deleteDomainMutation.mutate(domain.id);
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* DNS Configuration Modal */}
      {selectedDomain && (
        <Dialog open={!!selectedDomain} onOpenChange={() => setSelectedDomain(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Configure DNS for {selectedDomain.domain}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="spf" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="spf">SPF Record</TabsTrigger>
                <TabsTrigger value="dkim">DKIM Record</TabsTrigger>
                <TabsTrigger value="dmarc">DMARC Record</TabsTrigger>
              </TabsList>
              
              <TabsContent value="spf" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">SPF (Sender Policy Framework)</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add this TXT record to your DNS to specify which servers are allowed to send email for your domain.
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-sm">Type: TXT</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(dnsRecords?.spf || selectedDomain.spfRecord)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="font-mono text-sm bg-background p-2 rounded border">
                      {dnsRecords?.spf || selectedDomain.spfRecord || "v=spf1 include:_spf.example.com ~all"}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="dkim" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">DKIM (DomainKeys Identified Mail)</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add this TXT record to enable DKIM signing for your emails.
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-sm">Type: TXT</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(dnsRecords?.dkim || selectedDomain.dkimRecord)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="font-mono text-sm bg-background p-2 rounded border break-all">
                      {dnsRecords?.dkim || selectedDomain.dkimRecord || "selector._domainkey.example.com"}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="dmarc" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">DMARC (Domain-based Message Authentication)</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add this TXT record to specify how to handle emails that fail SPF or DKIM checks.
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-sm">Type: TXT</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(dnsRecords?.dmarc || selectedDomain.dmarcRecord)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="font-mono text-sm bg-background p-2 rounded border">
                      {dnsRecords?.dmarc || selectedDomain.dmarcRecord || "v=DMARC1; p=none; rua=mailto:dmarc@example.com"}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedDomain(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => verifyDomainMutation.mutate(selectedDomain.id)}
                disabled={verifyDomainMutation.isPending}
              >
                {verifyDomainMutation.isPending ? "Verifying..." : "Verify DNS Records"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}