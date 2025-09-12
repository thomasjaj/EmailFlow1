import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, BarChart3, Users, Server, Shield, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900">EmailPro</span>
            </div>
            <Button onClick={handleLogin} className="bg-primary hover:bg-blue-600">
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Professional Email Marketing
            <span className="text-primary block">Made Simple</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Create, send, and track email campaigns with our comprehensive platform. 
            Multi-server delivery, advanced analytics, and powerful automation tools.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button 
              size="lg" 
              onClick={handleLogin}
              className="w-full sm:w-auto bg-primary hover:bg-blue-600 text-lg px-8 py-3"
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto text-lg px-8 py-3"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Everything You Need for Email Marketing
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            From campaign creation to delivery optimization, we've got you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Campaign Management</CardTitle>
              <CardDescription>
                Create and manage email campaigns with our intuitive drag-and-drop editor
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Track opens, clicks, bounces, and engagement with detailed reporting
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Contact Management</CardTitle>
              <CardDescription>
                Organize contacts into lists and segments with advanced filtering
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Server className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Multi-Server Delivery</CardTitle>
              <CardDescription>
                Use multiple SMTP servers for better deliverability and higher volume
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Deliverability Tools</CardTitle>
              <CardDescription>
                Built-in spam checking, bounce handling, and suppression management
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle>Automation</CardTitle>
              <CardDescription>
                Set up automated email sequences and triggers for better engagement
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Email Marketing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses using EmailPro to reach their audience effectively.
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            variant="secondary"
            className="text-lg px-8 py-3"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">EmailPro</span>
            </div>
            <p className="text-sm">
              © 2024 EmailPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
