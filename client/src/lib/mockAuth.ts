// Mock authentication for school project
export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'doctor' | 'admin';
}

// Assuming StoredUser also exists and includes a password
interface StoredUser extends MockUser {
  password: string;
}

export const mockUsers: StoredUser[] = [
  {
    uid: 'admin_uid_default',
    email: 'admin@healthsync.com',
    displayName: 'System Administrator',
    role: 'admin',
    password: 'adminpassword' // Added password for mock
  },
  {
    uid: 'dr-sarah-wilson-001',
    email: 'dr.sarah.wilson@smartcare.com',
    displayName: 'Dr. Sarah Wilson',
    role: 'doctor',
    password: 'drpassword' // Added password for mock
  },
  {
    uid: 'patient_demo_001',
    email: 'patient@demo.com',
    displayName: 'Demo Patient',
    role: 'user',
    password: 'patientpassword' // Added password for mock
  }
];

export class MockAuth {
  private currentUser: MockUser | null = null;
  private listeners: Array<(user: MockUser | null) => void> = [];
  private STORAGE_KEY = 'mockAuthUsers';

  constructor() {
    // Ensure default users are always available
    this.initializeDefaultUsers();
  }

  private initializeDefaultUsers() {
    const storedUsers = localStorage.getItem(this.STORAGE_KEY);
    if (!storedUsers) {
      console.log('Initializing default users...');
      this.saveUsers(mockUsers);
    }
  }

  // Helper to get users from localStorage or mockUsers if not found
  private getUsers(): StoredUser[] {
    const storedUsers = localStorage.getItem(this.STORAGE_KEY);
    if (storedUsers) {
      try {
        // Ensure stored users conform to StoredUser interface
        const parsedUsers: StoredUser[] = JSON.parse(storedUsers);
        // Basic validation to ensure all required fields are present
        return parsedUsers.filter(u => u.uid && u.email && u.password && u.displayName && u.role);
      } catch (e) {
        console.error("Failed to parse stored users:", e);
        return mockUsers; // Fallback to initial mock users
      }
    }
    return mockUsers;
  }

  // Helper to save users to localStorage
  private saveUsers(users: StoredUser[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<{ user: MockUser }> {
    console.log("Attempting to sign in with:", { email, password: '***' });
    
    if (!email || !password) {
      const error = new Error("Email and password are required");
      console.error("Sign in failed:", error.message);
      throw error;
    }

    const users = this.getUsers();
    console.log("Available users:", users.map(u => ({ email: u.email, uid: u.uid })));
    
    const user = users.find(u => u.email === email && u.password === password);
    console.log("Found user:", user ? { email: user.email, uid: user.uid } : null);

    if (!user) {
      const error = new Error("Invalid email or password");
      console.error("Sign in failed:", error.message);
      throw error;
    }

    const authUser: MockUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role
    };

    this.currentUser = authUser;
    console.log("Successfully signed in user:", authUser);
    this.notifyListeners(); // Use the existing notifyListeners method

    return { user: authUser };
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<{ user: MockUser }> {
    console.log("Attempting to create user with:", { email, password: '***' });
    
    if (!email || !password) {
      const error = new Error("Email and password are required");
      console.error("Registration failed:", error.message);
      throw error;
    }

    if (password.length < 6) {
      const error = new Error("Password must be at least 6 characters long");
      console.error("Registration failed:", error.message);
      throw error;
    }

    const users = this.getUsers();
    const existingUser = users.find(u => u.email === email);
    console.log("Checking existing user:", existingUser ? { email: existingUser.email } : null);

    if (existingUser) {
      const error = new Error("Email already in use");
      console.error("Registration failed:", error.message);
      throw error;
    }

    const uid = `user${Date.now()}`;
    const newUser: StoredUser = {
      uid,
      email,
      password, // Store password for potential future use or verification
      displayName: email.split('@')[0],
      role: "user"
    };

    users.push(newUser);
    this.saveUsers(users); // Use saveUsers helper
    console.log("Created new user:", { email: newUser.email, uid: newUser.uid });

    const authUser: MockUser = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName,
      role: newUser.role
    };

    this.currentUser = authUser;
    console.log("Successfully registered user:", authUser);
    this.notifyListeners(); // Use the existing notifyListeners method

    return { user: authUser };
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.notifyListeners(); // Use the existing notifyListeners method
  }

  getCurrentUser(): MockUser | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: MockUser | null) => void): () => void {
    this.listeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);

    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Renamed to match the original code's internal method name
  private notifyAuthStateChanged(user: MockUser | null) {
    this.listeners.forEach(listener => listener(user));
  }

  // Keep the original notifyListeners for consistency if it's used elsewhere,
  // or ensure all calls are updated to notifyAuthStateChanged.
  // For now, assuming notifyAuthStateChanged is the intended method.
  private notifyListeners() {
    this.notifyAuthStateChanged(this.currentUser);
  }
}

export const mockAuth = new MockAuth();