import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import type { 
  User, InsertUser, 
  Doctor, InsertDoctor,
  HealthData, InsertHealthData,
  Appointment, InsertAppointment,
  HealthAlert, InsertHealthAlert,
  AiHealthTip, InsertAiHealthTip
} from "@shared/schema";

// Users
export const createUser = async (userData: InsertUser): Promise<string> => {
  const docRef = await addDoc(collection(db, "users"), {
    ...userData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getUser = async (id: string): Promise<User | null> => {
  const docSnap = await getDoc(doc(db, "users", id));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as User;
  }
  return null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const q = query(collection(db, "users"), where("email", "==", email));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }
  return null;
};

export const updateUser = async (id: string, userData: Partial<InsertUser>): Promise<void> => {
  const userRef = doc(db, "users", id);
  await updateDoc(userRef, {
    ...userData,
    updatedAt: Timestamp.now(),
  });
};

// Doctors
export const createDoctor = async (doctorData: InsertDoctor): Promise<string> => {
  const docRef = await addDoc(collection(db, "doctors"), {
    ...doctorData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getDoctors = async (): Promise<Doctor[]> => {
  const querySnapshot = await getDocs(collection(db, "doctors"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
};

// Health Data
export const createHealthData = async (healthData: InsertHealthData): Promise<string> => {
  const docRef = await addDoc(collection(db, "healthData"), {
    ...healthData,
    timestamp: Timestamp.fromDate(healthData.timestamp),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getHealthDataByUser = async (userId: string, dataType?: string): Promise<HealthData[]> => {
  let q = query(
    collection(db, "healthData"), 
    where("userId", "==", userId),
    orderBy("timestamp", "desc")
  );
  
  if (dataType) {
    q = query(q, where("type", "==", dataType));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthData));
};

// Appointments
export const createAppointment = async (appointmentData: InsertAppointment): Promise<string> => {
  const docRef = await addDoc(collection(db, "appointments"), {
    ...appointmentData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getAppointmentsByUser = async (userId: string, role: string): Promise<Appointment[]> => {
  const field = role === "doctor" ? "doctorId" : "patientId";
  const q = query(
    collection(db, "appointments"), 
    where(field, "==", userId),
    orderBy("date", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
};

// Health Alerts
export const createHealthAlert = async (alertData: InsertHealthAlert): Promise<string> => {
  const docRef = await addDoc(collection(db, "healthAlerts"), {
    ...alertData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getHealthAlertsByUser = async (userId: string): Promise<HealthAlert[]> => {
  const q = query(
    collection(db, "healthAlerts"), 
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(10)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthAlert));
};

// AI Health Tips
export const getAIHealthTipsByUser = async (userId: string): Promise<AiHealthTip[]> => {
  const q = query(
    collection(db, "aiHealthTips"), 
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(5)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AiHealthTip));
};
