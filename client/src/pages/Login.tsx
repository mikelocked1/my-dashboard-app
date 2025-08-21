import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Login: React.FC = () => {
  const { login, register } = useAuth();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerRole, setRegisterRole] = useState<"user" | "doctor">("user");

  // Doctor-specific registration fields
  const [doctorSpecialty, setDoctorSpecialty] = useState("");
  const [doctorExperience, setDoctorExperience] = useState(1);
  const [doctorConsultationFee, setDoctorConsultationFee] = useState("");
  const [doctorBio, setDoctorBio] = useState("");
  const [doctorEducation, setDoctorEducation] = useState("");
  const [doctorLanguages, setDoctorLanguages] = useState("English");

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
    "Urology",
    "Internal Medicine"
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!loginEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!loginPassword.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Attempt to login the user
      await login(loginEmail.trim(), loginPassword);
      toast({
        title: "Login Successful",
        description: "Welcome back to SmartCare!",
      });
    } catch (error: any) {
      // Log the specific email being attempted for login for better debugging
      console.error(`Login attempt failed for email: ${loginEmail.trim()}`);
      console.error("Login error details:", error);
      // Provide a more user-friendly error message
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!registerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    if (!registerEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!registerPassword.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a password.",
        variant: "destructive",
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Additional validation for doctors
    if (registerRole === "doctor") {
      if (!doctorSpecialty) {
        toast({
          title: "Validation Error",
          description: "Please select your medical specialty.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!doctorConsultationFee.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter your consultation fee.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (isNaN(Number(doctorConsultationFee)) || Number(doctorConsultationFee) <= 0) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid consultation fee.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!doctorBio.trim()) {
        toast({
          title: "Validation Error",
          description: "Please provide a brief bio about yourself.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!doctorEducation.trim()) {
        toast({
          title: "Validation Error",
          description: "Please provide your educational background.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      // Prepare doctor information if registering as a doctor
      const doctorInfo = registerRole === "doctor" ? {
        specialty: doctorSpecialty,
        experience: doctorExperience,
        consultationFee: doctorConsultationFee,
        bio: doctorBio.trim(),
        education: doctorEducation.trim(),
        languages: doctorLanguages.trim()
      } : undefined;

      // Attempt to register the user
      await register(registerEmail.trim(), registerPassword, registerName.trim(), registerRole, doctorInfo);
      toast({
        title: "Registration Successful",
        description: registerRole === "doctor" 
          ? "Your doctor account has been created and is pending approval!" 
          : "Your account has been created successfully!",
      });
    } catch (error: any) {
      // Log the specific email being attempted for registration for better debugging
      console.error(`Registration attempt failed for email: ${registerEmail.trim()}`);
      console.error("Registration error details:", error);
      // Provide a more user-friendly error message
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration. The email might already be in use.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">SmartCare</h1>
          <p className="text-gray-600 dark:text-gray-300">Your intelligent healthcare companion</p>
        </div>

        {/* Welcome Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
              🎓 School Healthcare Project
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-blue-700 dark:text-blue-300">
            <div>Welcome to SmartCare - Your Healthcare Companion</div>
            <div className="text-blue-600 dark:text-blue-400 mt-2">
              Create an account or login to access your health dashboard
            </div>
          </CardContent>
        </Card>

        {/* Auth Form */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-gray-900 dark:text-white">
              Welcome Back
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-orange-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-role">Role</Label>
                    <Select value={registerRole} onValueChange={(value: "user" | "doctor") => setRegisterRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Patient</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Doctor-specific fields */}
                  {registerRole === "doctor" && (
                    <>
                      <div>
                        <Label htmlFor="doctor-specialty">Medical Specialty *</Label>
                        <Select value={doctorSpecialty} onValueChange={setDoctorSpecialty}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your specialty" />
                          </SelectTrigger>
                          <SelectContent>
                            {specialties.map((specialty) => (
                              <SelectItem key={specialty} value={specialty}>
                                {specialty}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="doctor-experience">Years of Experience</Label>
                        <Input
                          id="doctor-experience"
                          type="number"
                          min="1"
                          max="50"
                          placeholder="Years of experience"
                          value={doctorExperience}
                          onChange={(e) => setDoctorExperience(Number(e.target.value))}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="doctor-consultation-fee">Consultation Fee (GHS) *</Label>
                        <Input
                          id="doctor-consultation-fee"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 150.00"
                          value={doctorConsultationFee}
                          onChange={(e) => setDoctorConsultationFee(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="doctor-bio">Professional Bio *</Label>
                        <textarea
                          id="doctor-bio"
                          placeholder="Brief description of your expertise and approach to patient care"
                          value={doctorBio}
                          onChange={(e) => setDoctorBio(e.target.value)}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          maxLength={500}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">{doctorBio.length}/500 characters</p>
                      </div>

                      <div>
                        <Label htmlFor="doctor-education">Education & Qualifications *</Label>
                        <textarea
                          id="doctor-education"
                          placeholder="e.g., MD from University of Ghana, Residency at Korle Bu Teaching Hospital"
                          value={doctorEducation}
                          onChange={(e) => setDoctorEducation(e.target.value)}
                          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          maxLength={300}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">{doctorEducation.length}/300 characters</p>
                      </div>

                      <div>
                        <Label htmlFor="doctor-languages">Languages Spoken</Label>
                        <Input
                          id="doctor-languages"
                          type="text"
                          placeholder="e.g., English, Twi, French"
                          value={doctorLanguages}
                          onChange={(e) => setDoctorLanguages(e.target.value)}
                        />
                      </div>

                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          📋 Your doctor account will be reviewed by an administrator before approval. 
                          You'll receive an email notification once your account is verified.
                        </p>
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-orange-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p>© 2024 SmartCare. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;