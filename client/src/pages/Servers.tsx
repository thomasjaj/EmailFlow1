import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Server,
  Activity,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash,
  TestTube,
  Shield,
  Zap
} from "lucide-react";

interface SmtpServer {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption?: string;
  maxEmailsPerHour: number;
  status: 'active' | 'inactive' | 'error';
  createdAt: string;
  updatedAt: string;
}

export default function Servers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddServer, setShowAddServer] = useState(false);
  const [editingServer, setEditingServer] = useState<SmtpServer | null>(null);
  const [testingServerId, setTestingServerId] = useState<string | null>(null);

  const [newServer, setNewServer] = useState({
    name: "",
    host: "",
    port: 587,
    username: "",
    password: "",
    encryption: "tls",
    maxEmailsPerHour: 100,
  });

  // Fetch SMTP servers
  const { data: servers, isLoading } = useQuery<SmtpServer[]>({
    queryKey: ['/api/smtp-servers'],
  });

  // Create server mutation
  const createServerMutation = useMutation({
    mutationFn: async (serverData: any) => {
      const response = await apiRequest('POST', '/api/smtp-servers', serverData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smtp-servers'] });
      setShowAddServer(false);
      setNewServer({
        name: "",
        host: "",
        port: 587,
        username: "",
        password: "",
        encryption: "tls",
        maxEmailsPerHour: 100,
      });
      toast({
        title: "SMTP server added successfully",
        description: "Your SMTP server is ready to use for sending emails.",
      });
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
        title: "Error adding SMTP server",
        description: "Please check your server configuration and try again.",
        variant: "destructive",
      });
    },
  });

  // Update server mutation
  const updateServerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await apiRequest('PUT', `/api/smtp-servers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smtp-servers'] });
      setEditingServer(null);
      toast({
        title: "SMTP server updated successfully",
        description: "Your changes have been saved.",
      });
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
        title: "Error updating SMTP server",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Delete server mutation
  const deleteServerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/smtp-servers/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smtp-servers'] });
      toast({
        title: "SMTP server deleted successfully",
        description: "The server has been removed from your account.",
      });
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
        title: "Error deleting SMTP server",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const testServerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/smtp-servers/${id}/test`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smtp-servers'] });
      toast({
        title: "SMTP test successful",
        description: "The server connection and authentication are working.",
      });
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
        title: "SMTP test failed",
        description: error?.message || "Please check the server settings and try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTestingServerId(null);
    },
  });

  const handleCreateServer = () => {
    if (!newServer.name || !newServer.host) {
      toast({
        title: "Missing required fields",
        description: "Please fill in the server name and host.",
        variant: "destructive",
      });
      return;
    }

    createServerMutation.mutate(newServer);
  };

  const handleUpdateServer = () => {
    if (!editingServer) return;
    const payload = {
      name: editingServer.name,
      host: editingServer.host,
      port: editingServer.port,
      username: editingServer.username,
      password: editingServer.password,
      encryption: editingServer.encryption,
      maxEmailsPerHour: editingServer.maxEmailsPerHour,
      status: editingServer.status,
    };

    updateServerMutation.mutate({
      id: editingServer.id,
      data: payload,
    });
  };

  const handleDeleteServer = (id: string) => {
    if (confirm("Are you sure you want to delete this SMTP server? This action cannot be undone.")) {
      deleteServerMutation.mutate(id);
    }
  };

  const handleTestServer = (id: string) => {
    setTestingServerId(id);
    testServerMutation.mutate(id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <Activity className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const filteredServers = servers?.filter(server =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.host.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">SMTP Servers</h1>
            <p className="text-slate-600 mt-1">Manage your email delivery servers and configurations.</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const activeServers = filteredServers.filter(s => s.status === 'active').length;
  const totalCapacity = filteredServers.reduce((sum, s) => sum + s.maxEmailsPerHour, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">SMTP Servers</h1>
          <p className="text-slate-600 mt-1">Manage your email delivery servers and configurations.</p>
        </div>
        <Dialog open={showAddServer} onOpenChange={setShowAddServer}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Server
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add SMTP Server</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serverName">Server Name*</Label>
                  <Input
                    id="serverName"
                    value={newServer.name}
                    onChange={(e) => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My SMTP Server"
                  />
                </div>
                <div>
                  <Label htmlFor="serverHost">Host*</Label>
                  <Input
                    id="serverHost"
                    value={newServer.host}
                    onChange={(e) => setNewServer(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="smtp.example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serverPort">Port*</Label>
                  <Input
                    id="serverPort"
                    type="number"
                    value={newServer.port}
                    onChange={(e) => setNewServer(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                    placeholder="587"
                  />
                </div>
                <div>
                  <Label htmlFor="encryption">Encryption</Label>
                  <Select value={newServer.encryption} onValueChange={(value) => setNewServer(prev => ({ ...prev, encryption: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select encryption" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newServer.username}
                    onChange={(e) => setNewServer(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="leave blank for IP-auth"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newServer.password}
                    onChange={(e) => setNewServer(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="leave blank for IP-auth"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxEmails">Max Emails per Hour</Label>
                <Input
                  id="maxEmails"
                  type="number"
                  value={newServer.maxEmailsPerHour}
                  onChange={(e) => setNewServer(prev => ({ ...prev, maxEmailsPerHour: parseInt(e.target.value) || 100 }))}
                  placeholder="100"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Set the maximum number of emails this server can send per hour
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAddServer(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateServer} disabled={createServerMutation.isPending}>
                  {createServerMutation.isPending ? 'Adding...' : 'Add Server'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Total Servers</p>
                <p className="text-2xl font-semibold text-slate-900">{filteredServers.length}</p>
              </div>
              <Server className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Active Servers</p>
                <p className="text-2xl font-semibold text-slate-900">{activeServers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Total Capacity</p>
                <p className="text-2xl font-semibold text-slate-900">{totalCapacity.toLocaleString()}/hour</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search servers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Servers Grid */}
      {filteredServers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServers.map((server) => (
            <Card key={server.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {server.name}
                      <Badge className={getStatusColor(server.status)}>
                        {getStatusIcon(server.status)}
                        {server.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">{server.host}:{server.port}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Username:</span>
                      <div className="font-medium">{server.username}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Encryption:</span>
                      <div className="font-medium flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {server.encryption?.toUpperCase() || 'None'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-slate-500">Capacity:</span>
                    <div className="font-medium">{server.maxEmailsPerHour.toLocaleString()} emails/hour</div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Added {new Date(server.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleTestServer(server.id)}
                      disabled={testingServerId === server.id}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      {testingServerId === server.id ? "Testing..." : "Test"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingServer(server)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600"
                      onClick={() => handleDeleteServer(server.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Server className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No SMTP servers found</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery 
                ? "Try adjusting your search query." 
                : "Add your first SMTP server to start sending emails."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddServer(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add SMTP Server
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Server Dialog */}
      <Dialog open={!!editingServer} onOpenChange={() => setEditingServer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit SMTP Server</DialogTitle>
          </DialogHeader>
          {editingServer && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editServerName">Server Name*</Label>
                  <Input
                    id="editServerName"
                    value={editingServer.name}
                    onChange={(e) => setEditingServer(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    placeholder="My SMTP Server"
                  />
                </div>
                <div>
                  <Label htmlFor="editServerHost">Host*</Label>
                  <Input
                    id="editServerHost"
                    value={editingServer.host}
                    onChange={(e) => setEditingServer(prev => prev ? ({ ...prev, host: e.target.value }) : null)}
                    placeholder="smtp.example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editServerPort">Port*</Label>
                  <Input
                    id="editServerPort"
                    type="number"
                    value={editingServer.port}
                    onChange={(e) => setEditingServer(prev => prev ? ({ ...prev, port: parseInt(e.target.value) || 587 }) : null)}
                    placeholder="587"
                  />
                </div>
                <div>
                  <Label htmlFor="editEncryption">Encryption</Label>
                  <Select 
                    value={editingServer.encryption} 
                    onValueChange={(value) => setEditingServer(prev => prev ? ({ ...prev, encryption: value }) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select encryption" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editUsername">Username</Label>
                  <Input
                    id="editUsername"
                    value={editingServer.username}
                    onChange={(e) => setEditingServer(prev => prev ? ({ ...prev, username: e.target.value }) : null)}
                    placeholder="leave blank for IP-auth"
                  />
                </div>
                <div>
                  <Label htmlFor="editPassword">Password</Label>
                  <Input
                    id="editPassword"
                    type="password"
                    value={editingServer.password}
                    onChange={(e) => setEditingServer(prev => prev ? ({ ...prev, password: e.target.value }) : null)}
                    placeholder="leave blank for IP-auth"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editMaxEmails">Max Emails per Hour</Label>
                <Input
                  id="editMaxEmails"
                  type="number"
                  value={editingServer.maxEmailsPerHour}
                  onChange={(e) => setEditingServer(prev => prev ? ({ ...prev, maxEmailsPerHour: parseInt(e.target.value) || 100 }) : null)}
                  placeholder="100"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingServer(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateServer} disabled={updateServerMutation.isPending}>
                  {updateServerMutation.isPending ? 'Updating...' : 'Update Server'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
