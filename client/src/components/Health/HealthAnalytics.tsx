import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar,
  BarChart3,
  Download,
  Eye,
  Filter,
  Trash2
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HealthData {
  id: number;
  userId: number;
  type: string;
  value: string;
  unit: string;
  systolic: number | null;
  diastolic: number | null;
  timestamp: string;
  source: string;
  notes: string | null;
  createdAt: string;
}

interface HealthAlert {
  id: number;
  userId: number;
  healthDataId: number | null;
  type: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

const healthMetricTypes = [
  { value: "all", label: "All Metrics", color: "blue" },
  { value: "heart_rate", label: "Heart Rate", color: "red" },
  { value: "blood_pressure", label: "Blood Pressure", color: "blue" },
  { value: "weight", label: "Weight", color: "green" },
  { value: "blood_sugar", label: "Blood Sugar", color: "yellow" },
  { value: "steps", label: "Daily Steps", color: "purple" },
  { value: "sleep", label: "Sleep Duration", color: "indigo" },
  { value: "temperature", label: "Body Temperature", color: "orange" }
];

const timePeriods = [
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 3 Months" },
  { value: "365", label: "Last Year" }
];

const HealthAnalytics: React.FC = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [showDetails, setShowDetails] = useState(false);

  // Fetch health data
  const { data: healthData, isLoading: healthLoading } = useQuery<HealthData[]>({
    queryKey: ["/api/health-data", userProfile?.id, selectedMetric, selectedPeriod],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      const startDate = subDays(new Date(), parseInt(selectedPeriod));
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      });
      
      if (selectedMetric !== "all") {
        params.set("type", selectedMetric);
      }
      
      return apiRequest(`/api/health-data/${userProfile.id}?${params.toString()}`);
    },
    enabled: !!userProfile?.id,
  });

  // Fetch health alerts
  const { data: healthAlerts, isLoading: alertsLoading } = useQuery<HealthAlert[]>({
    queryKey: ["/api/health-alerts", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      return apiRequest(`/api/health-alerts/${userProfile.id}?limit=10`);
    },
    enabled: !!userProfile?.id,
  });

  const getMetricStats = (type: string) => {
    if (!healthData) return null;
    
    const typeData = healthData.filter(item => item.type === type);
    if (typeData.length === 0) return null;
    
    const values = typeData.map(item => {
      if (type === "blood_pressure") {
        return item.systolic || 0;
      }
      return parseFloat(item.value);
    }).filter(val => !isNaN(val));
    
    if (values.length === 0) return null;
    
    const latest = values[0];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Determine trend (comparing latest vs average)
    const trend = latest > average ? "up" : latest < average ? "down" : "stable";
    
    return {
      latest,
      average: Math.round(average * 100) / 100,
      min,
      max,
      count: values.length,
      trend
    };
  };

  const generateChartData = (type: string) => {
    if (!healthData) return null;
    
    const typeData = healthData
      .filter(item => item.type === type)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (typeData.length === 0) return null;
    
    const labels = typeData.map(item => format(new Date(item.timestamp), "MMM dd"));
    const values = typeData.map(item => {
      if (type === "blood_pressure" && item.systolic) {
        return item.systolic;
      }
      return parseFloat(item.value);
    });
    
    const diastolicValues = type === "blood_pressure" 
      ? typeData.map(item => item.diastolic || 0)
      : null;
    
    const datasets = [
      {
        label: type === "blood_pressure" ? "Systolic" : healthMetricTypes.find(m => m.value === type)?.label || type,
        data: values,
        borderColor: `rgb(${type === "heart_rate" ? "239, 68, 68" : 
          type === "blood_pressure" ? "59, 130, 246" :
          type === "weight" ? "34, 197, 94" :
          type === "blood_sugar" ? "234, 179, 8" :
          "168, 85, 247"})`,
        backgroundColor: `rgba(${type === "heart_rate" ? "239, 68, 68" : 
          type === "blood_pressure" ? "59, 130, 246" :
          type === "weight" ? "34, 197, 94" :
          type === "blood_sugar" ? "234, 179, 8" :
          "168, 85, 247"}, 0.1)`,
        fill: true,
        tension: 0.4,
      }
    ];
    
    if (diastolicValues) {
      datasets.push({
        label: "Diastolic",
        data: diastolicValues,
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      });
    }
    
    return {
      labels,
      datasets
    };
  };

  const priorityColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  };

  if (healthLoading || alertsLoading) {
    return (
      <div className="space-y-6" data-testid="health-analytics-loading">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="health-analytics">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-48" data-testid="select-metric">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {healthMetricTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timePeriods.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setShowDetails(!showDetails)}
          data-testid="toggle-details"
        >
          <Eye className="w-4 h-4 mr-2" />
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>
      </div>

      {/* Health Alerts */}
      {healthAlerts && healthAlerts.length > 0 && (
        <Card data-testid="health-alerts-section">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Recent Health Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthAlerts.slice(0, 3).map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-3 rounded-lg border ${alert.isRead ? 'opacity-60' : ''}`}
                  data-testid={`health-alert-${alert.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge className={priorityColors[alert.priority as keyof typeof priorityColors]}>
                          {alert.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(alert.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {selectedMetric !== "all" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="metric-stats">
          {(() => {
            const stats = getMetricStats(selectedMetric);
            if (!stats) {
              return (
                <Card className="md:col-span-4">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No data available for the selected metric and time period.</p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Latest</p>
                        <p className="text-2xl font-bold" data-testid="latest-value">
                          {stats.latest}
                        </p>
                      </div>
                      <Heart className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
                        <p className="text-2xl font-bold" data-testid="average-value">
                          {stats.average}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Range</p>
                        <p className="text-2xl font-bold" data-testid="range-value">
                          {stats.min} - {stats.max}
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Trend</p>
                        <div className="flex items-center space-x-1">
                          {stats.trend === "up" ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : stats.trend === "down" ? (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          ) : (
                            <Activity className="w-5 h-5 text-gray-500" />
                          )}
                          <span className="text-lg font-bold capitalize" data-testid="trend-value">
                            {stats.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>
      )}

      {/* Charts */}
      {selectedMetric !== "all" && (
        <Card data-testid="health-chart">
          <CardHeader>
            <CardTitle>
              {healthMetricTypes.find(m => m.value === selectedMetric)?.label} Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const chartData = generateChartData(selectedMetric);
              if (!chartData) {
                return (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No chart data available for the selected period.</p>
                  </div>
                );
              }

              return (
                <div className="h-80">
                  <Line 
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: selectedMetric === "steps",
                        },
                      },
                    }}
                  />
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Detailed Data Table */}
      {showDetails && healthData && healthData.length > 0 && (
        <Card data-testid="detailed-data-table">
          <CardHeader>
            <CardTitle>Detailed Health Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Value</th>
                    <th className="text-left p-2">Source</th>
                    <th className="text-left p-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {healthData.slice(0, 20).map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`health-record-${item.id}`}>
                      <td className="p-2">
                        {format(new Date(item.timestamp), "MMM dd, yyyy HH:mm")}
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">
                          {healthMetricTypes.find(m => m.value === item.type)?.label || item.type}
                        </Badge>
                      </td>
                      <td className="p-2 font-medium">
                        {item.value} {item.unit}
                      </td>
                      <td className="p-2">
                        <Badge variant="secondary">{item.source}</Badge>
                      </td>
                      <td className="p-2 text-gray-600 dark:text-gray-400 truncate max-w-xs">
                        {item.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthAnalytics;