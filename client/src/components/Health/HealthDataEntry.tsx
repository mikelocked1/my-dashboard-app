import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Activity, Scale, Droplet, Footprints, Moon, Thermometer, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const healthMetricTypes = [
  {
    value: "heart_rate",
    label: "Heart Rate",
    icon: Heart,
    unit: "bpm",
    placeholder: "e.g., 72",
    color: "text-red-500"
  },
  {
    value: "blood_pressure",
    label: "Blood Pressure",
    icon: Activity,
    unit: "mmHg",
    placeholder: "e.g., 120/80",
    color: "text-blue-500",
    requiresBoth: true
  },
  {
    value: "weight",
    label: "Weight",
    icon: Scale,
    unit: "kg",
    placeholder: "e.g., 70.5",
    color: "text-green-500"
  },
  {
    value: "blood_sugar",
    label: "Blood Sugar",
    icon: Droplet,
    unit: "mg/dL",
    placeholder: "e.g., 95",
    color: "text-yellow-600"
  },
  {
    value: "steps",
    label: "Daily Steps",
    icon: Footprints,
    unit: "steps",
    placeholder: "e.g., 8500",
    color: "text-purple-500"
  },
  {
    value: "sleep",
    label: "Sleep Duration",
    icon: Moon,
    unit: "hours",
    placeholder: "e.g., 7.5",
    color: "text-indigo-500"
  },
  {
    value: "temperature",
    label: "Body Temperature",
    icon: Thermometer,
    unit: "°C",
    placeholder: "e.g., 36.5",
    color: "text-orange-500"
  }
];

const HealthDataEntry: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedType, setSelectedType] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [systolic, setSystolic] = useState<string>("");
  const [diastolic, setDiastolic] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [timestamp, setTimestamp] = useState<Date>(new Date());
  const [source] = useState<string>("manual");
  const [showCalendar, setShowCalendar] = useState(false);

  const selectedMetric = healthMetricTypes.find(type => type.value === selectedType);

  const createHealthDataMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/health-data", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Health data saved",
        description: "Your health metric has been recorded successfully.",
      });
      // Reset form
      setValue("");
      setSystolic("");
      setDiastolic("");
      setNotes("");
      setTimestamp(new Date());
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/health-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-alerts"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save health data. Please try again.",
      });
      console.error("Health data submission error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !userProfile) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a metric type and ensure you're logged in.",
      });
      return;
    }

    let healthValue = value;
    let systolicValue = null;
    let diastolicValue = null;

    // Handle blood pressure specially
    if (selectedType === "blood_pressure") {
      if (!systolic || !diastolic) {
        toast({
          variant: "destructive",
          title: "Missing blood pressure values",
          description: "Please enter both systolic and diastolic values.",
        });
        return;
      }
      healthValue = `${systolic}/${diastolic}`;
      systolicValue = parseInt(systolic);
      diastolicValue = parseInt(diastolic);
    } else if (!value) {
      toast({
        variant: "destructive",
        title: "Missing value",
        description: "Please enter a value for the selected metric.",
      });
      return;
    }

    const healthData = {
      userId: userProfile.id,
      type: selectedType,
      value: healthValue,
      unit: selectedMetric?.unit || "",
      systolic: systolicValue,
      diastolic: diastolicValue,
      timestamp,
      source,
      notes: notes || null,
    };

    createHealthDataMutation.mutate(healthData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto" data-testid="health-data-entry-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-primary" />
          <span>Record Health Data</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metric Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="metric-type">Health Metric</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger data-testid="select-health-metric">
                <SelectValue placeholder="Select a health metric to record" />
              </SelectTrigger>
              <SelectContent>
                {healthMetricTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${type.color}`} />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Value Input */}
          {selectedType && selectedMetric && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <selectedMetric.icon className={`w-4 h-4 ${selectedMetric.color}`} />
                <span>Recording: {selectedMetric.label}</span>
              </div>

              {selectedMetric.requiresBoth ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="systolic">Systolic (top number)</Label>
                    <Input
                      id="systolic"
                      type="number"
                      placeholder="120"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      data-testid="input-systolic"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diastolic">Diastolic (bottom number)</Label>
                    <Input
                      id="diastolic"
                      type="number"
                      placeholder="80"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      data-testid="input-diastolic"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="value">{selectedMetric.label} Value</Label>
                  <div className="relative">
                    <Input
                      id="value"
                      type="number"
                      step={selectedType === "weight" || selectedType === "temperature" || selectedType === "sleep" ? "0.1" : "1"}
                      placeholder={selectedMetric.placeholder}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      data-testid="input-health-value"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      {selectedMetric.unit}
                    </div>
                  </div>
                </div>
              )}

              {/* Date/Time Selection */}
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !timestamp && "text-muted-foreground"
                      )}
                      data-testid="button-select-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {timestamp ? format(timestamp, "PPP p") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={timestamp}
                      onSelect={(date) => {
                        if (date) {
                          setTimestamp(date);
                          setShowCalendar(false);
                        }
                      }}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Label htmlFor="time" className="text-sm">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={format(timestamp, "HH:mm")}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(":").map(Number);
                          const newTimestamp = new Date(timestamp);
                          newTimestamp.setHours(hours, minutes);
                          setTimestamp(newTimestamp);
                        }}
                        className="mt-1"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this reading..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!selectedType || createHealthDataMutation.isPending || 
              (selectedMetric?.requiresBoth && (!systolic || !diastolic)) ||
              (!selectedMetric?.requiresBoth && !value)
            }
            data-testid="button-save-health-data"
          >
            {createHealthDataMutation.isPending ? "Saving..." : "Save Health Data"}
          </Button>
        </form>

        {/* Quick Entry Tips */}
        {selectedType && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Quick Tips for {selectedMetric?.label}
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              {selectedType === "heart_rate" && (
                <>
                  <li>• Resting heart rate: 60-100 bpm is normal</li>
                  <li>• Best measured when sitting quietly</li>
                </>
              )}
              {selectedType === "blood_pressure" && (
                <>
                  <li>• Normal: Less than 120/80 mmHg</li>
                  <li>• Take readings at the same time daily</li>
                </>
              )}
              {selectedType === "blood_sugar" && (
                <>
                  <li>• Normal fasting: 70-100 mg/dL</li>
                  <li>• Note if taken before or after meals</li>
                </>
              )}
              {selectedType === "weight" && (
                <>
                  <li>• Best measured in the morning</li>
                  <li>• Use the same scale consistently</li>
                </>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthDataEntry;