import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, CheckCircle, Loader2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SmartwatchData {
  steps: number;
  heartRate: number;
  sleep: number;
}

const SmartwatchIntegration: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // Mock smartwatch data - in real implementation, this would come from actual APIs
  const mockSmartwatchData: SmartwatchData = {
    steps: 8547,
    heartRate: 72,
    sleep: 7.75,
  };

  const syncDataMutation = useMutation({
    mutationFn: async (source: string) => {
      if (!userProfile?.id) {
        throw new Error("User profile not found. Please log in again.");
      }

      if (!connectedDevices.includes(source)) {
        throw new Error("Device not connected. Please connect your device first.");
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, this would fetch data from the actual smartwatch APIs
      const data = mockSmartwatchData;
      const timestamp = new Date().toISOString();

      // Create multiple health data entries
      const promises = [
        apiRequest("/api/health-data", {
          method: "POST",
          body: JSON.stringify({
            userId: userProfile.id,
            type: "steps",
            value: data.steps.toString(),
            unit: "steps",
            timestamp: timestamp,
            source: source === "apple_watch" ? "apple_health" : source,
          }),
        }),
        apiRequest("/api/health-data", {
          method: "POST",
          body: JSON.stringify({
            userId: userProfile.id,
            type: "heart_rate",
            value: data.heartRate.toString(),
            unit: "BPM",
            timestamp: timestamp,
            source: source === "apple_watch" ? "apple_health" : source,
          }),
        }),
        apiRequest("/api/health-data", {
          method: "POST",
          body: JSON.stringify({
            userId: userProfile.id,
            type: "sleep",
            value: data.sleep.toString(),
            unit: "hours",
            timestamp: timestamp,
            source: source === "apple_watch" ? "apple_health" : source,
          }),
        }),
      ];

      await Promise.all(promises);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${Object.keys(data).length} data points.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/health-data"] });
    },
    onError: (error: Error) => {
      console.error("Smartwatch sync error:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "There was an error syncing your smartwatch data.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = async (device: string) => {
    setIsConnecting(device);
    
    try {
      // Simulate device connection process with proper steps
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (device === "apple_watch") {
        // Simulate Apple HealthKit authorization request
        if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
          // Request permissions for health data access
          toast({
            title: "Authorization Required",
            description: "Please allow SmartCare to access your Apple Health data.",
          });
          
          // Simulate user approving permissions
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Add device to connected list
      setConnectedDevices(prev => [...prev, device]);
      setIsConnecting(null);
      
      toast({
        title: "Device Connected Successfully",
        description: `${device === "apple_watch" ? "Apple Watch" : device} is now connected and ready for data sync.`,
      });
    } catch (error) {
      setIsConnecting(null);
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${device}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = (device: string) => {
    setConnectedDevices(prev => prev.filter(d => d !== device));
    toast({
      title: "Device Disconnected",
      description: `${device === "apple_watch" ? "Apple Watch" : device} has been disconnected.`,
    });
  };

  const integrations = [
    {
      id: "apple_watch",
      name: "Apple Watch",
      icon: "🍎",
      connected: connectedDevices.includes("apple_watch"),
      lastSync: "2 min ago"
    },
    {
      id: "fitbit",
      name: "Fitbit",
      icon: "⌚",
      connected: connectedDevices.includes("fitbit"),
      lastSync: null
    },
    {
      id: "samsung_health",
      name: "Samsung Health",
      icon: "📱",
      connected: connectedDevices.includes("samsung_health"),
      lastSync: null
    },
  ];

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-display font-semibold text-gray-900 dark:text-white">
          Smartwatch Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connected Device Status */}
          {connectedDevices.map((deviceId) => {
            const device = integrations.find(i => i.id === deviceId);
            if (!device) return null;
            
            return (
              <div key={deviceId} className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{device.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{device.name}</p>
                    <p className="text-xs text-success">Connected • Last sync: {device.lastSync}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => syncDataMutation.mutate(deviceId)}
                    disabled={syncDataMutation.isPending}
                    className="bg-primary hover:bg-orange-600"
                  >
                    {syncDataMutation.isPending ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      "Sync Now"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDisconnect(deviceId)}
                    className="text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <CheckCircle className="text-success w-5 h-5" />
                </div>
              </div>
            );
          })}
          
          {/* Available Integrations */}
          {integrations.filter(i => !i.connected).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Integrations</h4>
            
            {integrations.filter(i => !i.connected).map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{integration.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {integration.name}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConnect(integration.id)}
                  disabled={isConnecting === integration.id}
                  className="text-xs border-primary text-primary hover:bg-primary hover:text-white"
                >
                  {isConnecting === integration.id ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
            ))}
            </div>
          )}
          
          {/* No Devices Connected Message */}
          {connectedDevices.length === 0 && (
            <div className="text-center py-8">
              <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">No Devices Connected</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Connect your smartwatch or fitness tracker to sync health data automatically
              </p>
            </div>
          )}

          {/* Recent Sync Data */}
          {connectedDevices.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Synced Data</h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Steps Today:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {mockSmartwatchData.steps.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heart Rate Avg:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {mockSmartwatchData.heartRate} BPM
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sleep Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {mockSmartwatchData.sleep}h
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartwatchIntegration;
