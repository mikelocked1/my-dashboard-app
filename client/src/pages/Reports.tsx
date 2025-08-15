import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  FileText, 
  Calendar, 
  Activity, 
  TrendingUp,
  Heart,
  Scale,
  Droplet,
  BarChart3
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import jsPDF from 'jspdf';

interface HealthData {
  id: number;
  type: string;
  value: string;
  unit: string;
  systolic: number | null;
  diastolic: number | null;
  timestamp: string;
  source: string;
  notes: string | null;
}

interface HealthAlert {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: string;
  createdAt: string;
}

const reportPeriods = [
  { value: "7", label: "Last 7 Days", days: 7 },
  { value: "30", label: "Last 30 Days", days: 30 },
  { value: "90", label: "Last 3 Months", days: 90 },
  { value: "current_month", label: "Current Month", isMonth: true },
  { value: "current_year", label: "Current Year", isYear: true }
];

const reportTypes = [
  { value: "comprehensive", label: "Comprehensive Health Report" },
  { value: "metrics_only", label: "Health Metrics Summary" },
  { value: "alerts_only", label: "Health Alerts Report" }
];

const ReportsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedReportType, setSelectedReportType] = useState("comprehensive");
  const [isGenerating, setIsGenerating] = useState(false);

  const getDateRange = () => {
    const now = new Date();
    const period = reportPeriods.find(p => p.value === selectedPeriod);
    
    if (!period) return { startDate: subDays(now, 30), endDate: now };
    
    if (period.isMonth) {
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
    
    if (period.isYear) {
      return { startDate: startOfYear(now), endDate: endOfYear(now) };
    }
    
    return { startDate: subDays(now, period.days), endDate: now };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch health data for the selected period
  const { data: healthData, isLoading: healthLoading } = useQuery<HealthData[]>({
    queryKey: ["/api/health-data", userProfile?.id, selectedPeriod],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      return apiRequest(`/api/health-data/${userProfile.id}?${params.toString()}`);
    },
    enabled: !!userProfile?.id,
  });

  // Fetch health alerts for the selected period
  const { data: healthAlerts, isLoading: alertsLoading } = useQuery<HealthAlert[]>({
    queryKey: ["/api/health-alerts", userProfile?.id, selectedPeriod],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      return apiRequest(`/api/health-alerts/${userProfile.id}?limit=50`);
    },
    enabled: !!userProfile?.id,
  });

  const getHealthSummary = () => {
    if (!healthData) return null;

    const summary = {
      totalReadings: healthData.length,
      metricsTypes: [...new Set(healthData.map(d => d.type))].length,
      averageByType: {} as Record<string, number>,
      latestByType: {} as Record<string, HealthData>
    };

    // Group by type
    const byType = healthData.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {} as Record<string, HealthData[]>);

    // Calculate averages and get latest for each type
    Object.entries(byType).forEach(([type, items]) => {
      const values = items.map(item => {
        if (type === "blood_pressure" && item.systolic) {
          return item.systolic;
        }
        return parseFloat(item.value);
      }).filter(val => !isNaN(val));

      if (values.length > 0) {
        summary.averageByType[type] = Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100;
      }

      // Get latest reading
      const sortedItems = items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      summary.latestByType[type] = sortedItems[0];
    });

    return summary;
  };

  const getAlertsSummary = () => {
    if (!healthAlerts) return null;

    const periodAlerts = healthAlerts.filter(alert => 
      new Date(alert.createdAt) >= startDate && new Date(alert.createdAt) <= endDate
    );

    const summary = {
      total: periodAlerts.length,
      byPriority: {
        critical: periodAlerts.filter(a => a.priority === 'critical').length,
        high: periodAlerts.filter(a => a.priority === 'high').length,
        medium: periodAlerts.filter(a => a.priority === 'medium').length,
        low: periodAlerts.filter(a => a.priority === 'low').length
      },
      recent: periodAlerts.slice(0, 5)
    };

    return summary;
  };

  const generatePDFReport = async () => {
    if (!userProfile || !healthData) return;

    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("SmartCare Health Report", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Report for: ${userProfile.name}`, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 8;
      doc.text(`Period: ${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 8;
      doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy 'at' h:mm a")}`, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 20;

      const summary = getHealthSummary();
      const alertsSummary = getAlertsSummary();

      if (selectedReportType === "comprehensive" || selectedReportType === "metrics_only") {
        // Health Metrics Summary
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Health Metrics Summary", 20, yPosition);
        yPosition += 15;

        if (summary) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          
          doc.text(`Total Readings: ${summary.totalReadings}`, 20, yPosition);
          yPosition += 6;
          doc.text(`Metrics Tracked: ${summary.metricsTypes}`, 20, yPosition);
          yPosition += 12;

          // Latest readings for each metric
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Latest Readings:", 20, yPosition);
          yPosition += 8;

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");

          Object.entries(summary.latestByType).forEach(([type, data]) => {
            const typeLabel = type.replace('_', ' ').split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            let valueText = `${data.value} ${data.unit}`;
            if (type === "blood_pressure" && data.systolic && data.diastolic) {
              valueText = `${data.systolic}/${data.diastolic} ${data.unit}`;
            }
            
            doc.text(`${typeLabel}: ${valueText} (${format(new Date(data.timestamp), "MMM dd, yyyy")})`, 25, yPosition);
            yPosition += 6;
          });

          yPosition += 10;

          // Averages
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Average Values:", 20, yPosition);
          yPosition += 8;

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");

          Object.entries(summary.averageByType).forEach(([type, avg]) => {
            const typeLabel = type.replace('_', ' ').split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            const unit = summary.latestByType[type]?.unit || "";
            doc.text(`${typeLabel}: ${avg} ${unit}`, 25, yPosition);
            yPosition += 6;
          });
        }

        yPosition += 15;
      }

      if (selectedReportType === "comprehensive" || selectedReportType === "alerts_only") {
        // Health Alerts Summary
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Health Alerts Summary", 20, yPosition);
        yPosition += 15;

        if (alertsSummary) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          
          doc.text(`Total Alerts: ${alertsSummary.total}`, 20, yPosition);
          yPosition += 6;
          doc.text(`Critical: ${alertsSummary.byPriority.critical}`, 25, yPosition);
          yPosition += 6;
          doc.text(`High Priority: ${alertsSummary.byPriority.high}`, 25, yPosition);
          yPosition += 6;
          doc.text(`Medium Priority: ${alertsSummary.byPriority.medium}`, 25, yPosition);
          yPosition += 6;
          doc.text(`Low Priority: ${alertsSummary.byPriority.low}`, 25, yPosition);
          yPosition += 12;

          if (alertsSummary.recent.length > 0) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Recent Alerts:", 20, yPosition);
            yPosition += 8;

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");

            alertsSummary.recent.forEach((alert) => {
              if (yPosition > 270) { // Start new page if needed
                doc.addPage();
                yPosition = 20;
              }
              
              doc.text(`• ${alert.title} (${alert.priority.toUpperCase()})`, 25, yPosition);
              yPosition += 5;
              
              // Wrap long messages
              const messageLines = doc.splitTextToSize(alert.message, 160);
              doc.text(messageLines, 30, yPosition);
              yPosition += messageLines.length * 4 + 2;
              
              doc.text(`Date: ${format(new Date(alert.createdAt), "MMM dd, yyyy")}`, 30, yPosition);
              yPosition += 8;
            });
          }
        }
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `SmartCare Health Report - Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      const filename = `smartcare-health-report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(filename);

      toast({
        title: "Report generated successfully",
        description: `Your health report has been downloaded as ${filename}`,
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error generating report",
        description: "Failed to generate PDF report. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const summary = getHealthSummary();
  const alertsSummary = getAlertsSummary();

  if (healthLoading || alertsLoading) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="reports-loading">
        <div className="space-y-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded w-full"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="reports-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Health Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate comprehensive reports of your health data and progress.
        </p>
      </div>

      {/* Report Configuration */}
      <Card className="mb-8" data-testid="report-config">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Generate Health Report</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="period">Report Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportPeriods.map(period => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Actions</Label>
              <Button 
                onClick={generatePDFReport}
                disabled={isGenerating || !healthData}
                className="w-full"
                data-testid="button-generate-report"
              >
                <Download className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating..." : "Download PDF"}
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Report Period:</strong> {format(startDate, "MMM dd, yyyy")} - {format(endDate, "MMM dd, yyyy")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <div className="space-y-6">
        {(selectedReportType === "comprehensive" || selectedReportType === "metrics_only") && (
          <Card data-testid="health-summary">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <span>Health Metrics Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{summary.totalReadings}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Readings</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{summary.metricsTypes}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Metrics Tracked</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {Object.keys(summary.latestByType).length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Active Metrics</div>
                      </CardContent>
                    </Card>
                  </div>

                  {Object.keys(summary.latestByType).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Latest Readings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(summary.latestByType).map(([type, data]) => {
                          const typeLabel = type.replace('_', ' ').split(' ').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ');
                          
                          let valueText = `${data.value} ${data.unit}`;
                          if (type === "blood_pressure" && data.systolic && data.diastolic) {
                            valueText = `${data.systolic}/${data.diastolic} ${data.unit}`;
                          }

                          return (
                            <Card key={type}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{typeLabel}</p>
                                    <p className="text-2xl font-bold text-primary">{valueText}</p>
                                    <p className="text-sm text-gray-500">
                                      {format(new Date(data.timestamp), "MMM dd, yyyy")}
                                    </p>
                                  </div>
                                  <div className="p-2 bg-primary/10 rounded-lg">
                                    {type === "heart_rate" && <Heart className="w-6 h-6 text-red-500" />}
                                    {type === "weight" && <Scale className="w-6 h-6 text-green-500" />}
                                    {type === "blood_sugar" && <Droplet className="w-6 h-6 text-yellow-500" />}
                                    {!["heart_rate", "weight", "blood_sugar"].includes(type) && <Activity className="w-6 h-6 text-blue-500" />}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No health data available for the selected period.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(selectedReportType === "comprehensive" || selectedReportType === "alerts_only") && (
          <Card data-testid="alerts-summary">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span>Health Alerts Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertsSummary ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{alertsSummary.byPriority.critical}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Critical</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{alertsSummary.byPriority.high}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">High</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{alertsSummary.byPriority.medium}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Medium</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{alertsSummary.byPriority.low}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Low</div>
                      </CardContent>
                    </Card>
                  </div>

                  {alertsSummary.recent.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Recent Alerts</h4>
                      <div className="space-y-3">
                        {alertsSummary.recent.map((alert) => (
                          <Card key={alert.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium">{alert.title}</h4>
                                    <Badge variant={alert.priority === 'critical' ? 'destructive' : 
                                      alert.priority === 'high' ? 'default' : 'secondary'}>
                                      {alert.priority}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {alert.message}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(alert.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No health alerts for the selected period.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;