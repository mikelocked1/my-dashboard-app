import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Bot, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

const AIHealthTips: React.FC = () => {
  const { currentUser, userProfile } = useAuth();

  const { data: healthTips, isLoading } = useQuery({
    queryKey: ["/api/ai-health-tips", userProfile?.id],
    queryFn: () => apiRequest(`/api/ai-health-tips/${userProfile?.id}`),
    enabled: !!userProfile?.id,
  });

  // Sample tips if no data available
  const sampleTips = [
    {
      id: "1",
      category: "medication",
      title: "Blood Pressure Management",
      content: "Based on your recent readings, consider reducing sodium intake and increasing physical activity. Your current pattern shows elevation after meals.",
      priority: "high",
      isPersonalized: true,
    },
    {
      id: "2", 
      category: "exercise",
      title: "Activity Level",
      content: "Great job on maintaining consistent daily steps! Consider adding strength training 2-3 times per week for optimal health.",
      priority: "medium",
      isPersonalized: true,
    }
  ];

  const tips = healthTips && healthTips.length > 0 ? healthTips : sampleTips;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-primary bg-primary/5";
      case "medium": return "border-secondary bg-secondary/5";
      case "low": return "border-gray-300 bg-gray-50";
      default: return "border-gray-300 bg-gray-50";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high": return "High Priority";
      case "medium": return "Medium Priority"; 
      case "low": return "Low Priority";
      default: return "Medium Priority";
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-secondary to-teal-600 rounded-xl flex items-center justify-center mr-3">
            <Brain className="text-white w-5 h-5" />
          </div>
          <CardTitle className="text-lg font-display font-semibold text-gray-900 dark:text-white">
            AI Health Tips
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tips.map((tip) => (
            <div 
              key={tip.id} 
              className={`rounded-lg p-4 border-l-4 ${getPriorityColor(tip.priority)} dark:bg-opacity-10`}
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {tip.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {tip.content}
              </p>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Bot className="w-3 h-3 mr-2" />
                <span>AI Recommendation • {getPriorityText(tip.priority)}</span>
              </div>
            </div>
          ))}
          
          <Button 
            variant="ghost" 
            className="w-full text-sm font-medium text-primary hover:text-orange-600 transition-colors py-2"
          >
            View All Recommendations <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIHealthTips;
