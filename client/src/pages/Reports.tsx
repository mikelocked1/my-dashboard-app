import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar, TrendingUp, Activity, Heart, Filter } from "lucide-react";
import { t } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import ReportGenerator from "@/components/Reports/ReportGenerator";

const Reports: React.FC = () => {
  const { userProfile } = useAuth();
  const [selectedDateRange, setSelectedDateRange] = useState("last30");
  const [selectedMetric, setSelectedMetric] = useState("all");

  const reportHistory = [
    {
      id: "1",
      name: "Monthly Health Summary - July 2025",
      type: "health_summary",
      dateGenerated: "2025-07-31",
      dateRange: "July 1-31, 2025",
      format: "PDF",
      size: "2.4 MB"
    },
    {
      id: "2",
      name: "Heart Rate Analysis - Q2 2025",
      type: "heart_rate",
      dateGenerated: "2025-06-30",
      dateRange: "April-June 2025",
      format: "PDF",
      size: "1.8 MB"
    },
    {
      id: "3",
      name: "Blood Pressure Trends - June 2025",
      type: "blood_pressure",
      dateGenerated: "2025-06-30",
      dateRange: "June 1-30, 2025",
      format: "PDF",
      size: "1.2 MB"
    }
  ];

  const healthStats = [
    {
      title: "Total Reports Generated",
      value: "12",
      icon: FileText,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
    },
    {
      title: "Data Points Analyzed",
      value: "2,847",
      icon: TrendingUp,
      color: "bg-green-100 dark:bg-green-900/30 text-green-600"
    },
    {
      title: "Health Metrics Tracked",
      value: "8",
      icon: Activity,
      color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600"
    },
    {
      title: "Average Health Score",
      value: "85%",
      icon: Heart,
      color: "bg-red-100 dark:bg-red-900/30 text-red-600"
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "health_summary": return "default";
      case "heart_rate": return "secondary";
      case "blood_pressure": return "outline";
      default: return "default";
    }
  };

  return (
    <main className="flex-1 p-6" data-testid="reports-page">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2" data-testid="page-title">
          {t("nav.reports")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400" data-testid="page-subtitle">
          Generate and view detailed health reports and analytics
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {healthStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={`stat-card-${stat.title.toLowerCase().replace(/ /g, '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generate New Report */}
      <Card className="mb-8" data-testid="generate-report-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Generate New Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReportGenerator />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-8" data-testid="report-filters-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7">Last 7 days</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="last6months">Last 6 months</SelectItem>
                  <SelectItem value="lastyear">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metric-type">Metric Type</Label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger data-testid="select-metric-type">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Metrics</SelectItem>
                  <SelectItem value="heart_rate">Heart Rate</SelectItem>
                  <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                  <SelectItem value="steps">Daily Steps</SelectItem>
                  <SelectItem value="sleep">Sleep</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button className="w-full" data-testid="button-apply-filters">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report History */}
      <Card data-testid="report-history-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Report History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportHistory.length === 0 ? (
              <div className="text-center py-12" data-testid="no-reports-message">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  No reports generated yet
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                  Generate your first health report to get started
                </p>
              </div>
            ) : (
              reportHistory.map((report) => (
                <div 
                  key={report.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  data-testid={`report-item-${report.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white" data-testid={`report-name-${report.id}`}>
                        {report.name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400" data-testid={`report-date-range-${report.id}`}>
                          {report.dateRange}
                        </span>
                        <Badge variant={getTypeColor(report.type)} data-testid={`report-type-badge-${report.id}`}>
                          {report.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-400">
                          Generated: {report.dateGenerated}
                        </span>
                        <span className="text-xs text-gray-400">
                          Size: {report.size}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" data-testid={`button-view-${report.id}`}>
                      View
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-download-${report.id}`}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="mt-8" data-testid="export-options-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Export Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="p-6 h-auto flex flex-col items-center space-y-2" data-testid="button-export-csv">
              <FileText className="w-8 h-8 text-gray-600" />
              <span>Export as CSV</span>
              <span className="text-xs text-gray-500">Raw data format</span>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex flex-col items-center space-y-2" data-testid="button-export-pdf">
              <FileText className="w-8 h-8 text-red-600" />
              <span>Export as PDF</span>
              <span className="text-xs text-gray-500">Formatted report</span>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex flex-col items-center space-y-2" data-testid="button-share-doctor">
              <Download className="w-8 h-8 text-blue-600" />
              <span>Share with Doctor</span>
              <span className="text-xs text-gray-500">Secure sharing</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Reports;