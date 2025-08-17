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
        { name: "Admin Dashboard", href: "/", icon: Shield },
        { name: "Doctor Approvals", href: "/admin", icon: UserCheck },
        { name: "User Management", href: "/admin", icon: Users },
        { name: "Settings", href: "/settings", icon: Settings },
      ];
    }

    if (userProfile?.role === "doctor") {
      return [
        { name: "Doctor Dashboard", href: "/doctor-dashboard", icon: Stethoscope },
        { name: "Appointments", href: "/doctor-dashboard", icon: Calendar },
        { name: "Patient Management", href: "/doctor-dashboard", icon: Users },
        { name: "Profile", href: "/doctor-dashboard", icon: User },
        { name: "Settings", href: "/settings", icon: Settings },
      ];
    }

    // Default patient navigation
    return [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Health Data", href: "/health-data", icon: Activity },
      { name: "Analytics", href: "/analytics", icon: TrendingUp },
      { name: "Book Appointment", href: "/appointments", icon: Calendar },
      { name: "Reports", href: "/reports", icon: FileText },
      { name: "Settings", href: "/settings", icon: Settings },
    ];
  };

  const navigationItems = getNavigationByRole();

  const filteredNavigation = navigationItems.filter(item => {
    // Admin specific routes
    if (item.href === "/admin" && userProfile?.role !== "admin") return false;
    // Doctor specific routes
    if (item.href === "/doctor-dashboard" && userProfile?.role !== "doctor") return false;
    // Patient specific routes
    if (item.href === "/dashboard" && userProfile?.role !== "user" && userProfile?.role !== undefined) return false;
    if (item.href === "/health-data" && userProfile?.role !== "user" && userProfile?.role !== undefined) return false;
    if (item.href === "/analytics" && userProfile?.role !== "user" && userProfile?.role !== undefined) return false;
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