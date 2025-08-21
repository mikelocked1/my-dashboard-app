import React, { createContext, useContext, useEffect, useState } from "react";
import { mockAuth, type MockUser } from "@/lib/mockAuth";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthContextType {
  currentUser: MockUser | null;
  userProfile: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: "user" | "doctor",
    doctorInfo?: {
      specialty: string;
      experience: number;
      consultationFee: string;
      bio: string;
      education: string;
      languages: string;
    }
  ) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      const { user } = await mockAuth.signInWithEmailAndPassword(email, password);
      setCurrentUser(user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: "user" | "doctor" = "user",
    doctorInfo?: {
      specialty: string;
      experience: number;
      consultationFee: string;
      bio: string;
      education: string;
      languages: string;
    }
  ) => {
    try {
      const { user } = await mockAuth.createUserWithEmailAndPassword(email, password);
      setCurrentUser(user);
      
      // Create user profile in our database
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name,
          role,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create user profile");
      }
      
      const userProfile = await response.json();
      
      // If registering as a doctor with additional info, create doctor profile
      if (role === "doctor" && doctorInfo) {
        const doctorData = {
          userId: userProfile.id,
          specialty: doctorInfo.specialty,
          experience: doctorInfo.experience,
          consultationFee: doctorInfo.consultationFee,
          bio: doctorInfo.bio,
          education: doctorInfo.education.split(",").map((e: string) => e.trim()),
          languages: doctorInfo.languages.split(",").map((l: string) => l.trim()),
          status: "pending", // Doctor needs admin approval
          isAvailable: false, // Not available until approved
        };

        const doctorResponse = await fetch("/api/doctors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(doctorData),
        });

        if (!doctorResponse.ok) {
          throw new Error("Failed to create doctor profile");
        }
      }
      
    } catch (error) {
      console.error("Error during registration:", error);
      throw error;
    }
  };

  const logout = async () => {
    await mockAuth.signOut();
    setCurrentUser(null);
    setUserProfile(null);
  };

  useEffect(() => {
    const unsubscribe = mockAuth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch or create user profile
        const fetchUserProfile = async () => {
          try {
            const response = await fetch(`/api/users/${user.uid}`);
            if (response.ok) {
              const profile = await response.json();
              setUserProfile(profile);
            } else {
              // Create user profile if it doesn't exist
              const createResponse = await fetch("/api/users", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  firebaseUid: user.uid,
                  email: user.email,
                  name: user.displayName || user.email.split('@')[0],
                  role: user.role || "user",
                }),
              });
              
              if (createResponse.ok) {
                const newProfile = await createResponse.json();
                setUserProfile(newProfile);
              } else {
                setUserProfile(null);
              }
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
          } finally {
            setLoading(false);
          }
        };
        
        fetchUserProfile();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};