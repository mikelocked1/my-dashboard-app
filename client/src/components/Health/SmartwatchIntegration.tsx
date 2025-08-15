import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Heart, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit, doc } from "firebase/firestore";

interface WatchData {
  userId: string;
  heartRate: number;
  steps: number;
  timestamp: any;
}

const SmartwatchIntegration: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [watchData, setWatchData] = useState<WatchData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    // Set up real-time listener for watch data
    const watchDataQuery = query(
      collection(db, "watchData"),
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      watchDataQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const latestData = snapshot.docs[0].data() as WatchData;
          setWatchData(latestData);
          setIsConnected(true);
          
          // Show toast for new data (only after initial load)
          if (!isLoading) {
            toast({
              title: "Watch Data Updated",
              description: "Your Apple Watch data has been synced successfully.",
              duration: 3000,
            });
          }
        } else {
          setWatchData(null);
          setIsConnected(false);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to watch data:", error);
        setIsLoading(false);
        toast({
          title: "Connection Error",
          description: "Unable to connect to watch data. Please try again.",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, toast, isLoading]);

  const handleConnectWatch = () => {
    toast({
      title: "Redirecting to iOS App",
      description: "Please use the native iOS app to connect your Apple Watch.",
      duration: 5000,
    });
    // In a real implementation, this would deep link to the iOS app
    // or show instructions for downloading it
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return `${Math.floor(diffMins / 1440)}d ago`;
    } catch (error) {
      return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-display font-semibold text-gray-900 dark:text-white">
            Apple Watch Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Checking watch connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-display font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            <svg viewBox="0 0 814 1000" className="w-full h-full" fill="currentColor">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-42.6-35.5-1.9-69.9 20.9-87.7 20.9-17.9 0-47.4-19.8-77.5-19.4-39.4.6-75.5 23.3-95.7 59.3-40.5 71.4-10.2 177.2 29.6 235.2 19.8 28.5 43.3 60.5 76.6 59.4 33.4-1.2 46.3-21.4 86.9-21.4 40.6 0 52.8 21.4 88.2 20.6 36.7-.6 54.7-29.1 75.8-57.9 24.4-33.8 34.3-66.9 34.9-68.7-.6-.6-67.1-25.9-67.3-102.6zm-58.9-174.4c16.1-19.7 27.1-47.2 24.2-75.1-23.3 1.1-52.6 16.2-69.7 36.8-15.3 17.9-28.5 46.9-24.8 74.2 26.1 2.1 52.9-13.3 70.3-35.9z"/>
            </svg>
          </div>
          Apple Watch Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* No Watch Connected State */}
          {!isConnected && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400 flex items-center justify-center">
                <svg viewBox="0 0 814 1000" className="w-full h-full" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-42.6-35.5-1.9-69.9 20.9-87.7 20.9-17.9 0-47.4-19.8-77.5-19.4-39.4.6-75.5 23.3-95.7 59.3-40.5 71.4-10.2 177.2 29.6 235.2 19.8 28.5 43.3 60.5 76.6 59.4 33.4-1.2 46.3-21.4 86.9-21.4 40.6 0 52.8 21.4 88.2 20.6 36.7-.6 54.7-29.1 75.8-57.9 24.4-33.8 34.3-66.9 34.9-68.7-.6-.6-67.1-25.9-67.3-102.6zm-58.9-174.4c16.1-19.7 27.1-47.2 24.2-75.1-23.3 1.1-52.6 16.2-69.7 36.8-15.3 17.9-28.5 46.9-24.8 74.2 26.1 2.1 52.9-13.3 70.3-35.9z"/>
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                No Watch Connected
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Connect your Apple Watch to automatically sync your heart rate, steps, and other health metrics in real-time.
              </p>
              <Button
                onClick={handleConnectWatch}
                className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Connect Apple Watch
              </Button>
            </div>
          )}

          {/* Connected Watch State */}
          {isConnected && watchData && (
            <>
              {/* Connection Status */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg viewBox="0 0 814 1000" className="w-full h-full" fill="currentColor">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-42.6-35.5-1.9-69.9 20.9-87.7 20.9-17.9 0-47.4-19.8-77.5-19.4-39.4.6-75.5 23.3-95.7 59.3-40.5 71.4-10.2 177.2 29.6 235.2 19.8 28.5 43.3 60.5 76.6 59.4 33.4-1.2 46.3-21.4 86.9-21.4 40.6 0 52.8 21.4 88.2 20.6 36.7-.6 54.7-29.1 75.8-57.9 24.4-33.8 34.3-66.9 34.9-68.7-.6-.6-67.1-25.9-67.3-102.6zm-58.9-174.4c16.1-19.7 27.1-47.2 24.2-75.1-23.3 1.1-52.6 16.2-69.7 36.8-15.3 17.9-28.5 46.9-24.8 74.2 26.1 2.1 52.9-13.3 70.3-35.9z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Apple Watch</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Connected • Last sync: {formatTimestamp(watchData.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    Live
                  </Badge>
                  <CheckCircle className="text-green-500 w-5 h-5" />
                </div>
              </div>

              {/* Real-time Health Data */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Health Data</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Heart Rate */}
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Heart Rate</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {watchData.heartRate}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">BPM</div>
                      </div>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Steps</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {watchData.steps.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Last Update Info */}
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Data automatically syncs in real-time from your Apple Watch
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartwatchIntegration;