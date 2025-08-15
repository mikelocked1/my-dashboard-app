import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: "user" | "doctor") => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string, role: "user" | "doctor") => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in our database
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email!,
          name,
          role,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create user profile");
      }
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Get user profile from our database
          const response = await fetch(`/api/users/${user.uid}`);
          if (response.ok) {
            const profile = await response.json();
            setUserProfile(profile);
          } else if (response.status === 404) {
            // If user doesn't exist in our database, create them
            try {
              const createResponse = await fetch("/api/users", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  firebaseUid: user.uid,
                  email: user.email!,
                  name: user.displayName || user.email!.split('@')[0],
                  role: "user",
                }),
              });
              
              if (createResponse.ok) {
                const newProfile = await createResponse.json();
                setUserProfile(newProfile);
              } else {
                setUserProfile(null);
              }
            } catch (createError) {
              console.error("Error creating user profile:", createError);
              setUserProfile(null);
            }
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
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
      {!loading && children}
    </AuthContext.Provider>
  );
};
