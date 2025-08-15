import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { t, setLanguage, getCurrentLanguage } from "@/lib/i18n";
import { updateUser } from "@/lib/firestore";
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Globe, 
  Shield, 
  Palette,
  Smartphone,
  Download,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle,
  Moon,
  Sun
} from "lucide-react";

interface UserSettings {
  notifications: {
    emailAlerts: boolean;
    pushNotifications: boolean;
    healthReminders: boolean;
    appointmentReminders: boolean;
  };
  privacy: {
    shareDataWithDoctors: boolean;
    allowDataExport: boolean;
    anonymousAnalytics: boolean;
  };
  preferences: {
    language: string;
    theme: string;
    timeFormat: "12h" | "24h";
    dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
    units: "metric" | "imperial";
  };
}

const Settings: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: userProfile?.name || "",
    email: userProfile?.email || "",
    role: userProfile?.role || "user",
  });
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    const savedSettings = localStorage.getItem("userSettings");
    return savedSettings ? JSON.parse(savedSettings) : {
      notifications: {
        emailAlerts: true,
        pushNotifications: true,
        healthReminders: true,
        appointmentReminders: true,
      },
      privacy: {
        shareDataWithDoctors: true,
        allowDataExport: true,
        anonymousAnalytics: true,
      },
      preferences: {
        language: getCurrentLanguage(),
        theme: theme,
        timeFormat: "12h" as const,
        dateFormat: "MM/DD/YYYY" as const,
        units: "metric" as const,
      },
    };
  });

  useEffect(() => {
    localStorage.setItem("userSettings", JSON.stringify(settings));
  }, [settings]);

  const handleProfileUpdate = async () => {
    if (!currentUser || !userProfile) return;
    
    setLoading(true);
    try {
      await updateUser(userProfile.id, {
        name: profileData.name,
        email: profileData.email,
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    const validLanguages = ['en', 'tw', 'ha', 'fr'] as const;
    if (validLanguages.includes(newLanguage as any)) {
      setLanguage(newLanguage as 'en' | 'tw' | 'ha' | 'fr');
      setSettings(prev => ({
        ...prev,
        preferences: { ...prev.preferences, language: newLanguage }
      }));
      
      toast({
        title: "Language Updated",
        description: `Language changed to ${getLanguageName(newLanguage)}.`,
      });
    }
  };

  const handleThemeChange = () => {
    toggleTheme();
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, theme: theme === "light" ? "dark" : "light" }
    }));
  };

  const exportHealthData = () => {
    // Mock export functionality
    const mockData = {
      user: profileData.name,
      exportDate: new Date().toISOString(),
      healthMetrics: [
        { date: "2024-08-14", heartRate: 72, bloodPressure: "120/80", steps: 8500 },
        { date: "2024-08-13", heartRate: 68, bloodPressure: "118/78", steps: 9200 },
        { date: "2024-08-12", heartRate: 75, bloodPressure: "122/82", steps: 7800 },
      ]
    };
    
    const blob = new Blob([JSON.stringify(mockData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Your health data has been downloaded successfully.",
    });
  };

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      'en': 'English',
      'tw': 'Twi',
      'ha': 'Hausa', 
      'fr': 'French'
    };
    return languages[code] || code;
  };

  const clearAllData = () => {
    if (window.confirm("Are you sure you want to clear all your health data? This action cannot be undone.")) {
      localStorage.removeItem("healthData");
      localStorage.removeItem("appointments");
      
      toast({
        title: "Data Cleared",
        description: "All your local health data has been removed.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
          {t("nav.settings")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account preferences and application settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-semibold text-xl">
                  {profileData.name.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">
                    {profileData.role === "doctor" ? "Doctor" : profileData.role === "admin" ? "Administrator" : "Patient"}
                  </Badge>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Member since {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <Button onClick={handleProfileUpdate} disabled={loading} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Alerts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive health alerts and updates via email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.emailAlerts}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, emailAlerts: checked }
                    }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Push Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get real-time notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, pushNotifications: checked }
                    }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Health Reminders</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Daily reminders to log health data
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.healthReminders}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, healthReminders: checked }
                    }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Appointment Reminders</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Reminders 24 hours before appointments
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.appointmentReminders}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, appointmentReminders: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance & Language
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Dark Mode</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Switch between light and dark themes
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleThemeChange}
                  className="flex items-center gap-2"
                >
                  {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  {theme === "light" ? "Enable Dark Mode" : "Enable Light Mode"}
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={settings.preferences.language}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="tw">🇬🇭 Twi</SelectItem>
                    <SelectItem value="ha">🇳🇬 Hausa</SelectItem>
                    <SelectItem value="fr">🇫🇷 French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select
                    value={settings.preferences.timeFormat}
                    onValueChange={(value: "12h" | "24h") => 
                      setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, timeFormat: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={settings.preferences.dateFormat}
                    onValueChange={(value: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD") => 
                      setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, dateFormat: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Units</Label>
                <Select
                  value={settings.preferences.units}
                  onValueChange={(value: "metric" | "imperial") => 
                    setSettings(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, units: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (kg, cm, °C)</SelectItem>
                    <SelectItem value="imperial">Imperial (lbs, ft, °F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Share Data with Doctors</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Allow doctors to view your health data during appointments
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.shareDataWithDoctors}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, shareDataWithDoctors: checked }
                    }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Allow Data Export</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enable downloading your data for personal use
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.allowDataExport}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, allowDataExport: checked }
                    }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Anonymous Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Help improve the app by sharing anonymous usage data
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.anonymousAnalytics}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, anonymousAnalytics: checked }
                    }))
                  }
                />
              </div>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your privacy is important to us. All health data is encrypted and stored securely. 
                  We never sell or share your personal information with third parties.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Export Health Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Download all your health data in JSON format
                  </p>
                </div>
                <Button
                  onClick={exportHealthData}
                  disabled={!settings.privacy.allowDataExport}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
              </div>
              
              <Separator />
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Danger Zone:</strong> The actions below cannot be undone. Please be careful.
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-red-600 dark:text-red-400">Clear All Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Remove all your health data and reset the application
                  </p>
                </div>
                <Button
                  onClick={clearAllData}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Settings Status */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            All settings are automatically saved to your device
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Settings;