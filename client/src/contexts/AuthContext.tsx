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
  ): Promise<void> => {
    try {
      const { user: firebaseUser } = await mockAuth.createUserWithEmailAndPassword(email, password);
      setCurrentUser(firebaseUser);

      // Create user in database
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email!,
        name,
        role,
      };

      const response = await apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      if (!response.id) {
        throw new Error("Failed to create user in database");
      }

      // If registering as a doctor with additional info, create/update doctor profile
      if (role === "doctor" && doctorInfo) {
        const doctorData = {
          userId: response.id,
          specialty: doctorInfo.specialty,
          experience: doctorInfo.experience,
          consultationFee: doctorInfo.consultationFee,
          bio: doctorInfo.bio,
          education: doctorInfo.education.split(',').map(edu => edu.trim()).filter(edu => edu),
          languages: doctorInfo.languages.split(',').map(lang => lang.trim()).filter(lang => lang),
          status: "pending",
          isAvailable: false,
        };

        try {
          await apiRequest("/api/doctors", {
            method: "POST",
            body: JSON.stringify(doctorData),
          });
        } catch (doctorError) {
          console.error("Failed to create doctor profile:", doctorError);
          // Don't throw error here as user account was already created
        }
      }

      setUserProfile(response);

    } catch (error: any) {
      console.error("Error during registration:", error);
      // If database creation fails, clean up the auth user
      if (currentUser) {
        await mockAuth.signOut();
        setCurrentUser(null);
      }
      throw new Error(error.message || "Registration failed");
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
            } else if (response.status === 404) {
              // Create user profile if it doesn't exist
              const createResponse = await fetch("/api/users", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  firebaseUid: user.uid,
                  email: user.email || `${user.uid}@example.com`,
                  name: user.displayName || user.email?.split('@')[0] || 'User',
                  role: "user",
                }),
              });

              if (createResponse.ok) {
                const newProfile = await createResponse.json();
                setUserProfile(newProfile);
              } else {
                console.error("Failed to create user profile");
                setUserProfile(null);
              }
            } else {
              console.error("Failed to fetch user profile");
              setUserProfile(null);
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