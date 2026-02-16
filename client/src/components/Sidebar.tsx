import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, 
  Mail, 
  Users, 
  FileText, 
  Server, 
  Plus,
  List,
  Upload,
  Ban,
  MousePointer,
  Shield,
  Settings,
  UserCheck
} from "lucide-react";

type DashboardStats = {
  totalCampaigns: number;
  totalContacts: number;
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const campaignCount = stats?.totalCampaigns ?? 0;
  const contactCount = stats?.totalContacts ?? 0;

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: BarChart3,
    },
    {
      category: "Campaigns",
      items: [
        {
          name: "All Campaigns",
          href: "/campaigns",
          icon: Mail,
          badge: campaignCount.toLocaleString(),
        },
        {
          name: "Create Campaign",
          href: "/campaigns/create",
          icon: Plus,
        },
        {
          name: "Templates",
          href: "/templates",
          icon: FileText,
        },
      ],
    },
    {
      category: "Contacts",
      items: [
        {
          name: "All Contacts",
          href: "/contacts",
          icon: Users,
          badge: contactCount.toLocaleString(),
        },
        {
          name: "Lists & Segments",
          href: "/lists-segments",
          icon: List,
        },
        {
          name: "Import Contacts",
          href: "/import-contacts",
          icon: Upload,
        },
        {
          name: "Suppressions",
          href: "/suppressions",
          icon: Ban,
        },
      ],
    },
    {
      category: "Analytics",
      items: [
        {
          name: "Reports",
          href: "/analytics",
          icon: BarChart3,
        },
        {
          name: "Click Tracking",
          href: "/click-tracking",
          icon: MousePointer,
        },
        {
          name: "Deliverability",
          href: "/deliverability",
          icon: Shield,
        },
      ],
    },
    {
      category: "Settings",
      items: [
        {
          name: "SMTP Servers",
          href: "/servers",
          icon: Server,
        },
        {
          name: "Domains",
          href: "/domains",
          icon: Shield,
        },
        {
          name: "Account Settings",
          href: "/account-settings",
          icon: Settings,
        },
        ...(user?.role === "admin"
          ? [
              {
                name: "User Approvals",
                href: "/admin/users",
                icon: UserCheck,
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 h-screen fixed left-0 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {navigation.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-6">
            {section.name ? (
              // Single item (like Dashboard)
              <Link href={section.href!}>
                <a className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  location === section.href
                    ? "bg-primary text-white"
                    : "text-slate-700 hover:bg-slate-100"
                )}>
                  <section.icon className="h-5 w-5" />
                  <span>{section.name}</span>
                </a>
              </Link>
            ) : (
              // Category with items
              <>
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {section.category}
                </div>
                <div className="space-y-1">
                  {section.items?.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <a className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                        location === item.href
                          ? "bg-primary text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      )}>
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs",
                            location === item.href
                              ? "bg-white text-primary"
                              : "bg-slate-200 text-slate-700"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </a>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
