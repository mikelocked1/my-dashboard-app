import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import Chart from "chart.js/auto";

const HeartRateChart: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const { currentUser, userProfile } = useAuth();

  const { data: heartRateData, isLoading } = useQuery({
    queryKey: ["/api/health-data", userProfile?.id, "heart_rate"],
    queryFn: () => apiRequest(`/api/health-data/${userProfile?.id}?type=heart_rate`),
    enabled: !!userProfile?.id,
  });

  useEffect(() => {
    if (!chartRef.current || !heartRateData || isLoading) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Process data for last 7 days
    const last7Days = heartRateData.slice(0, 7).reverse();
    const labels = last7Days.map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return date.toLocaleDateString("en-US", { weekday: "short" });
    });
    
    const values = last7Days.map(item => parseInt(item.value));
    
    // Sample data if no real data available
    const sampleData = [72, 68, 75, 105, 62, 78, 71];
    const chartData = values.length > 0 ? values : sampleData;

    const data = {
      labels,
      datasets: [{
        label: 'Heart Rate (BPM)',
        data: chartData,
        borderColor: '#D97706',
        backgroundColor: function(context: any) {
          const value = context.parsed?.y || context.raw;
          if (value && (value < 60 || value > 100)) {
            return 'rgba(220, 38, 38, 0.1)'; // Red for bad readings
          }
          return 'rgba(5, 150, 105, 0.1)'; // Green for good readings
        },
        pointBackgroundColor: function(context: any) {
          const value = context.parsed?.y || context.raw;
          if (value && (value < 60 || value > 100)) {
            return '#DC2626'; // Red for bad readings
          }
          return '#059669'; // Green for good readings
        },
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        fill: true,
        tension: 0.4
      }]
    };

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 50,
            max: 120,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280'
            }
          },
          x: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280'
            }
          }
        },
        elements: {
          point: {
            hoverRadius: 8
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [heartRateData, isLoading]);

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display font-semibold text-gray-900 dark:text-white">
            Heart Rate Trends
          </CardTitle>
          <div className="flex space-x-2">
            <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
              Good: 60-100 BPM
            </Badge>
            <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
              Alert: &lt;60 or &gt;100
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <canvas ref={chartRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
};

export default HeartRateChart;
