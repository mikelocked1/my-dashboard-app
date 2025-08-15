import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Thermometer, Scale, Footprints, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { classifyHeartRate, classifyBloodPressure } from "@/utils/healthClassification";
import { t } from "@/lib/i18n";

const HealthMetrics: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  
  const { data: heartRateData } = useQuery({
    queryKey: ["/api/health-data", userProfile?.id, "heart_rate"],
    queryFn: () => apiRequest(`/api/health-data/${userProfile?.id}?type=heart_rate`),
    enabled: !!userProfile?.id,
  });

  const { data: bloodPressureData } = useQuery({
    queryKey: ["/api/health-data", userProfile?.id, "blood_pressure"],
    queryFn: () => apiRequest(`/api/health-data/${userProfile?.id}?type=blood_pressure`),
    enabled: !!userProfile?.id,
  });

  const { data: temperatureData } = useQuery({
    queryKey: ["/api/health-data", userProfile?.id, "temperature"],
    queryFn: () => apiRequest(`/api/health-data/${userProfile?.id}?type=temperature`),
    enabled: !!userProfile?.id,
  });

  const { data: stepsData } = useQuery({
    queryKey: ["/api/health-data", userProfile?.id, "steps"],
    queryFn: () => apiRequest(`/api/health-data/${userProfile?.id}?type=steps`),
    enabled: !!userProfile?.id,
  });

  const getLatestValue = (data: any[]) => {
    return data && data.length > 0 ? data[0] : null;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-3 h-3 text-success" />;
    if (current < previous) return <TrendingDown className="w-3 h-3 text-accent" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const latestHeartRate = getLatestValue(heartRateData || []);
  const latestBloodPressure = getLatestValue(bloodPressureData || []);
  const latestTemperature = getLatestValue(temperatureData || []);
  const latestSteps = getLatestValue(stepsData || []);

  const metrics = [
    {
      icon: Heart,
      title: t("metrics.heart_rate"),
      value: latestHeartRate?.value || "72",
      unit: "BPM",
      status: latestHeartRate ? classifyHeartRate(parseInt(latestHeartRate.value)) : "normal",
      change: "+2%",
      trend: "up",
      bgColor: "bg-primary/10",
      iconColor: "text-primary"
    },
    {
      icon: Thermometer,
      title: t("metrics.temperature"),
      value: latestTemperature?.value || "36.5",
      unit: "°C",
      status: "normal",
      change: "No change",
      trend: "stable",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600"
    },
    {
      icon: Scale,
      title: t("metrics.blood_pressure"),
      value: latestBloodPressure?.value || "120/80",
      unit: "",
      status: latestBloodPressure ? classifyBloodPressure(latestBloodPressure.value) : "normal",
      change: "+8%",
      trend: "up",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600"
    },
    {
      icon: Footprints,
      title: t("metrics.steps"),
      value: latestSteps?.value || "8,547",
      unit: "",
      status: "good",
      change: "Goal: 10,000 steps",
      trend: "up",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <Card key={index} className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${metric.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`${metric.iconColor} text-xl w-6 h-6`} />
                </div>
                <Badge variant={
                  metric.status === "normal" || metric.status === "good" ? "default" : 
                  metric.status === "high" ? "destructive" : "secondary"
                } className="text-xs">
                  {metric.status === "normal" ? t("metrics.normal") :
                   metric.status === "high" ? t("metrics.high") : 
                   metric.status === "good" ? t("metrics.good") : metric.status}
                </Badge>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {metric.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {metric.value} {metric.unit}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                {metric.trend === "up" && <TrendingUp className="w-3 h-3 text-success mr-1" />}
                {metric.trend === "down" && <TrendingDown className="w-3 h-3 text-accent mr-1" />}
                {metric.trend === "stable" && <Minus className="w-3 h-3 text-gray-400 mr-1" />}
                {metric.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default HealthMetrics;
