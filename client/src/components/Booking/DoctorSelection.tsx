import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  Star, 
  MapPin, 
  Phone, 
  Video,
  Search,
  Stethoscope,
  GraduationCap,
  Languages
} from "lucide-react";
import { format, addDays, isAfter, isBefore, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface Doctor {
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
  workingHours: any;
  user: {
    id: number;
    name: string;
    email: string;
    profilePicture?: string;
  };
}

const specialties = [
  "All Specialties",
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry"
];

const DoctorSelection: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<string>("consultation");
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [patientNotes, setPatientNotes] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Fetch doctors
  const { data: doctors, isLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors", selectedSpecialty],
    queryFn: async () => {
      const specialtyParam = selectedSpecialty === "All Specialties" ? "" : `?specialty=${encodeURIComponent(selectedSpecialty)}`;
      return apiRequest(`/api/doctors${specialtyParam}`);
    },
  });

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      return apiRequest("/api/appointments", {
        method: "POST",
        body: JSON.stringify(appointmentData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Appointment booked successfully",
        description: "You will receive a confirmation email shortly.",
      });
      setShowBookingForm(false);
      setSelectedDoctor(null);
      setSelectedDate(undefined);
      setSelectedTime("");
      setPatientNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: "Failed to book appointment. Please try again.",
      });
      console.error("Booking error:", error);
    },
  });

  const filteredDoctors = doctors?.filter(doctor => 
    doctor.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.bio.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const generateTimeSlots = (date: Date) => {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = setMinutes(setHours(new Date(), hour), minute);
        const timeString = format(timeSlot, "HH:mm");
        
        // Skip past time slots for today
        if (format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")) {
          if (isBefore(timeSlot, new Date())) continue;
        }
        
        slots.push(timeString);
      }
    }
    
    return slots;
  };

  const handleBookAppointment = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !userProfile) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a doctor, date, and time for your appointment.",
      });
      return;
    }

    const appointmentDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const appointmentData = {
      patientId: userProfile.id,
      doctorId: selectedDoctor.id,
      appointmentDate: appointmentDateTime.toISOString(),
      type: appointmentType,
      isVideoCall,
      consultationFee: selectedDoctor.consultationFee,
      patientNotes: patientNotes || null,
      status: "scheduled",
      duration: 30
    };

    bookAppointmentMutation.mutate(appointmentData);
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="doctors-loading">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="doctor-selection">
      {!showBookingForm ? (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search doctors by name, specialty, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-doctors"
                />
              </div>
            </div>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-specialty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {specialties.map(specialty => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Doctors List */}
          <div className="space-y-4">
            {filteredDoctors.length === 0 ? (
              <Card data-testid="no-doctors-message">
                <CardContent className="p-12 text-center">
                  <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    No doctors found matching your criteria
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Try adjusting your search or specialty filter
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="hover:shadow-md transition-shadow" data-testid={`doctor-card-${doctor.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={doctor.user.profilePicture} />
                        <AvatarFallback>
                          {doctor.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid={`doctor-name-${doctor.id}`}>
                            Dr. {doctor.user.name}
                          </h3>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{parseFloat(doctor.rating).toFixed(1)}</span>
                            <span>({doctor.reviewCount} reviews)</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <Stethoscope className="w-4 h-4" />
                            <span>{doctor.specialty}</span>
                            <Badge variant="outline">{doctor.experience} years experience</Badge>
                          </div>
                          
                          {doctor.education && doctor.education.length > 0 && (
                            <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <GraduationCap className="w-4 h-4 mt-0.5" />
                              <span>{doctor.education[0]}</span>
                            </div>
                          )}
                          
                          {doctor.languages && doctor.languages.length > 0 && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <Languages className="w-4 h-4" />
                              <span>{doctor.languages.join(", ")}</span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2" data-testid={`doctor-bio-${doctor.id}`}>
                          {doctor.bio}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold text-primary">
                            GHS {doctor.consultationFee} per consultation
                          </div>
                          <Button 
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setShowBookingForm(true);
                            }}
                            data-testid={`button-book-${doctor.id}`}
                          >
                            Book Appointment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        /* Booking Form */
        <Card data-testid="booking-form">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Book Appointment with Dr. {selectedDoctor?.user.name}</CardTitle>
              <Button variant="outline" onClick={() => setShowBookingForm(false)}>
                Back to Doctors
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => 
                    isBefore(date, new Date()) || 
                    isAfter(date, addDays(new Date(), 30))
                  }
                  className="rounded-md border"
                />
              </div>
              
              {/* Time Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Time</Label>
                  {selectedDate ? (
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {generateTimeSlots(selectedDate).map(time => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(time)}
                          data-testid={`time-slot-${time}`}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Please select a date first</p>
                  )}
                </div>
                
                {/* Appointment Type */}
                <div className="space-y-2">
                  <Label>Appointment Type</Label>
                  <Select value={appointmentType} onValueChange={setAppointmentType}>
                    <SelectTrigger data-testid="select-appointment-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="routine_checkup">Routine Checkup</SelectItem>
                      <SelectItem value="specialist_visit">Specialist Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Video Call Option */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="video-call"
                    checked={isVideoCall}
                    onChange={(e) => setIsVideoCall(e.target.checked)}
                    className="w-4 h-4"
                    data-testid="checkbox-video-call"
                  />
                  <Label htmlFor="video-call" className="flex items-center space-x-1">
                    <Video className="w-4 h-4" />
                    <span>Video Consultation</span>
                  </Label>
                </div>
              </div>
            </div>
            
            {/* Patient Notes */}
            <div className="space-y-2">
              <Label htmlFor="patient-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="patient-notes"
                placeholder="Describe your symptoms or reason for the appointment..."
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                rows={3}
                data-testid="textarea-patient-notes"
              />
            </div>
            
            {/* Summary */}
            {selectedDate && selectedTime && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Appointment Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Doctor:</strong> Dr. {selectedDoctor?.user.name}</p>
                  <p><strong>Date:</strong> {format(selectedDate, "PPP")}</p>
                  <p><strong>Time:</strong> {selectedTime}</p>
                  <p><strong>Type:</strong> {appointmentType} {isVideoCall && "(Video Call)"}</p>
                  <p><strong>Fee:</strong> ${selectedDoctor?.consultationFee}</p>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleBookAppointment}
              className="w-full"
              disabled={!selectedDate || !selectedTime || bookAppointmentMutation.isPending}
              data-testid="button-confirm-booking"
            >
              {bookAppointmentMutation.isPending ? "Booking..." : "Confirm Appointment"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorSelection;