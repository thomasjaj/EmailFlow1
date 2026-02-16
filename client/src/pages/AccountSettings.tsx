import { useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Download, 
  Trash2, 
  AlertTriangle,
  Save,
  Upload
} from "lucide-react";

interface UserSettings {
  emailNotifications: boolean;
  campaignReminders: boolean;
  weeklyReports: boolean;
  securityAlerts: boolean;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  language: string;
  defaultSendingTime: string;
}

interface AccountStats {
  totalCampaigns: number;
  totalContacts: number;
  totalEmailsSent: number;
  accountCreated: string;
  lastLogin: string;
  storageUsed: number;
  storageLimit: number;
}

export default function AccountSettings() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery<UserSettings>({
    queryKey: ["/api/user/settings"],
  });

  const { data: accountStats } = useQuery<AccountStats>({
    queryKey: ["/api/user/stats"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<UserSettings>) => apiRequest("PUT", "/api/user/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved successfully.",
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

  const updateProfileMutation = useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string }) => 
      apiRequest("PUT", "/api/user/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated.",
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

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/user/export");
      return response.json() as Promise<{ downloadUrl: string }>;
    },
    onSuccess: (data: { downloadUrl: string }) => {
      window.open(data.downloadUrl, '_blank');
      toast({
        title: "Export Started",
        description: "Your data export has been started. Download will begin shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/user/account"),
    onSuccess: () => {
      toast({
        title: "Account Deletion Initiated",
        description: "Your account deletion has been scheduled. You'll receive a confirmation email.",
      });
      // Redirect to logout
      window.location.href = "/api/logout";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateProfileMutation.mutate({
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
    });
  };

  const handleDeleteAccount = () => {
    const confirmation = prompt(
      'Type "DELETE" to confirm account deletion. This action cannot be undone.'
    );
    if (confirmation === "DELETE") {
      deleteAccountMutation.mutate();
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "Upload not configured",
        description: "Profile photo uploads are not enabled yet.",
        variant: "destructive",
      });
    }, 300);
  };

  const defaultSettings: UserSettings = {
    emailNotifications: true,
    campaignReminders: true,
    weeklyReports: false,
    securityAlerts: true,
    theme: 'system',
    timezone: 'UTC',
    language: 'en',
    defaultSendingTime: '10:00',
  };

  const currentSettings = settings || defaultSettings;
  const stats = accountStats || {
    totalCampaigns: 0,
    totalContacts: 0,
    totalEmailsSent: 0,
    accountCreated: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    storageUsed: 0,
    storageLimit: 1000,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and security settings.
        </p>
      </div>

      {user?.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Tools</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">User Approvals</div>
              <div className="text-sm text-muted-foreground">
                Review and approve new user requests.
              </div>
            </div>
            <Button asChild>
              <Link href="/admin/users">Open</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data & Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || user?.email} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0] || user?.email?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelected}
                  />
                  <Button variant="outline" disabled={isUploading} onClick={handlePhotoClick}>
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Uploading..." : "Change Photo"}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={user?.firstName || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={user?.lastName || ""}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Email address cannot be changed. Contact support if needed.
                  </p>
                </div>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalCampaigns}</div>
                  <p className="text-sm text-muted-foreground">Campaigns</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalContacts}</div>
                  <p className="text-sm text-muted-foreground">Contacts</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalEmailsSent}</div>
                  <p className="text-sm text-muted-foreground">Emails Sent</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((stats.storageUsed / stats.storageLimit) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Account created: {new Date(stats.accountCreated).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last login: {new Date(stats.lastLogin).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about your campaigns and account activity
                  </p>
                </div>
                <Switch
                  checked={currentSettings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Campaign Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded about scheduled campaigns and follow-ups
                  </p>
                </div>
                <Switch
                  checked={currentSettings.campaignReminders}
                  onCheckedChange={(checked) => handleSettingChange('campaignReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly performance reports and insights
                  </p>
                </div>
                <Switch
                  checked={currentSettings.weeklyReports}
                  onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Important security notifications and login alerts
                  </p>
                </div>
                <Switch
                  checked={currentSettings.securityAlerts}
                  onCheckedChange={(checked) => handleSettingChange('securityAlerts', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                App Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Theme</Label>
                  <Select
                    value={currentSettings.theme}
                    onValueChange={(value) => handleSettingChange('theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Timezone</Label>
                  <Select
                    value={currentSettings.timezone}
                    onValueChange={(value) => handleSettingChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Language</Label>
                  <Select
                    value={currentSettings.language}
                    onValueChange={(value) => handleSettingChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Default Sending Time</Label>
                  <Input
                    type="time"
                    value={currentSettings.defaultSendingTime}
                    onChange={(e) => handleSettingChange('defaultSendingTime', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your account is secured through EmailPro login credentials.
                  Use a strong password and keep it private.
                </AlertDescription>
              </Alert>
              
              <div>
                <Label>Connected Account</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Authenticated via EmailPro
                  </p>
                </div>
              </div>

              <div>
                <Button variant="outline" asChild>
                  <a href="/api/logout">
                    Sign Out
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Data & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Export Your Data</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Download a copy of all your data including campaigns, contacts, and analytics.
                </p>
                <Button
                  variant="outline"
                  onClick={() => exportDataMutation.mutate()}
                  disabled={exportDataMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportDataMutation.isPending ? "Preparing Export..." : "Export Data"}
                </Button>
              </div>

              <div className="pt-6 border-t">
                <h4 className="font-medium mb-2 text-red-600">Danger Zone</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Delete your account and all associated data. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteAccountMutation.isPending ? "Processing..." : "Delete Account"}
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Account deletion is permanent and cannot be reversed. 
                  Make sure to export your data first if you want to keep a copy.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}