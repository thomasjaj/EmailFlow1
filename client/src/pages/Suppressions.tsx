import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSuppressionSchema, type Suppression, type InsertSuppression } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Search, Download, Upload, Trash2, AlertTriangle, Ban, Mail } from "lucide-react";

export default function Suppressions() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReason, setFilterReason] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppressions = [], isLoading } = useQuery<Suppression[]>({
    queryKey: ["/api/suppressions"],
  });

  const { data: suppressionStats = {} } = useQuery({
    queryKey: ["/api/suppressions/stats"],
  });

  const addSuppressionMutation = useMutation({
    mutationFn: (data: InsertSuppression) => apiRequest("/api/suppressions", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppressions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppressions/stats"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Email added to suppression list",
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

  const removeSuppressionMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/suppressions/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppressions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppressions/stats"] });
      toast({
        title: "Success",
        description: "Email removed from suppression list",
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

  const form = useForm<InsertSuppression>({
    resolver: zodResolver(insertSuppressionSchema),
    defaultValues: {
      email: "",
      reason: "unsubscribe",
      source: "manual",
    },
  });

  const onSubmit = (data: InsertSuppression) => {
    addSuppressionMutation.mutate(data);
  };

  const handleRemoveSupression = (id: string) => {
    if (confirm("Are you sure you want to remove this email from the suppression list?")) {
      removeSuppressionMutation.mutate(id);
    }
  };

  const filteredSuppressions = suppressions.filter((suppression) => {
    const matchesSearch = suppression.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReason = filterReason === "all" || suppression.reason === filterReason;
    return matchesSearch && matchesReason;
  });

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case "unsubscribe":
        return <Badge variant="secondary">Unsubscribe</Badge>;
      case "bounce":
        return <Badge variant="destructive">Bounce</Badge>;
      case "complaint":
        return <Badge variant="outline">Complaint</Badge>;
      default:
        return <Badge variant="secondary">{reason}</Badge>;
    }
  };

  const exportSuppressions = () => {
    const csvContent = [
      "email,reason,source,created_at",
      ...filteredSuppressions.map(s => 
        `${s.email},${s.reason},${s.source || ''},${s.createdAt}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suppression_list.csv';
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
          <h1 className="text-3xl font-bold">Suppression List</h1>
          <p className="text-muted-foreground mt-1">
            Manage emails that are blocked from receiving your campaigns.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportSuppressions}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Email to Suppression List</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unsubscribe">Unsubscribe</SelectItem>
                            <SelectItem value="bounce">Bounce</SelectItem>
                            <SelectItem value="complaint">Complaint</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., manual, campaign_123" {...field} />
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
                    <Button type="submit" disabled={addSuppressionMutation.isPending}>
                      {addSuppressionMutation.isPending ? "Adding..." : "Add Email"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Suppressed</p>
                <p className="text-2xl font-bold">{suppressions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Ban className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Unsubscribes</p>
                <p className="text-2xl font-bold">
                  {suppressions.filter(s => s.reason === 'unsubscribe').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Bounces</p>
                <p className="text-2xl font-bold">
                  {suppressions.filter(s => s.reason === 'bounce').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Complaints</p>
                <p className="text-2xl font-bold">
                  {suppressions.filter(s => s.reason === 'complaint').length}
                </p>
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
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterReason} onValueChange={setFilterReason}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="unsubscribe">Unsubscribe</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppression List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suppressed Emails ({filteredSuppressions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSuppressions.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No suppressed emails</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterReason !== "all" 
                  ? "No emails match your current filters."
                  : "Your suppression list is empty."
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppressions.map((suppression) => (
                  <TableRow key={suppression.id}>
                    <TableCell className="font-medium">{suppression.email}</TableCell>
                    <TableCell>{getReasonBadge(suppression.reason)}</TableCell>
                    <TableCell>{suppression.source || "—"}</TableCell>
                    <TableCell>
                      {new Date(suppression.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveSupression(suppression.id)}
                        disabled={removeSuppressionMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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