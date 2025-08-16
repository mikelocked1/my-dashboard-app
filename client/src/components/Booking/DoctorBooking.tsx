import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Star, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";

interface BookingData {
  doctorId: string;
  date: string;
  time: string;
}

const DoctorBooking: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["/api/doctors"],
    queryFn: () => apiRequest("/api/doctors"),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (bookingData: BookingData) => {
      console.log("Booking data:", bookingData);
      console.log("User profile:", userProfile);
      console.log("Available doctors:", doctors);
      
      const doctor = doctors?.find((d: any) => d.id === parseInt(bookingData.doctorId));
      if (!doctor) throw new Error("Doctor not found");

      const appointmentPayload = {
        patientId: userProfile?.id!,
        doctorId: parseInt(bookingData.doctorId),
        appointmentDate: new Date(`${bookingData.date}T${bookingData.time}`),
        status: "scheduled",
        type: "consultation",
        consultationFee: doctor.consultationFee,
      };
      
      console.log("Appointment payload:", appointmentPayload);

      return apiRequest("/api/appointments", {
        method: "POST",
        body: JSON.stringify(appointmentPayload),
      });
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed",
        description: "Your appointment has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      // Reset form
      setSelectedDoctor(null);
      setSelectedDate("");
      setSelectedTime("");
    },
    onError: (error) => {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: `Error: ${error?.message || 'Unknown error occurred'}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleConfirmBooking = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: "Incomplete Selection",
        description: "Please select a doctor, date, and time.",
        variant: "destructive",
      });
      return;
    }

    createAppointmentMutation.mutate({
      doctorId: selectedDoctor,
      date: selectedDate,
      time: selectedTime,
    });
  };

  const availableTimes = [
    "9:00 AM",
    "10:30 AM", 
    "2:00 PM",
    "3:30 PM",
    "5:00 PM"
  ];

  const getCalendarDates = () => {
    const dates = [];
    for (let i = 1; i <= 31; i++) {
      dates.push(i);
    }
    return dates;
  };

  const selectedDoctorData = doctors?.find((d: any) => d.id === parseInt(selectedDoctor || '0'));

  if (isLoading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display font-semibold text-gray-900 dark:text-white">
            {t("booking.title")}
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor Selection */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              {t("booking.select_doctor")}
            </h4>
            <div className="space-y-3">
              {doctors?.map((doctor: any) => (
                <div
                  key={doctor.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedDoctor === doctor.id.toString()
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 dark:border-gray-600 hover:border-primary"
                  }`}
                  onClick={() => setSelectedDoctor(doctor.id.toString())}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      <AvatarImage src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" />
                      <AvatarFallback>Dr</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        Dr. {doctor.userId}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {doctor.specialty}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="flex text-yellow-400 text-xs">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {doctor.rating} ({doctor.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${doctor.consultationFee}
                      </span>
                      <p className="text-xs text-success">Available</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Date Selection */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              {t("booking.select_date")}
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-600 dark:text-gray-400 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDates().map((date) => {
                  const dateStr = `2024-03-${date.toString().padStart(2, '0')}`;
                  return (
                    <button
                      key={date}
                      className={`p-2 text-sm rounded transition-colors ${
                        selectedDate === dateStr
                          ? "bg-primary text-white font-medium"
                          : "text-gray-900 dark:text-white hover:bg-primary/10"
                      }`}
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      {date}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Time Selection */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              {t("booking.available_times")}
            </h4>
            <div className="space-y-2">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  className={`w-full p-3 text-sm border rounded-lg transition-colors text-left ${
                    selectedTime === time
                      ? "bg-primary/10 border-2 border-primary"
                      : "border-gray-200 dark:border-gray-600 hover:border-primary hover:bg-primary/5"
                  }`}
                  onClick={() => setSelectedTime(time)}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${
                      selectedTime === time ? "text-primary" : "text-gray-900 dark:text-white"
                    }`}>
                      {time}
                    </span>
                    <span className={`text-xs ${
                      selectedTime === time ? "text-primary" : "text-success"
                    }`}>
                      {selectedTime === time ? "Selected" : "Available"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Booking Confirmation */}
            {selectedDoctor && selectedDate && selectedTime && (
              <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t("booking.summary")}
                </h5>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Dr. {selectedDoctorData?.userId} - {selectedDoctorData?.specialty}</div>
                  <div>{selectedDate} at {selectedTime}</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Total: ${selectedDoctorData?.consultationFee}.00
                  </div>
                </div>
                <Button 
                  className="w-full mt-4 bg-primary hover:bg-orange-600 text-white"
                  onClick={handleConfirmBooking}
                  disabled={createAppointmentMutation.isPending}
                >
                  {createAppointmentMutation.isPending ? "Booking..." : t("booking.confirm")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorBooking;
