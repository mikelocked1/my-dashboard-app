import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, Footprints, Zap, Watch, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isFirebaseConfigured } from '@/lib/firebase';

interface WatchData {
  heartRate: number;
  steps: number;
  calories: number;
  batteryLevel: number;
  lastSync: Date;
}

const SmartwatchIntegration: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [watchData, setWatchData] = useState<WatchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  const mockWatchData: WatchData = {
    heartRate: 72,
    steps: 8432,
    calories: 342,
    batteryLevel: 85,
    lastSync: new Date()
  };

  useEffect(() => {
    // Check if user has previously connected a device (stored in localStorage)
    const savedConnection = localStorage.getItem('smartwatch_connected');
    if (savedConnection === 'true') {
      setIsConnected(true);
      setWatchData(mockWatchData);
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real app, this would involve actual device pairing
      setIsConnected(true);
      setWatchData(mockWatchData);
      localStorage.setItem('smartwatch_connected', 'true');

    } catch (err) {
      setError('Failed to connect to smartwatch. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWatchData(null);
    localStorage.removeItem('smartwatch_connected');
  };

  if (!isFirebaseConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Watch className="w-5 h-5" />
            Smartwatch Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Smartwatch integration requires Firebase configuration. Using mock data for demonstration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Watch className="w-5 h-5" />
          Smartwatch Integration
          {isConnected && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center space-y-4">
          {!isConnected ? (
            <>
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                <Watch className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>Connect your Apple Watch or compatible smartwatch to automatically sync health data.</p>
              </div>
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? 'Connecting...' : 'Connect Smartwatch'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Apple Watch Series 8</span>
                  <Button variant="outline" size="sm" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                </div>

                {/* Health Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Heart Rate */}
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Heart Rate</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {watchData?.heartRate}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">BPM</div>
                      </div>
                    </div>
                  </div>

                  {/* Calories */}
                  <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Calories</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {watchData?.calories}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">kcal</div>
                      </div>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Steps</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {watchData?.steps.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Last Update Info */}
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last synced: {watchData?.lastSync.toLocaleTimeString()}
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