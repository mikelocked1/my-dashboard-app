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
  Shield,
  UserCheck,
  Stethoscope,
  User,
  Home
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { userProfile } = useAuth();

  // Role-based navigation
  const getNavigationByRole = () => {
    if (userProfile?.role === "admin") {
      return [
        { name: "Admin Dashboard", href: "/admin", icon: Shield, key: "admin-dashboard" },
        { name: "Doctor Approvals", href: "/admin?tab=pending", icon: UserCheck, key: "doctor-approvals" },
        { name: "User Management", href: "/admin?tab=users", icon: Users, key: "user-management" },
        { name: "Settings", href: "/settings", icon: Settings, key: "admin-settings" },
      ];
    }

    if (userProfile?.role === "doctor") {
      return [
        { name: "Doctor Dashboard", href: "/doctor-dashboard", icon: Stethoscope, key: "doctor-dashboard" },
        { name: "Appointments", href: "/doctor-dashboard?tab=appointments", icon: Calendar, key: "doctor-appointments" },
        { name: "Patient Management", href: "/doctor-dashboard?tab=patients", icon: Users, key: "patient-management" },
        { name: "Profile", href: "/doctor-dashboard?tab=profile", icon: User, key: "doctor-profile" },
        { name: "Settings", href: "/settings", icon: Settings, key: "doctor-settings" },
      ];
    }

    // Default patient navigation
    return [
      { name: "Dashboard", href: "/dashboard", icon: Home, key: "patient-dashboard" },
      { name: "Health Data Entry", href: "/health-data-entry", icon: Activity, key: "health-data" },
      { name: "Analytics", href: "/health-analytics", icon: TrendingUp, key: "analytics" },
      { name: "Book Appointment", href: "/appointments", icon: Calendar, key: "appointments" },
      { name: "Reports", href: "/reports", icon: FileText, key: "reports" },
      { name: "Settings", href: "/settings", icon: Settings, key: "patient-settings" },
    ];
  };

  const navigationItems = getNavigationByRole();

  const filteredNavigation = navigationItems.filter(item => {
    // Admin specific routes
    if (item.href.startsWith("/admin") && userProfile?.role !== "admin") return false;
    // Doctor specific routes
    if (item.href.startsWith("/doctor-dashboard") && userProfile?.role !== "doctor") return false;
    // Patient specific routes
    if (item.href === "/dashboard" && userProfile?.role !== "user" && userProfile?.role !== undefined) return false;
    if (item.href === "/health-data-entry" && userProfile?.role !== "user" && userProfile?.role !== undefined) return false;
    if (item.href === "/health-analytics" && userProfile?.role !== "user" && userProfile?.role !== undefined) return false;
    if (item.href === "/appointments" && userProfile?.role !== "user" && userProfile?.role !== undefined) return false;
    if (item.href === "/reports" && userProfile?.role !== "user" && userProfile?.role !== undefined) return false;

    return true;
  });


  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm h-screen sticky top-16 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            // Check if current location matches the item href (including query parameters)
            const isActive = location === item.href || 
                            (item.href.includes('?') && location.startsWith(item.href.split('?')[0]) && location.includes(item.href.split('?')[1]));

            return (
              <Link key={item.key} href={item.href}>
                <div className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? "text-gray-700 dark:text-gray-300 bg-primary/10 border-r-4 border-primary" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
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