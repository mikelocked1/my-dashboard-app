import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import HealthMetrics from "@/components/Dashboard/HealthMetrics";
import HeartRateChart from "@/components/Dashboard/HeartRateChart";
import AIHealthTips from "@/components/Dashboard/AIHealthTips";
import DoctorBooking from "@/components/Booking/DoctorBooking";
import DataUpload from "@/components/Health/DataUpload";
import SmartwatchIntegration from "@/components/Health/SmartwatchIntegration";
import ReportGenerator from "@/components/Reports/ReportGenerator";
import { t } from "@/lib/i18n";

const Dashboard: React.FC = () => {
  const [showAlert, setShowAlert] = React.useState(true);

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
