// Mock authentication for school project
export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'doctor' | 'admin';
}

export const mockUsers: MockUser[] = [
  {
    uid: 'user1',
    email: 'patient@example.com',
    displayName: 'John Patient',
    role: 'user'
  },
  {
    uid: 'doctor1', 
    email: 'doctor@example.com',
    displayName: 'Dr. Sarah Wilson',
    role: 'doctor'
  },
  {
    uid: 'admin1',
    email: 'admin@example.com', 
    displayName: 'Admin User',
    role: 'admin'
  }
];

export class MockAuth {
  private currentUser: MockUser | null = null;
  private listeners: Array<(user: MockUser | null) => void> = [];

  async signInWithEmailAndPassword(email: string, password: string): Promise<{ user: MockUser }> {
    // Simple mock login - any password works for demo
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }
    
    this.currentUser = user;
    this.notifyListeners();
    return { user };
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<{ user: MockUser }> {
    const newUser: MockUser = {
      uid: `user${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      role: 'user'
    };
    
    mockUsers.push(newUser);
    this.currentUser = newUser;
    this.notifyListeners();
    return { user: newUser };
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.notifyListeners();
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

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

export const mockAuth = new MockAuth();