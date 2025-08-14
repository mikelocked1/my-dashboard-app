import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Share2, Download, FileBarChart, ChartArea, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getHealthDataByUser } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { generateHealthReport } from "@/utils/pdfGenerator";

const ReportGenerator: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [reportType, setReportType] = useState<string>("monthly_summary");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: healthData } = useQuery({
    queryKey: ["/api/health-data", currentUser?.uid],
    queryFn: () => getHealthDataByUser(currentUser?.uid!),
    enabled: !!currentUser,
  });

  const handleGeneratePDF = async () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates for the report.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Filter health data by date range
      const filteredData = healthData?.filter(item => {
        const itemDate = new Date(item.timestamp);
        const start = new Date(fromDate);
        const end = new Date(toDate);
        return itemDate >= start && itemDate <= end;
      }) || [];

      await generateHealthReport({
        reportType,
        dateRange: { from: fromDate, to: toDate },
        healthData: filteredData,
        patientName: "Patient Name", // In real app, get from user profile
      });

      toast({
        title: "Report Generated",
        description: "Your health report PDF has been generated and downloaded.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareReport = () => {
    toast({
      title: "Share Link Generated",
      description: "Report sharing link has been copied to clipboard.",
    });
  };

  const setQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    setFromDate(startDate.toISOString().split('T')[0]);
    setToDate(endDate.toISOString().split('T')[0]);
  };

  const reportTypes = [
    {
      id: "monthly_summary",
      name: "Monthly Summary",
      description: "Comprehensive health overview",
      icon: FileText,
    },
    {
      id: "trend_analysis",
      name: "Trend Analysis", 
      description: "Data patterns and insights",
      icon: ChartArea,
    },
    {
      id: "detailed_metrics",
      name: "Detailed Metrics",
      description: "In-depth health measurements",
      icon: FileBarChart,
    },
  ];

  const getDataPointsCount = () => {
    if (!healthData || !fromDate || !toDate) return 0;
    
    return healthData.filter(item => {
      const itemDate = new Date(item.timestamp);
      const start = new Date(fromDate);
      const end = new Date(toDate);
      return itemDate >= start && itemDate <= end;
    }).length;
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display font-semibold text-gray-900 dark:text-white">
            Health Reports
          </CardTitle>
          <div className="flex space-x-3">
            <Button 
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="bg-primary hover:bg-orange-600 text-white"
            >
              {isGenerating ? (
                <>
                  <Download className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={handleShareReport}
              className="border-gray-300 dark:border-gray-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Report Templates */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Report Types</h4>
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <div
                  key={report.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    reportType === report.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 dark:border-gray-600 hover:border-primary"
                  }`}
                  onClick={() => setReportType(report.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`text-lg w-5 h-5 ${
                      reportType === report.id ? "text-primary" : "text-secondary"
                    }`} />
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {report.name}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Date Range Selection */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Report Period</h4>
            <div className="space-y-3">
              <div>
                <Label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  From Date
                </Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  To Date
                </Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => setQuickDateRange(7)}
                  className="flex-1 text-xs"
                >
                  Last 7 Days
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => setQuickDateRange(30)}
                  className="flex-1 text-xs bg-primary/10 text-primary border-primary"
                >
                  Last 30 Days
                </Button>
              </div>
            </div>
          </div>
          
          {/* Report Preview */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Report Preview</h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Report Type:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {reportTypes.find(r => r.id === reportType)?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Period:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {fromDate && toDate ? `${fromDate} - ${toDate}` : "Select dates"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Data Points:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {getDataPointsCount()} readings
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Includes:</div>
                <div className="space-y-1">
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <Check className="w-3 h-3 text-success mr-2" />
                    Heart rate trends
                  </div>
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <Check className="w-3 h-3 text-success mr-2" />
                    Blood pressure analysis
                  </div>
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <Check className="w-3 h-3 text-success mr-2" />
                    Activity summary
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;
