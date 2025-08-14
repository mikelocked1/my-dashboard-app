import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHealthData } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { parseCSV } from "@/utils/csvParser";

const DataUpload: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dataType, setDataType] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const createHealthDataMutation = useMutation({
    mutationFn: createHealthData,
    onSuccess: () => {
      toast({
        title: "Data Uploaded",
        description: "Your health data has been successfully recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/health-data"] });
      // Reset form
      setValue("");
      setDataType("");
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleManualUpload = () => {
    if (!dataType || !value || !currentUser) {
      toast({
        title: "Incomplete Data",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const unit = getUnitForDataType(dataType);
    
    createHealthDataMutation.mutate({
      userId: currentUser.uid,
      type: dataType as any,
      value,
      unit,
      timestamp: new Date(date),
      source: "manual",
    });
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      const csvData = await parseCSV(file);
      
      // Process each row and create health data entries
      for (const row of csvData) {
        const unit = getUnitForDataType(row.type);
        await createHealthData({
          userId: currentUser.uid,
          type: row.type as any,
          value: row.value,
          unit,
          timestamp: new Date(row.date),
          source: "csv",
          notes: row.notes,
        });
      }

      toast({
        title: "CSV Upload Complete",
        description: `Successfully uploaded ${csvData.length} health data entries.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/health-data"] });
    } catch (error) {
      toast({
        title: "CSV Upload Failed",
        description: "There was an error processing your CSV file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const getUnitForDataType = (type: string): string => {
    switch (type) {
      case "heart_rate": return "BPM";
      case "blood_pressure": return "mmHg";
      case "weight": return "kg";
      case "blood_sugar": return "mg/dL";
      case "temperature": return "°C";
      case "steps": return "steps";
      case "sleep": return "hours";
      default: return "";
    }
  };

  const getPlaceholderForDataType = (type: string): string => {
    switch (type) {
      case "heart_rate": return "72";
      case "blood_pressure": return "120/80";
      case "weight": return "70.5";
      case "blood_sugar": return "95";
      case "temperature": return "36.5";
      case "steps": return "8547";
      case "sleep": return "7.5";
      default: return "";
    }
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-display font-semibold text-gray-900 dark:text-white">
          Upload Health Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dataType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Data Type
            </Label>
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger>
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                <SelectItem value="heart_rate">Heart Rate</SelectItem>
                <SelectItem value="weight">Weight</SelectItem>
                <SelectItem value="blood_sugar">Blood Sugar</SelectItem>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="steps">Steps</SelectItem>
                <SelectItem value="sleep">Sleep Duration</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Value
              </Label>
              <Input
                id="value"
                type="text"
                placeholder={getPlaceholderForDataType(dataType)}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          
          {/* CSV Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Or upload CSV file
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              CSV format: type,value,date,notes
            </p>
            <Input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              id="csvUpload"
            />
            <Label 
              htmlFor="csvUpload" 
              className="cursor-pointer text-primary hover:text-orange-600 font-medium"
            >
              Choose CSV File
            </Label>
          </div>
          
          <Button 
            onClick={handleManualUpload}
            disabled={createHealthDataMutation.isPending}
            className="w-full bg-primary hover:bg-orange-600 text-white"
          >
            {createHealthDataMutation.isPending ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Data
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataUpload;
