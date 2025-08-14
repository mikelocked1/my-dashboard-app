import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Calendar, TrendingUp, FileText, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAppointmentsByUser, getHealthDataByUser } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

const DoctorPortal: React.FC = () => {
  const { currentUser, userProfile } = useAuth();

  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments", currentUser?.uid, "doctor"],
    queryFn: () => getAppointmentsByUser(currentUser?.uid!, "doctor"),
    enabled: !!currentUser && userProfile?.role === "doctor",
  });

  // Mock patient data for demonstration
  const mockPatients = [
    {
      id: "1",
      name: "John Mensah",
      age: 45,
      condition: "Hypertension",
      lastVisit: "2024-03-01",
      riskLevel: "high",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "2", 
      name: "Ama Osei",
      age: 32,
      condition: "Diabetes Type 2",
      lastVisit: "2024-02-28",
      riskLevel: "medium",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b8bd?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "3",
      name: "Kwame Asante",
      age: 38,
      condition: "Regular Checkup",
      lastVisit: "2024-02-25",
      riskLevel: "low",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "default";
      default: return "default";
    }
  };

  const stats = [
    {
      title: "Total Patients",
      value: mockPatients.length.toString(),
      icon: Users,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
    },
    {
      title: "Today's Appointments", 
      value: appointments?.length.toString() || "0",
      icon: Calendar,
      color: "bg-green-100 dark:bg-green-900/30 text-green-600"
    },
    {
      title: "High Risk Patients",
      value: mockPatients.filter(p => p.riskLevel === "high").length.toString(),
      icon: TrendingUp,
      color: "bg-red-100 dark:bg-red-900/30 text-red-600"
    },
    {
      title: "Reports Pending",
      value: "2",
      icon: FileText,
      color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
    }
  ];

  if (userProfile?.role !== "doctor") {
    return (
      <main className="flex-1 p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This portal is only accessible to doctors.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
          Doctor Portal
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage patient care and health data analysis
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Patient List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-display font-semibold text-gray-900 dark:text-white">
              Patient Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={patient.avatar} />
                      <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {patient.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {patient.condition} • Age {patient.age}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Last visit: {patient.lastVisit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getRiskBadgeColor(patient.riskLevel)} className="text-xs">
                      {patient.riskLevel} risk
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-display font-semibold text-gray-900 dark:text-white">
              Recent Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments && appointments.length > 0 ? (
                appointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Patient #{appointment.patientId.slice(-4)}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {appointment.date} at {appointment.time}
                      </p>
                      <Badge variant={
                        appointment.status === "confirmed" ? "default" :
                        appointment.status === "completed" ? "secondary" : "outline"
                      } className="text-xs mt-1">
                        {appointment.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        ${appointment.amount}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {appointment.type}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No appointments scheduled
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default DoctorPortal;
