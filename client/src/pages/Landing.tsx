import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mail, BarChart3, Users, Server, Shield, Zap } from "lucide-react";

export default function Landing() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing info",
        description: "Email and password are required.",
        variant: "destructive",
      });
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm your password.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      await apiRequest("POST", path, { email, password });
      if (mode === "login") {
        window.location.href = "/";
      } else {
        toast({
          title: "Account created",
          description: "Your account is pending approval. You will be able to sign in once approved.",
        });
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      const message = error?.message || "Please try again.";
      const pendingApproval = message.includes("Account pending approval");
      toast({
        title: mode === "login" ? "Login failed" : "Signup failed",
        description: pendingApproval
          ? "Your account is pending approval. Please contact the administrator."
          : message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="flex items-center space-x-2">
              <Button onClick={() => setMode("login")} variant={mode === "login" ? "default" : "outline"}>
                Sign In
              </Button>
              <Button onClick={() => setMode("signup")} variant={mode === "signup" ? "default" : "outline"}>
                Create Account
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Professional Email Marketing
              <span className="text-primary block">Made Simple</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl">
              Create, send, and track email campaigns with our comprehensive platform.
              Multi-server delivery, advanced analytics, and powerful automation tools.
            </p>
          </div>
          <Card className="border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle>{mode === "login" ? "Sign In" : "Create Account"}</CardTitle>
              <CardDescription>
                {mode === "login"
                  ? "Access your EmailPro dashboard."
                  : "Create your account to request access."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                {mode === "signup" && (
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                  />
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Please wait..."
                    : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
                </Button>
                <div className="text-sm text-slate-600 text-center">
                  {mode === "login" ? (
                    <button type="button" className="text-primary" onClick={() => setMode("signup")}>
                      New here? Create an account
                    </button>
                  ) : (
                    <button type="button" className="text-primary" onClick={() => setMode("login")}>
                      Already have an account? Sign in
                    </button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
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
            onClick={() => setMode("signup")}
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
