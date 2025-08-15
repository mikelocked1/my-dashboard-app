import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import DoctorSelection from "@/components/Booking/DoctorSelection";
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Phone, 
  MapPin,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: number;
  appointmentDate: string;
  status: string;
  type: string;
  duration: number;
  consultationFee: string;
  patientNotes: string | null;
  doctorNotes: string | null;
  isVideoCall: boolean;
  doctor: {
    id: number;
    specialty: string;
    consultationFee: string;
    user: {
      name: string;
      email: string;
    };
  };
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  no_show: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
};

const statusIcons = {
  scheduled: Clock,
  confirmed: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
  no_show: AlertCircle
};

const AppointmentsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showBooking, setShowBooking] = useState(false);

  // Fetch patient appointments
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/patient", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      return apiRequest(`/api/appointments/patient/${userProfile.id}`);
    },
    enabled: !!userProfile?.id,
  });

  // Fetch upcoming appointments
  const { data: upcomingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/upcoming", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      return apiRequest(`/api/appointments/upcoming/${userProfile.id}`);
    },
    enabled: !!userProfile?.id,
  });

  const getUpcomingAppointments = () => {
    return appointments?.filter(apt => 
      new Date(apt.appointmentDate) >= new Date() && 
      (apt.status === 'scheduled' || apt.status === 'confirmed')
    ) || [];
  };

  const getPastAppointments = () => {
    return appointments?.filter(apt => 
      new Date(apt.appointmentDate) < new Date() || 
      apt.status === 'completed' || 
      apt.status === 'cancelled'
    ) || [];
  };

  if (showBooking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => setShowBooking(false)}
            className="mb-4"
          >
            ← Back to Appointments
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Book New Appointment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find and book appointments with qualified healthcare professionals.
          </p>
        </div>
        
        <DoctorSelection />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="appointments-loading">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="appointments-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Appointments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your healthcare appointments and consultations.
          </p>
        </div>
        
        <Button 
          onClick={() => setShowBooking(true)}
          data-testid="button-book-appointment"
        >
          <Plus className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList data-testid="appointments-tabs">
          <TabsTrigger value="upcoming">
            Upcoming ({getUpcomingAppointments().length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({getPastAppointments().length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" data-testid="upcoming-appointments">
          <div className="space-y-4">
            {getUpcomingAppointments().length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No upcoming appointments
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You don't have any scheduled appointments. Book one now to get started.
                  </p>
                  <Button onClick={() => setShowBooking(true)}>
                    Book Your First Appointment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              getUpcomingAppointments().map((appointment) => {
                const StatusIcon = statusIcons[appointment.status as keyof typeof statusIcons];
                return (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow" data-testid={`appointment-${appointment.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              Dr. {appointment.doctor.user.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              {appointment.doctor.specialty}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {appointment.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(appointment.appointmentDate), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(appointment.appointmentDate), "h:mm a")}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          {appointment.isVideoCall ? (
                            <>
                              <Video className="w-4 h-4" />
                              <span>Video Call</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4" />
                              <span>In-person</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {appointment.patientNotes && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Your Notes:
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {appointment.patientNotes}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-primary">
                          ${appointment.consultationFee}
                        </div>
                        <div className="space-x-2">
                          {appointment.status === 'scheduled' && (
                            <Button variant="outline" size="sm">
                              Reschedule
                            </Button>
                          )}
                          {appointment.isVideoCall && appointment.status === 'confirmed' && (
                            <Button size="sm">
                              <Video className="w-4 h-4 mr-2" />
                              Join Call
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" data-testid="appointment-history">
          <div className="space-y-4">
            {getPastAppointments().length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No appointment history
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your completed appointments will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getPastAppointments().map((appointment) => {
                const StatusIcon = statusIcons[appointment.status as keyof typeof statusIcons];
                return (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow" data-testid={`past-appointment-${appointment.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <User className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              Dr. {appointment.doctor.user.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              {appointment.doctor.specialty}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(appointment.appointmentDate), "MMM dd, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                        <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {appointment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {appointment.doctorNotes && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Doctor's Notes:
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {appointment.doctorNotes}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Consultation fee: ${appointment.consultationFee}
                        </div>
                        {appointment.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            Book Follow-up
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppointmentsPage;