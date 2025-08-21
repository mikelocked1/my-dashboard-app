import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
  Users,
  TrendingUp,
  MessageSquare,
  Settings
} from "lucide-react";
import { format } from "date-fns";

interface DoctorProfile {
  id: number;
  specialty: string;
  experience: number;
  rating: string;
  reviewCount: number;
  consultationFee: string;
  bio: string;
  education: string[];
  languages: string[];
  isAvailable: boolean;
  status: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface Appointment {
  id: number;
  appointmentDate: string;
  status: string;
  type: string;
  patientNotes: string | null;
  doctorNotes: string | null;
  isVideoCall: boolean;
  patient: {
    name: string;
    email: string;
  };
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const statusIcons = {
  scheduled: Clock,
  confirmed: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
  pending: AlertCircle,
  approved: CheckCircle,
  rejected: XCircle
};

const DoctorDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch doctor profile
  const { data: doctorProfile, isLoading: profileLoading } = useQuery<DoctorProfile>({
    queryKey: ["/api/doctors/profile", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;
      console.log("Fetching doctor profile for user ID:", userProfile.id);
      const doctors = await apiRequest("/api/doctors");
      console.log("All doctors:", doctors);
      const doctor = doctors.find((d: any) => d.user.id === userProfile.id);
      console.log("Found doctor profile:", doctor);
      return doctor;
    },
    enabled: !!userProfile?.id,
  });

  // Fetch doctor appointments
  const { data: appointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/doctor", doctorProfile?.id],
    queryFn: async () => {
      if (!doctorProfile?.id) return [];
      return apiRequest(`/api/appointments/doctor/${doctorProfile.id}`);
    },
    enabled: !!doctorProfile?.id,
  });

  // Update appointment status mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: number; status: string }) => {
      return apiRequest(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: (_, { status }) => {
      toast({
        title: "Appointment Updated",
        description: `Appointment ${status} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update appointment status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAppointmentAction = (appointmentId: number, status: string) => {
    updateAppointmentMutation.mutate({ appointmentId, status });
  };

  const getUpcomingAppointments = () => {
    return appointments?.filter(apt => 
      new Date(apt.appointmentDate) >= new Date() && 
      (apt.status === 'scheduled' || apt.status === 'confirmed')
    ) || [];
  };

  const getTodayAppointments = () => {
    const today = new Date().toDateString();
    return appointments?.filter(apt => 
      new Date(apt.appointmentDate).toDateString() === today &&
      (apt.status === 'scheduled' || apt.status === 'confirmed')
    ) || [];
  };

  if (profileLoading) {
    return (
      <main className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </main>
    );
  }

  // Doctor not approved yet
  if (!doctorProfile || doctorProfile.status !== "approved") {
    return (
      <main className="flex-1 p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Account Pending Approval
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your doctor account is currently pending approval by an administrator. 
              You will receive an email notification once your account has been verified.
            </p>
            {doctorProfile?.status === "rejected" && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-800 dark:text-red-200 font-medium">
                  Account Rejected
                </p>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                  Please contact support for more information about your application.
                </p>
              </div>
            )}
            <div className="mt-6 flex justify-center space-x-4">
              <Button variant="outline">
                Contact Support
              </Button>
              <Button>
                View Application Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6" data-testid="doctor-dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Doctor Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, Dr. {doctorProfile.user.name}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getTodayAppointments().length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {appointments?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rating</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseFloat(doctorProfile.rating).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Stethoscope className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Specialty</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {doctorProfile.specialty}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList data-testid="doctor-tabs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({getUpcomingAppointments().length})</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" data-testid="overview-tab">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {getTodayAppointments().length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                    No appointments scheduled for today
                  </p>
                ) : (
                  <div className="space-y-3">
                    {getTodayAppointments().slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {appointment.patient.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {appointment.patient.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {format(new Date(appointment.appointmentDate), "h:mm a")}
                            </p>
                          </div>
                        </div>
                        <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Experience:</span>
                    <span className="font-medium">{doctorProfile.experience} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Consultation Fee:</span>
                    <span className="font-medium">${doctorProfile.consultationFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Languages:</span>
                    <span className="font-medium">{doctorProfile.languages?.join(", ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <Badge className={statusColors[doctorProfile.status as keyof typeof statusColors]}>
                      {doctorProfile.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" data-testid="appointments-tab">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : getUpcomingAppointments().length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  No upcoming appointments
                </p>
              ) : (
                <div className="space-y-4">
                  {getUpcomingAppointments().map((appointment) => {
                    const StatusIcon = statusIcons[appointment.status as keyof typeof statusIcons];
                    return (
                      <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <Avatar>
                              <AvatarFallback>
                                {appointment.patient.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {appointment.patient.name}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                {appointment.patient.email}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(appointment.appointmentDate), "MMM dd, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                          </div>
                          <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {appointment.status}
                          </Badge>
                        </div>
                        
                        {appointment.patientNotes && (
                          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                              Patient Notes:
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {appointment.patientNotes}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex justify-end space-x-2">
                          {appointment.status === 'scheduled' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleAppointmentAction(appointment.id, 'confirmed')}
                                disabled={updateAppointmentMutation.isPending}
                              >
                                Confirm
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleAppointmentAction(appointment.id, 'cancelled')}
                                disabled={updateAppointmentMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <Button 
                              size="sm"
                              onClick={() => handleAppointmentAction(appointment.id, 'completed')}
                              disabled={updateAppointmentMutation.isPending}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" data-testid="schedule-tab">
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Schedule Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Schedule management features coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" data-testid="profile-tab">
          <Card>
            <CardContent className="p-12 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Profile Settings
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Profile management features coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default DoctorDashboard;