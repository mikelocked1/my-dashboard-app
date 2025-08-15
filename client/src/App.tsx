import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DoctorDashboard from "@/pages/DoctorDashboard";
import HealthAnalytics from "@/pages/HealthAnalytics";
import HealthDataEntry from "@/pages/HealthDataEntry";
import Appointments from "@/pages/Appointments";
import Reports from "@/pages/Reports";
import DoctorPortal from "@/pages/DoctorPortal";
import Settings from "@/pages/Settings";
import AdminPanel from "@/pages/AdminPanel";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse space-y-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-600 rounded-xl mx-auto"></div>
          <div className="text-center text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Redirect to="/login" />;
  }
  
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      <div className="flex">
        <Sidebar />
        {children}
      </div>
    </div>
  );
}

// Helper function to get dashboard route based on user role
function getDashboardRoute(userProfile: any) {
  if (!userProfile) return "/dashboard";
  
  switch (userProfile.role) {
    case "doctor":
      return "/doctor-dashboard";
    case "admin":
      return "/admin";
    case "user":
    default:
      return "/dashboard";
  }
}

function Router() {
  const { currentUser, userProfile } = useAuth();
  
  return (
    <Switch>
      <Route path="/login">
        {currentUser ? <Redirect to={getDashboardRoute(userProfile)} /> : <Login />}
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/doctor-dashboard">
        <ProtectedRoute>
          <AppLayout>
            <DoctorDashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/health-analytics">
        <ProtectedRoute>
          <AppLayout>
            <HealthAnalytics />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/health-data-entry">
        <ProtectedRoute>
          <AppLayout>
            <HealthDataEntry />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/appointments">
        <ProtectedRoute>
          <AppLayout>
            <Appointments />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/patients">
        <ProtectedRoute>
          <AppLayout>
            <DoctorPortal />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute>
          <AppLayout>
            <Reports />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute>
          <AppLayout>
            <Settings />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute>
          <AppLayout>
            <AdminPanel />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/">
        {currentUser ? <Redirect to={getDashboardRoute(userProfile)} /> : <Redirect to="/login" />}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
