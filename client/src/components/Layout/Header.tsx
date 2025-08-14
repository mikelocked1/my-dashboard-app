import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Sun, Heart } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { setLanguage, getLanguage, t } from "@/lib/i18n";

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { userProfile, logout } = useAuth();
  const [currentLanguage, setCurrentLanguage] = React.useState(getLanguage());

  const handleLanguageChange = (value: string) => {
    setLanguage(value as any);
    setCurrentLanguage(value as any);
    window.location.reload(); // Simple reload for language change
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center">
                <Heart className="text-white h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-gray-900 dark:text-white">SmartCare</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Intelligent Health Companion</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="tw">🇬🇭 Twi</SelectItem>
                <SelectItem value="ha">🇳🇬 Hausa</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userProfile?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {userProfile?.role || "user"}
                </p>
              </div>
              <Avatar>
                <AvatarImage src={userProfile?.profilePicture} />
                <AvatarFallback>
                  {userProfile?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" onClick={logout} className="text-sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
