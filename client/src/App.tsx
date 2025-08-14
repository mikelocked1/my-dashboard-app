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
import DoctorPortal from "@/pages/DoctorPortal";
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

function Router() {
  const { currentUser } = useAuth();
  
  return (
    <Switch>
      <Route path="/login">
        {currentUser ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/health-analytics">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/appointments">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
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
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/">
        {currentUser ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
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
