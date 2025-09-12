import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Campaigns from "@/pages/Campaigns";
import CreateCampaign from "@/pages/CreateCampaign";
import Contacts from "@/pages/Contacts";
import Templates from "@/pages/Templates";
import Analytics from "@/pages/Analytics";
import Servers from "@/pages/Servers";
import ListsSegments from "@/pages/ListsSegments";
import ImportContacts from "@/pages/ImportContacts";
import Suppressions from "@/pages/Suppressions";
import ClickTracking from "@/pages/ClickTracking";
import Deliverability from "@/pages/Deliverability";
import Domains from "@/pages/Domains";
import AccountSettings from "@/pages/AccountSettings";
import Layout from "@/components/Layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/campaigns/create" component={CreateCampaign} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/lists-segments" component={ListsSegments} />
          <Route path="/import-contacts" component={ImportContacts} />
          <Route path="/suppressions" component={Suppressions} />
          <Route path="/templates" component={Templates} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/click-tracking" component={ClickTracking} />
          <Route path="/deliverability" component={Deliverability} />
          <Route path="/servers" component={Servers} />
          <Route path="/domains" component={Domains} />
          <Route path="/account-settings" component={AccountSettings} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
