import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Heart } from "lucide-react";
import { t } from "@/lib/i18n";
import HeartRateChart from "@/components/Dashboard/HeartRateChart";
import { useAuth } from "@/contexts/AuthContext";

const HealthAnalytics: React.FC = () => {
  const { userProfile } = useAuth();

  const healthTrends = [
    {
      metric: "Heart Rate",
      current: "72 bpm",
      trend: "up",
      change: "+2 bpm",
      status: "normal",
      icon: Heart
    },
    {
      metric: "Blood Pressure",
      current: "120/80",
      trend: "down", 
      change: "-5 mmHg",
      status: "good",
      icon: Activity
    },
    {
      metric: "Steps",
      current: "8,432",
      trend: "up",
      change: "+1,200",
      status: "good", 
      icon: TrendingUp
    }
  ];

  return (
    <main className="flex-1 p-6" data-testid="health-analytics-page">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2" data-testid="page-title">
          {t("nav.health_analytics")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400" data-testid="page-subtitle">
          Track your health metrics and analyze trends over time
        </p>
      </div>

      {/* Health Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {healthTrends.map((item) => {
          const Icon = item.icon;
          const TrendIcon = item.trend === "up" ? TrendingUp : TrendingDown;
          
          return (
            <Card key={item.metric} data-testid={`metric-card-${item.metric.toLowerCase().replace(' ', '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {item.metric}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {item.current}
                </div>
                <div className="flex items-center space-x-2">
                  <TrendIcon 
                    className={`h-4 w-4 ${item.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} 
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.change}
                  </span>
                  <Badge 
                    variant={item.status === 'good' ? 'default' : 'secondary'}
                    data-testid={`status-badge-${item.metric.toLowerCase().replace(' ', '-')}`}
                  >
                    {item.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <HeartRateChart />
        
        <Card data-testid="weekly-summary-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Average Heart Rate</span>
                <span className="font-medium">74 bpm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Steps</span>
                <span className="font-medium">52,840</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Active Days</span>
                <span className="font-medium">6/7</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Health Score</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30">
                  Excellent
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Goals */}
      <Card data-testid="health-goals-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Health Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Steps Goal</span>
                <span>8,432 / 10,000</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '84%'}}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weekly Exercise Goal</span>
                <span>4 / 5 sessions</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '80%'}}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default HealthAnalytics;