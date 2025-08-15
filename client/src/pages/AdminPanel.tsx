import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Users, 
  Stethoscope, 
  GraduationCap, 
  DollarSign,
  Star,
  Shield,
  UserPlus
} from "lucide-react";

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
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface NewDoctorFormData {
  name: string;
  email: string;
  specialty: string;
  experience: number;
  consultationFee: string;
  bio: string;
  education: string;
  languages: string;
}

const specialties = [
  "General Practice",
  "Cardiology", 
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Rheumatology",
  "Urology"
];

const AdminPanel: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("doctors");
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [formData, setFormData] = useState<NewDoctorFormData>({
    name: "",
    email: "",
    specialty: "",
    experience: 1,
    consultationFee: "",
    bio: "",
    education: "",
    languages: "English"
  });

  // Check if user is admin
  if (!userProfile || userProfile.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You need administrator privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch all doctors
  const { data: doctors, isLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
    queryFn: () => apiRequest("/api/doctors"),
  });

  // Add doctor mutation
  const addDoctorMutation = useMutation({
    mutationFn: async (doctorData: NewDoctorFormData) => {
      // First create user account
      const userData = {
        firebaseUid: `admin_created_${Date.now()}`,
        email: doctorData.email,
        name: doctorData.name,
        role: "doctor"
      };
      
      const user = await apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      // Then create doctor profile
      const doctor = {
        userId: user.id,
        specialty: doctorData.specialty,
        experience: doctorData.experience,
        consultationFee: doctorData.consultationFee,
        bio: doctorData.bio,
        education: doctorData.education.split(",").map(e => e.trim()),
        languages: doctorData.languages.split(",").map(l => l.trim())
      };

      return apiRequest("/api/doctors", {
        method: "POST",
        body: JSON.stringify(doctor),
      });
    },
    onSuccess: () => {
      toast({
        title: "Doctor Added Successfully",
        description: "The new doctor has been added to the system.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      setShowAddDoctor(false);
      setFormData({
        name: "",
        email: "",
        specialty: "",
        experience: 1,
        consultationFee: "",
        bio: "",
        education: "",
        languages: "English"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Doctor",
        description: error.message || "There was an error adding the doctor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.specialty || !formData.consultationFee || !formData.bio) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    addDoctorMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof NewDoctorFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-panel">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage doctors, users, and system settings.
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
          <Shield className="w-4 h-4 mr-1" />
          Administrator
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList data-testid="admin-tabs">
          <TabsTrigger value="doctors">
            <Stethoscope className="w-4 h-4 mr-2" />
            Doctors ({doctors?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" data-testid="doctors-management">
          {!showAddDoctor ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Doctor Management
                </h2>
                <Button 
                  onClick={() => setShowAddDoctor(true)}
                  data-testid="button-add-doctor"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Doctor
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors?.map((doctor) => (
                  <Card key={doctor.id} className="hover:shadow-md transition-shadow" data-testid={`doctor-admin-card-${doctor.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {doctor.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Dr. {doctor.user.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {doctor.specialty}
                          </p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Star className="w-3 h-3 mr-1 text-yellow-400" />
                            <span>{parseFloat(doctor.rating).toFixed(1)}</span>
                            <span className="mx-1">•</span>
                            <span>{doctor.experience} years</span>
                          </div>
                          <div className="flex items-center mt-1 text-sm font-medium text-primary">
                            <DollarSign className="w-3 h-3 mr-1" />
                            ${doctor.consultationFee}
                          </div>
                          <div className="mt-2">
                            <Badge 
                              variant={doctor.isAvailable ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {doctor.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {(!doctors || doctors.length === 0) && (
                  <Card className="col-span-full">
                    <CardContent className="p-12 text-center">
                      <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No doctors found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Get started by adding your first doctor to the system.
                      </p>
                      <Button onClick={() => setShowAddDoctor(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add First Doctor
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card data-testid="add-doctor-form">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add New Doctor</CardTitle>
                  <Button variant="outline" onClick={() => setShowAddDoctor(false)}>
                    Back to List
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter doctor's full name"
                        required
                        data-testid="input-doctor-name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="Enter email address"
                        required
                        data-testid="input-doctor-email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="specialty">Specialty *</Label>
                      <Select value={formData.specialty} onValueChange={(value) => handleInputChange("specialty", value)}>
                        <SelectTrigger data-testid="select-doctor-specialty">
                          <SelectValue placeholder="Select specialty" />
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience *</Label>
                      <Input
                        id="experience"
                        type="number"
                        min="1"
                        max="50"
                        value={formData.experience}
                        onChange={(e) => handleInputChange("experience", parseInt(e.target.value) || 1)}
                        required
                        data-testid="input-doctor-experience"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fee">Consultation Fee ($) *</Label>
                      <Input
                        id="fee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.consultationFee}
                        onChange={(e) => handleInputChange("consultationFee", e.target.value)}
                        placeholder="150.00"
                        required
                        data-testid="input-doctor-fee"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="languages">Languages</Label>
                      <Input
                        id="languages"
                        value={formData.languages}
                        onChange={(e) => handleInputChange("languages", e.target.value)}
                        placeholder="English, Spanish, French"
                        data-testid="input-doctor-languages"
                      />
                      <p className="text-sm text-gray-500">Separate multiple languages with commas</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Input
                      id="education"
                      value={formData.education}
                      onChange={(e) => handleInputChange("education", e.target.value)}
                      placeholder="MD from Harvard Medical School, Residency at Johns Hopkins"
                      data-testid="input-doctor-education"
                    />
                    <p className="text-sm text-gray-500">Separate multiple entries with commas</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio/Description *</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Enter a brief description of the doctor's expertise and background..."
                      rows={4}
                      required
                      data-testid="textarea-doctor-bio"
                    />
                  </div>
                  
                  <div className="flex items-center justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddDoctor(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={addDoctorMutation.isPending}
                      data-testid="button-submit-doctor"
                    >
                      {addDoctorMutation.isPending ? "Adding Doctor..." : "Add Doctor"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" data-testid="users-management">
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                User Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                User management features coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;