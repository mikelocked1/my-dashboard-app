import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, Plus, Video } from "lucide-react";
import { t } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const Appointments: React.FC = () => {
  const { userProfile } = useAuth();
  const [selectedView, setSelectedView] = useState<"upcoming" | "past">("upcoming");

  const upcomingAppointments = [
    {
      id: "1",
      doctorName: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      date: new Date(2025, 7, 16, 10, 30), // August 16, 2025 at 10:30 AM
      duration: 30,
      type: "in-person",
      location: "Cardiology Center, Room 202",
      status: "confirmed"
    },
    {
      id: "2", 
      doctorName: "Dr. Michael Chen",
      specialty: "General Practice",
      date: new Date(2025, 7, 18, 14, 0), // August 18, 2025 at 2:00 PM
      duration: 45,
      type: "video",
      location: "Video Call",
      status: "confirmed"
    },
    {
      id: "3",
      doctorName: "Dr. Emily Rodriguez",
      specialty: "Endocrinologist", 
      date: new Date(2025, 7, 22, 9, 15), // August 22, 2025 at 9:15 AM
      duration: 60,
      type: "in-person",
      location: "Diabetes Center, Floor 3",
      status: "pending"
    }
  ];

  const pastAppointments = [
    {
      id: "4",
      doctorName: "Dr. James Wilson",
      specialty: "General Practice",
      date: new Date(2025, 7, 10, 11, 0), // August 10, 2025 at 11:00 AM
      duration: 30,
      type: "in-person",
      location: "Main Clinic",
      status: "completed"
    },
    {
      id: "5",
      doctorName: "Dr. Sarah Johnson", 
      specialty: "Cardiologist",
      date: new Date(2025, 6, 28, 15, 30), // July 28, 2025 at 3:30 PM
      duration: 45,
      type: "in-person",
      location: "Cardiology Center, Room 202",
      status: "completed"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary"; 
      case "completed": return "outline";
      default: return "default";
    }
  };

  const appointments = selectedView === "upcoming" ? upcomingAppointments : pastAppointments;

  return (
    <main className="flex-1 p-6" data-testid="appointments-page">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2" data-testid="page-title">
              {t("nav.appointments")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400" data-testid="page-subtitle">
              Manage your medical appointments and consultations
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90" data-testid="button-book-appointment">
            <Plus className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
          <Button
            variant={selectedView === "upcoming" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView("upcoming")}
            data-testid="button-upcoming-view"
          >
            Upcoming
          </Button>
          <Button
            variant={selectedView === "past" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView("past")}
            data-testid="button-past-view"
          >
            Past
          </Button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <Card data-testid="no-appointments-message">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {selectedView === "upcoming" ? "No upcoming appointments" : "No past appointments"}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                {selectedView === "upcoming" && "Book your first appointment to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id} data-testid={`appointment-card-${appointment.id}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white" data-testid={`doctor-name-${appointment.id}`}>
                          {appointment.doctorName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`specialty-${appointment.id}`}>
                          {appointment.specialty}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm" data-testid={`appointment-date-${appointment.id}`}>
                          {format(appointment.date, "MMM dd, yyyy")}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm" data-testid={`appointment-time-${appointment.id}`}>
                          {format(appointment.date, "h:mm a")} ({appointment.duration} min)
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {appointment.type === "video" ? (
                          <Video className="w-4 h-4 text-gray-400" />
                        ) : (
                          <MapPin className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm" data-testid={`appointment-location-${appointment.id}`}>
                          {appointment.location}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(appointment.status)} data-testid={`status-badge-${appointment.id}`}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {selectedView === "upcoming" && (
                      <>
                        <Button size="sm" data-testid={`button-reschedule-${appointment.id}`}>
                          Reschedule
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-cancel-${appointment.id}`}>
                          Cancel
                        </Button>
                        {appointment.type === "video" && (
                          <Button variant="secondary" size="sm" data-testid={`button-join-video-${appointment.id}`}>
                            <Video className="w-4 h-4 mr-2" />
                            Join Call
                          </Button>
                        )}
                      </>
                    )}
                    
                    {selectedView === "past" && (
                      <Button variant="outline" size="sm" data-testid={`button-view-notes-${appointment.id}`}>
                        View Notes
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Next Appointment Quick Info */}
      {selectedView === "upcoming" && appointments.length > 0 && (
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20" data-testid="next-appointment-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Next Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium" data-testid="next-appointment-doctor">
                  {appointments[0].doctorName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="next-appointment-details">
                  {format(appointments[0].date, "EEEE, MMM dd 'at' h:mm a")}
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30" data-testid="time-until-appointment">
                Tomorrow
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
};

export default Appointments;