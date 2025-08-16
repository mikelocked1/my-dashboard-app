import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, X, Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import HealthMetrics from "@/components/Dashboard/HealthMetrics";
import HeartRateChart from "@/components/Dashboard/HeartRateChart";
import AIHealthTips from "@/components/Dashboard/AIHealthTips";
import DoctorBooking from "@/components/Booking/DoctorBooking";
import DataUpload from "@/components/Health/DataUpload";
import SmartwatchIntegration from "@/components/Health/SmartwatchIntegration";
import ReportGenerator from "@/components/Reports/ReportGenerator";
import { t } from "@/lib/i18n";
import { format } from "date-fns";

const Dashboard: React.FC = () => {
  const [showAlert, setShowAlert] = React.useState(true);
  const { userProfile } = useAuth();

  // Fetch upcoming appointments
  const { data: appointments } = useQuery({
    queryKey: [`/api/appointments/upcoming/${userProfile?.id}`],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      return apiRequest(`/api/appointments/upcoming/${userProfile.id}`);
    },
    enabled: !!userProfile?.id,
  });

  return (
    <main className="flex-1 p-6">
      {/* Alert Banner */}
      {showAlert && (
        <Alert className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-accent">
          <AlertTriangle className="h-4 w-4 text-accent" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                High Blood Pressure Alert
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Recent readings show elevation above normal range. Consider consulting your doctor.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAlert(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
          {t("dashboard.title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {/* Health Metrics Grid */}
      <div className="mb-8">
        <HealthMetrics />
      </div>

      {/* Charts and Data Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <HeartRateChart />
        <AIHealthTips />
      </div>

      {/* Upcoming Appointments Section */}
      {appointments && appointments.length > 0 && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments.slice(0, 3).map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {appointment.doctor?.user?.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {appointment.doctor?.specialty}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {format(new Date(appointment.appointmentDate), "MMM dd, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-2">
                        {appointment.status}
                      </Badge>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        GHS {appointment.consultationFee}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Doctor Booking Component */}
      <div className="mb-8">
        <DoctorBooking />
      </div>

      {/* Data Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataUpload />
        <SmartwatchIntegration />
      </div>

      {/* Reports and Sharing */}
      <div className="mb-8">
        <ReportGenerator />
      </div>
    </main>
  );
};

export default Dashboard;
