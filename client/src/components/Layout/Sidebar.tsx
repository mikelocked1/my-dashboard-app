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

  // Dynamic navigation items based on user role
  const getNavigationItems = () => {
    const role = userProfile?.role || "user";
    
    const baseItems = [
      {
        href: "/settings",
        icon: Settings,
        label: t("nav.settings"),
        roles: ["user", "doctor", "admin"]
      },
    ];

    if (role === "doctor") {
      return [
        {
          href: "/doctor-dashboard",
          icon: LayoutDashboard,
          label: "Doctor Dashboard",
          roles: ["doctor"]
        },
        {
          href: "/appointments",
          icon: Calendar,
          label: "My Appointments",
          roles: ["doctor"]
        },
        {
          href: "/patients",
          icon: Users,
          label: "My Patients",
          roles: ["doctor"]
        },
        {
          href: "/reports",
          icon: FileText,
          label: "Patient Reports",
          roles: ["doctor"]
        },
        ...baseItems
      ];
    } else if (role === "admin") {
      return [
        {
          href: "/admin",
          icon: Shield,
          label: "Admin Panel",
          roles: ["admin"]
        },
        {
          href: "/dashboard",
          icon: LayoutDashboard,
          label: t("nav.dashboard"),
          roles: ["admin"]
        },
        {
          href: "/appointments",
          icon: Calendar,
          label: t("nav.appointments"),
          roles: ["admin"]
        },
        {
          href: "/reports",
          icon: FileText,
          label: t("nav.reports"),
          roles: ["admin"]
        },
        ...baseItems
      ];
    } else {
      // Patient/user navigation
      return [
        {
          href: "/dashboard",
          icon: LayoutDashboard,
          label: t("nav.dashboard"),
          roles: ["user"]
        },
        {
          href: "/health-analytics",
          icon: TrendingUp,
          label: t("nav.health_analytics"),
          roles: ["user"]
        },
        {
          href: "/health-data-entry",
          icon: Activity,
          label: "Health Data Entry",
          roles: ["user"]
        },
        {
          href: "/appointments",
          icon: Calendar,
          label: t("nav.appointments"),
          roles: ["user"]
        },
        {
          href: "/reports",
          icon: FileText,
          label: t("nav.reports"),
          roles: ["user"]
        },
        ...baseItems
      ];
    }
  };

  const navigationItems = getNavigationItems();

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
