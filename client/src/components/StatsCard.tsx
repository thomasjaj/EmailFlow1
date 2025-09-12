import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-blue-100",
}: StatsCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 text-sm mb-1">{title}</p>
            <p className="text-2xl font-semibold text-slate-900">{value}</p>
            {change && (
              <div className="flex items-center mt-2">
                {changeType === "positive" ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                ) : changeType === "negative" ? (
                  <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                ) : null}
                <span className={cn(
                  "text-sm font-medium",
                  changeType === "positive" && "text-green-600",
                  changeType === "negative" && "text-red-600",
                  changeType === "neutral" && "text-slate-600"
                )}>
                  {change}
                </span>
                <span className="text-slate-500 text-sm ml-1">from last month</span>
              </div>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBgColor)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
