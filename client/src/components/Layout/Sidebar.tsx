import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Calendar, 
  Users, 
  FileText, 
  Settings,
  Activity,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { userProfile } = useAuth();

  const navigationItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: t("nav.dashboard"),
      roles: ["user", "doctor", "admin"]
    },
    {
      href: "/health-analytics",
      icon: TrendingUp,
      label: t("nav.health_analytics"),
      roles: ["user", "doctor", "admin"]
    },
    {
      href: "/health-data-entry",
      icon: Activity,
      label: "Health Data Entry",
      roles: ["user", "doctor", "admin"]
    },
    {
      href: "/appointments",
      icon: Calendar,
      label: t("nav.appointments"),
      roles: ["user", "doctor", "admin"]
    },
    {
      href: "/patients",
      icon: Users,
      label: t("nav.patients"),
      roles: ["doctor", "admin"]
    },
    {
      href: "/reports",
      icon: FileText,
      label: t("nav.reports"),
      roles: ["user", "doctor", "admin"]
    },
    {
      href: "/admin",
      icon: Shield,
      label: "Admin Panel",
      roles: ["admin"]
    },
    {
      href: "/settings",
      icon: Settings,
      label: t("nav.settings"),
      roles: ["user", "doctor", "admin"]
    },
  ];

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(userProfile?.role || "user")
  );

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm h-screen sticky top-16 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? "text-gray-700 dark:text-gray-300 bg-primary/10 border-r-4 border-primary" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
        
        {/* Quick Stats Card */}
        <div className="mt-8 bg-gradient-to-br from-secondary to-teal-600 rounded-xl p-4 text-white">
          <h3 className="font-display font-semibold mb-2">{t("dashboard.today_overview")}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t("dashboard.active_patients")}</span>
              <span className="font-semibold">24</span>
            </div>
            <div className="flex justify-between">
              <span>{t("dashboard.appointments")}</span>
              <span className="font-semibold">8</span>
            </div>
            <div className="flex justify-between">
              <span>{t("dashboard.alerts")}</span>
              <span className="font-semibold text-yellow-300">3</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
