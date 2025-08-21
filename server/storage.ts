import {
  type User,
  type InsertUser,
  type Doctor,
  type InsertDoctor,
  type HealthData,
  type InsertHealthData,
  type Appointment,
  type InsertAppointment,
  type HealthAlert,
  type InsertHealthAlert,
  type AiHealthTip,
  type InsertAiHealthTip,
  users,
  doctors,
  healthData,
  appointments,
  healthAlerts,
  aiHealthTips
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Doctors
  getDoctors(): Promise<(Doctor & { user: User })[]>;
  getDoctorById(id: number): Promise<(Doctor & { user: User }) | undefined>;
  getDoctorsBySpecialty(specialty: string): Promise<(Doctor & { user: User })[]>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: number, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined>;
  getDoctorByUserId(userId: number): Promise<(Doctor & { user: User }) | undefined>;
  getApprovedDoctors(): Promise<(Doctor & { user: User })[]>;
  seedPreloadedDoctors(): Promise<void>;
  getPendingDoctors(): Promise<any[]>;
  approveDoctor(doctorId: number, approvedBy: number): Promise<any | null>;
  rejectDoctor(doctorId: number, rejectionReason: string): Promise<any | null>;


  // Health Data
  getHealthDataByUser(userId: number, limit?: number): Promise<HealthData[]>;
  getHealthDataByType(userId: number, type: string, startDate?: Date, endDate?: Date): Promise<HealthData[]>;
  createHealthData(data: InsertHealthData): Promise<HealthData>;
  updateHealthData(id: number, data: Partial<InsertHealthData>): Promise<HealthData | undefined>;
  deleteHealthData(id: number): Promise<boolean>;

  // Appointments
  getAppointmentsByPatient(patientId: number): Promise<(Appointment & { doctor: Doctor & { user: User } })[]>;
  getAppointmentsByDoctor(doctorId: number): Promise<(Appointment & { patient: User })[]>;
  getUpcomingAppointments(userId: number, isDoctor?: boolean): Promise<any[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;

  // Health Alerts
  getHealthAlerts(userId: number, limit?: number): Promise<HealthAlert[]>;
  createHealthAlert(alert: InsertHealthAlert): Promise<HealthAlert>;
  markAlertAsRead(id: number): Promise<boolean>;

  // AI Health Tips
  getAiHealthTips(userId: number, limit?: number): Promise<AiHealthTip[]>;
  createAiHealthTip(tip: InsertAiHealthTip): Promise<AiHealthTip>;
  markTipAsRead(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    return result[0] || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await this.db.select().from(users);
      return result;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set({ ...user, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return result[0] || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // First delete related records
      await this.db.delete(doctors).where(eq(doctors.userId, id));
      await this.db.delete(healthData).where(eq(healthData.userId, id));
      await this.db.delete(appointments).where(eq(appointments.patientId, id));
      await this.db.delete(healthAlerts).where(eq(healthAlerts.userId, id));
      await this.db.delete(aiHealthTips).where(eq(aiHealthTips.userId, id));

      // Then delete the user
      const result = await this.db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  // Doctors
  async getDoctors(): Promise<(Doctor & { user: User })[]> {
    try {
      const result = await db
        .select()
        .from(doctors)
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(eq(doctors.isAvailable, true));

      if (!Array.isArray(result)) {
        return [];
      }

      return result.map((row: any) => ({
        ...row.doctors,
        user: row.users!
      }));
    } catch (error) {
      console.error('Error in getDoctors:', error);
      return [];
    }
  }

  async getDoctorById(id: number): Promise<(Doctor & { user: User }) | undefined> {
    try {
      const result = await db
        .select()
        .from(doctors)
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(eq(doctors.id, id))
        .limit(1);

      if (!Array.isArray(result) || result.length === 0) {
        return undefined;
      }

      if (result[0]) {
        return {
          ...result[0].doctors,
          user: result[0].users!
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error in getDoctorById:', error);
      return undefined;
    }
  }

  async getDoctorsBySpecialty(specialty: string): Promise<(Doctor & { user: User })[]> {
    try {
      const result = await db
        .select()
        .from(doctors)
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(and(eq(doctors.specialty, specialty), eq(doctors.isAvailable, true), eq(doctors.status, "approved"))); // Filter for approved doctors

      if (!Array.isArray(result)) {
        return [];
      }

      return result.map((row: any) => ({
        ...row.doctors,
        user: row.users!
      }));
    } catch (error) {
      console.error('Error in getDoctorsBySpecialty:', error);
      return [];
    }
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const result = await db.insert(doctors).values(doctor).returning();
    return result[0];
  }

  async updateDoctor(id: number, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined> {
    const result = await db.update(doctors).set({ ...doctor, updatedAt: new Date() }).where(eq(doctors.id, id)).returning();
    return result[0] || undefined;
  }

  async getDoctorByUserId(userId: number): Promise<(Doctor & { user: User }) | undefined> {
    try {
      const result = await db
        .select()
        .from(doctors)
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(eq(doctors.userId, userId))
        .limit(1);

      if (!Array.isArray(result) || result.length === 0) {
        return undefined;
      }

      if (result[0]) {
        return {
          ...result[0].doctors,
          user: result[0].users!
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error in getDoctorByUserId:', error);
      return undefined;
    }
  }

  async getApprovedDoctors(): Promise<(Doctor & { user: User })[]> {
    try {
      const result = await db
        .select()
        .from(doctors)
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(and(eq(doctors.status, "approved"), eq(doctors.isAvailable, true)));

      if (!Array.isArray(result)) {
        return [];
      }

      return result.map((row: any) => ({
        ...row.doctors,
        user: row.users!
      }));
    } catch (error) {
      console.error('Error in getApprovedDoctors:', error);
      return [];
    }
  }

  async getPendingDoctors(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(doctors)
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(eq(doctors.status, "pending"));

      if (!Array.isArray(result)) {
        return [];
      }

      return result.map((row: any) => ({
        ...row.doctors,
        user: row.users!
      }));
    } catch (error) {
      console.error('Error in getPendingDoctors:', error);
      return [];
    }
  }

  async approveDoctor(doctorId: number, approvedBy: number): Promise<any | null> {
    try {
      const result = await db
        .update(doctors)
        .set({
          status: "approved",
          approvedBy: approvedBy,
          approvedAt: new Date(),
          isAvailable: true,
          updatedAt: new Date(),
        })
        .where(eq(doctors.id, doctorId))
        .returning();

      if (!result || result.length === 0) {
        return null;
      }

      // Fetch the user details for the approved doctor
      const doctorWithUser = await this.getDoctorById(doctorId);
      return doctorWithUser;
    } catch (error) {
      console.error('Error in approveDoctor:', error);
      return null;
    }
  }

  async rejectDoctor(doctorId: number, rejectionReason: string): Promise<any | null> {
    try {
      const result = await db
        .update(doctors)
        .set({
          status: "rejected",
          rejectionReason: rejectionReason,
          isAvailable: false,
          updatedAt: new Date(),
        })
        .where(eq(doctors.id, doctorId))
        .returning();

      if (!result || result.length === 0) {
        return null;
      }

      // Fetch the user details for the rejected doctor
      const doctorWithUser = await this.getDoctorById(doctorId);
      return doctorWithUser;
    } catch (error) {
      console.error('Error in rejectDoctor:', error);
      return null;
    }
  }

  async seedPreloadedDoctors(): Promise<void> {
    try {
      // Check if preloaded doctors already exist
      const existingDoctors = await this.getDoctors();
      if (existingDoctors.length > 0) {
        return; // Preloaded doctors already exist
      }

      console.log('Seeding preloaded doctors...');

      // Create admin user if not exists
      const adminUserResult = await db.select().from(users).where(eq(users.email, "admin@healthsync.com")).limit(1);
      if (adminUserResult.length === 0) {
        await db.insert(users).values({
          firebaseUid: "admin_uid_default",
          email: "admin@healthsync.com",
          name: "System Administrator",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      const adminUser = await db.select().from(users).where(eq(users.email, "admin@healthsync.com")).limit(1);
      const adminId = adminUser[0]?.id;

      const preloadedDoctorsData = [
        {
          user: {
            firebaseUid: 'dr-sarah-wilson-001',
            email: 'dr.sarah.wilson@smartcare.com',
            name: 'Dr. Sarah Wilson',
            role: 'doctor' as const,
          },
          doctor: {
            specialty: 'Cardiology',
            experience: 15,
            consultationFee: '150.00',
            bio: 'Experienced cardiologist with expertise in preventive cardiology and heart failure management. Committed to providing personalized care for each patient.',
            education: ['MD from University of Ghana Medical School', 'Cardiology Fellowship at Korle Bu Teaching Hospital'],
            languages: ['English', 'Twi'],
            isAvailable: true,
            status: 'approved' as const,
            approvedBy: adminId,
            approvedAt: new Date(),
          }
        },
        {
          user: {
            firebaseUid: 'dr-michael-chen-002',
            email: 'dr.michael.chen@smartcare.com',
            name: 'Dr. Michael Chen',
            role: 'doctor' as const,
          },
          doctor: {
            specialty: 'Internal Medicine',
            experience: 12,
            consultationFee: '120.00',
            bio: 'Family physician dedicated to comprehensive primary care for patients of all ages. Focus on preventive medicine and chronic disease management.',
            education: ['MD from Kwame Nkrumah University of Science and Technology', 'Family Medicine Residency'],
            languages: ['English', 'Twi', 'Ga'],
            isAvailable: true,
            status: 'approved' as const,
            approvedBy: adminId,
            approvedAt: new Date(),
          }
        },
        {
          user: {
            firebaseUid: 'dr-emily-rodriguez-003',
            email: 'dr.emily.rodriguez@smartcare.com',
            name: 'Dr. Emily Rodriguez',
            role: 'doctor' as const,
          },
          doctor: {
            specialty: 'Pediatrics',
            experience: 10,
            consultationFee: '130.00',
            bio: 'Pediatrician with over 12 years of experience in child healthcare. Specialized in developmental pediatrics and adolescent medicine.',
            education: ['MD from University of Cape Coast', 'Pediatrics Residency at Komfo Anokye Teaching Hospital'],
            languages: ['English', 'Twi', 'French'],
            isAvailable: true,
            status: 'approved' as const,
            approvedBy: adminId,
            approvedAt: new Date(),
          }
        },
        {
          user: {
            firebaseUid: 'dr-james-thompson-004',
            email: 'dr.james.thompson@smartcare.com',
            name: 'Dr. James Thompson',
            role: 'doctor' as const,
          },
          doctor: {
            specialty: 'Dermatology',
            experience: 8,
            consultationFee: '140.00',
            bio: 'Dermatologist focusing on medical and cosmetic treatments. Dedicated to improving skin health and appearance.',
            education: ['MD from Northwestern University', 'Dermatology Residency at University of Pennsylvania'],
            languages: ['English'],
            isAvailable: true,
            status: 'approved' as const,
            approvedBy: adminId,
            approvedAt: new Date(),
          }
        }
      ];

      for (const preloadedDoctor of preloadedDoctorsData) {
        // Create user first
        const createdUser = await this.createUser(preloadedDoctor.user);

        // Then create doctor profile
        await this.createDoctor({
          ...preloadedDoctor.doctor,
          userId: createdUser.id,
        });
      }

      console.log(`Successfully seeded ${preloadedDoctorsData.length} preloaded doctors`);
    } catch (error) {
      console.error('Error seeding preloaded doctors:', error);
    }
  }

  // Health Data
  async getHealthDataByUser(userId: number, limit: number = 50): Promise<HealthData[]> {
    try {
      const result = await db
        .select()
        .from(healthData)
        .where(eq(healthData.userId, userId))
        .orderBy(desc(healthData.timestamp))
        .limit(limit);

      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error in getHealthDataByUser:', error);
      return [];
    }
  }

  async getHealthDataByType(userId: number, type: string, startDate?: Date, endDate?: Date): Promise<HealthData[]> {
    try {
      const conditions = [eq(healthData.userId, userId), eq(healthData.type, type as any)];

      if (startDate) {
        conditions.push(gte(healthData.timestamp, startDate.toISOString()));
      }
      if (endDate) {
        conditions.push(lte(healthData.timestamp, endDate.toISOString()));
      }

      const result = await db
        .select()
        .from(healthData)
        .where(and(...conditions))
        .orderBy(desc(healthData.timestamp));

      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error in getHealthDataByType:', error);
      return [];
    }
  }

  async createHealthData(data: InsertHealthData): Promise<HealthData> {
    const result = await db.insert(healthData).values(data).returning();

    // Check for health alerts based on the new data
    const newData = result[0];
    await this.checkAndCreateHealthAlerts(newData);

    return newData;
  }

  async updateHealthData(id: number, data: Partial<InsertHealthData>): Promise<HealthData | undefined> {
    const result = await db.update(healthData).set(data).where(eq(healthData.id, id)).returning();
    return result[0] || undefined;
  }

  async deleteHealthData(id: number): Promise<boolean> {
    const result = await db.delete(healthData).where(eq(healthData.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Appointments
  async getAppointmentsByPatient(patientId: number): Promise<(Appointment & { doctor: Doctor & { user: User } })[]> {
    try {
      const result = await db
        .select()
        .from(appointments)
        .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(eq(appointments.patientId, patientId))
        .orderBy(desc(appointments.appointmentDate));

      if (!Array.isArray(result)) {
        return [];
      }

      return result.map((row: any) => ({
        ...row.appointments,
        doctor: {
          ...row.doctors!,
          user: row.users!
        }
      }));
    } catch (error) {
      console.error('Error in getAppointmentsByPatient:', error);
      return [];
    }
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<(Appointment & { patient: User })[]> {
    try {
      const result = await db
        .select()
        .from(appointments)
        .leftJoin(users, eq(appointments.patientId, users.id))
        .where(eq(appointments.doctorId, doctorId))
        .orderBy(desc(appointments.appointmentDate));

      if (!Array.isArray(result)) {
        return [];
      }

      return result.map((row: any) => ({
        ...row.appointments,
        patient: row.users!
      }));
    } catch (error) {
      console.error('Error in getAppointmentsByDoctor:', error);
      return [];
    }
  }

  async getUpcomingAppointments(userId: number, isDoctor: boolean = false): Promise<any[]> {
    try {
      const now = new Date();

      if (isDoctor) {
        const result = await db
          .select()
          .from(appointments)
          .leftJoin(users, eq(appointments.patientId, users.id))
          .where(and(
            eq(appointments.doctorId, userId),
            gte(appointments.appointmentDate, now),
            sql`${appointments.status} IN ('scheduled', 'confirmed')`
          ))
          .orderBy(appointments.appointmentDate)
          .limit(10);

        if (!Array.isArray(result)) {
          return [];
        }

        return result.map((row: any) => ({
          ...row.appointments,
          patient: row.users
        }));
      } else {
        const result = await db
          .select()
          .from(appointments)
          .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
          .leftJoin(users, eq(doctors.userId, users.id))
          .where(and(
            eq(appointments.patientId, userId),
            gte(appointments.appointmentDate, now),
            sql`${appointments.status} IN ('scheduled', 'confirmed')`
          ))
          .orderBy(appointments.appointmentDate)
          .limit(10);

        if (!Array.isArray(result)) {
          return [];
        }

        return result.map((row: any) => ({
          ...row.appointments,
          doctor: row.doctors && row.users ? { ...row.doctors, user: row.users } : null
        }));
      }
    } catch (error) {
      console.error('Error in getUpcomingAppointments:', error);
      return [];
    }
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values(appointment).returning();
    return result[0];
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const result = await db.update(appointments).set({ ...appointment, updatedAt: new Date() }).where(eq(appointments.id, id)).returning();
    return result[0] || undefined;
  }

  // Health Alerts
  async getHealthAlerts(userId: number, limit: number = 20): Promise<HealthAlert[]> {
    try {
      const result = await db
        .select()
        .from(healthAlerts)
        .where(eq(healthAlerts.userId, userId))
        .orderBy(desc(healthAlerts.createdAt))
        .limit(limit);

      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error in getHealthAlerts:', error);
      return [];
    }
  }

  async createHealthAlert(alert: InsertHealthAlert): Promise<HealthAlert> {
    const result = await db.insert(healthAlerts).values(alert).returning();
    return result[0];
  }

  async markAlertAsRead(id: number): Promise<boolean> {
    const result = await db.update(healthAlerts).set({ isRead: true }).where(eq(healthAlerts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // AI Health Tips
  async getAiHealthTips(userId: number, limit: number = 10): Promise<AiHealthTip[]> {
    try {
      const result = await db
        .select()
        .from(aiHealthTips)
        .where(eq(aiHealthTips.userId, userId))
        .orderBy(desc(aiHealthTips.createdAt))
        .limit(limit);

      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error in getAiHealthTips:', error);
      return [];
    }
  }

  async createAiHealthTip(tip: InsertAiHealthTip): Promise<AiHealthTip> {
    const result = await db.insert(aiHealthTips).values(tip).returning();
    return result[0];
  }

  async markTipAsRead(id: number): Promise<boolean> {
    const result = await db.update(aiHealthTips).set({ isRead: true }).where(eq(aiHealthTips.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Helper method to check and create health alerts based on health data
  private async checkAndCreateHealthAlerts(data: HealthData): Promise<void> {
    const alerts: InsertHealthAlert[] = [];

    switch (data.type) {
      case 'heart_rate':
        const hr = parseInt(data.value);
        if (hr > 100) {
          alerts.push({
            userId: data.userId,
            healthDataId: data.id,
            type: 'high_hr',
            title: 'High Heart Rate Alert',
            message: `Your heart rate of ${hr} bpm is above normal. Consider resting and consult a doctor if it persists.`,
            priority: hr > 120 ? 'high' : 'medium'
          });
        } else if (hr < 60) {
          alerts.push({
            userId: data.userId,
            healthDataId: data.id,
            type: 'low_hr',
            title: 'Low Heart Rate Alert',
            message: `Your heart rate of ${hr} bpm is below normal. Monitor closely and consult a doctor if you feel unwell.`,
            priority: hr < 40 ? 'high' : 'medium'
          });
        }
        break;

      case 'blood_pressure':
        if (data.systolic && data.diastolic) {
          if (data.systolic >= 140 || data.diastolic >= 90) {
            alerts.push({
              userId: data.userId,
              healthDataId: data.id,
              type: 'high_bp',
              title: 'High Blood Pressure Alert',
              message: `Your blood pressure of ${data.systolic}/${data.diastolic} mmHg is elevated. Please monitor closely and consult your doctor.`,
              priority: (data.systolic >= 160 || data.diastolic >= 100) ? 'critical' : 'high'
            });
          } else if (data.systolic <= 90 || data.diastolic <= 60) {
            alerts.push({
              userId: data.userId,
              healthDataId: data.id,
              type: 'low_bp',
              title: 'Low Blood Pressure Alert',
              message: `Your blood pressure of ${data.systolic}/${data.diastolic} mmHg is low. Stay hydrated and avoid sudden movements.`,
              priority: 'medium'
            });
          }
        }
        break;

      case 'blood_sugar':
        const sugar = parseInt(data.value);
        if (sugar > 180) {
          alerts.push({
            userId: data.userId,
            healthDataId: data.id,
            type: 'high_sugar',
            title: 'High Blood Sugar Alert',
            message: `Your blood sugar level of ${sugar} mg/dL is elevated. Monitor your diet and medication.`,
            priority: sugar > 250 ? 'critical' : 'high'
          });
        } else if (sugar < 70) {
          alerts.push({
            userId: data.userId,
            healthDataId: data.id,
            type: 'low_sugar',
            title: 'Low Blood Sugar Alert',
            message: `Your blood sugar level of ${sugar} mg/dL is low. Have a quick-acting carbohydrate snack immediately.`,
            priority: sugar < 54 ? 'critical' : 'high'
          });
        }
        break;
    }

    // Insert all alerts
    for (const alert of alerts) {
      await this.createHealthAlert(alert);
    }
  }
}

// In-memory storage implementation for development
export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private doctors: Doctor[] = [];
  private healthData: HealthData[] = [];
  private appointments: Appointment[] = [];
  private healthAlerts: HealthAlert[] = [];
  private aiHealthTips: AiHealthTip[] = [];
  private nextId = 1;

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return this.users.find(user => user.firebaseUid === firebaseUid);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextId++,
      ...userData,
      role: userData.role || "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingIndex = this.users.findIndex(user => user.id === id);
    if (existingIndex === -1) return undefined;

    const updated: User = {
      ...this.users[existingIndex],
      ...userData,
      updatedAt: new Date(),
    };
    this.users[existingIndex] = updated;
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    // Also remove associated doctors, health data, appointments, etc.
    this.doctors = this.doctors.filter(d => d.userId !== id);
    this.healthData = this.healthData.filter(h => h.userId !== id);
    this.appointments = this.appointments.filter(a => a.patientId !== id);
    this.healthAlerts = this.healthAlerts.filter(h => h.userId !== id);
    this.aiHealthTips = this.aiHealthTips.filter(t => t.userId !== id);

    this.users.splice(userIndex, 1);
    return true;
  }

  // Doctors
  async getDoctors(): Promise<(Doctor & { user: User })[]> {
    const result: (Doctor & { user: User })[] = [];

    for (const doctor of this.doctors) {
      const user = this.users.find(u => u.id === doctor.userId);
      if (user) {
        result.push({ ...doctor, user });
      }
    }

    return result.filter(d => d.isAvailable);
  }

  async getDoctorById(id: number): Promise<(Doctor & { user: User }) | undefined> {
    const doctor = this.doctors.find(d => d.id === id);
    if (!doctor) return undefined;

    const user = this.users.find(u => u.id === doctor.userId);
    if (!user) return undefined;

    return { ...doctor, user };
  }

  async getDoctorsBySpecialty(specialty: string): Promise<(Doctor & { user: User })[]> {
    const allDoctors = await this.getDoctors(); // This already filters for approved and available
    return allDoctors.filter(doctor => doctor.specialty === specialty);
  }

  async createDoctor(doctorData: InsertDoctor): Promise<Doctor> {
    const doctor: Doctor = {
      id: this.nextId++,
      ...doctorData,
      status: doctorData.status || "pending", // Default to pending
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.doctors.push(doctor);
    return doctor;
  }

  async updateDoctor(id: number, doctorData: Partial<InsertDoctor>): Promise<Doctor | undefined> {
    const existingIndex = this.doctors.findIndex(d => d.id === id);
    if (existingIndex === -1) return undefined;

    const updated: Doctor = {
      ...this.doctors[existingIndex],
      ...doctorData,
      updatedAt: new Date(),
    };
    this.doctors[existingIndex] = updated;
    return updated;
  }

  async getDoctorByUserId(userId: number): Promise<(Doctor & { user: User }) | undefined> {
    const doctor = this.doctors.find(d => d.userId === userId);
    if (!doctor) return undefined;

    const user = this.users.find(u => u.id === doctor.userId);
    if (!user) return undefined;

    return { ...doctor, user };
  }

  async getApprovedDoctors(): Promise<(Doctor & { user: User })[]> {
    const allDoctors = await this.getDoctors(); // This already filters for approved and available
    return allDoctors; // The getDoctors already filters by isAvailable and implicitly by approved status
  }

  async getPendingDoctors(): Promise<any[]> {
    const pendingDoctors = this.doctors.filter(doctor => doctor.status === "pending");
    return pendingDoctors.map(doctor => {
      const user = this.users.find(u => u.id === doctor.userId);
      return { ...doctor, user };
    });
  }

  async approveDoctor(doctorId: number, approvedBy: number): Promise<any | null> {
    const doctorIndex = this.doctors.findIndex(d => d.id === doctorId);
    if (doctorIndex === -1) return null;

    this.doctors[doctorIndex] = {
      ...this.doctors[doctorIndex],
      status: "approved",
      approvedBy: approvedBy,
      approvedAt: new Date(),
      isAvailable: true,
      updatedAt: new Date(),
    };

    const updatedDoctor = this.doctors[doctorIndex];
    const user = this.users.find(u => u.id === updatedDoctor.userId);
    return { ...updatedDoctor, user };
  }

  async rejectDoctor(doctorId: number, rejectionReason: string): Promise<any | null> {
    const doctorIndex = this.doctors.findIndex(d => d.id === doctorId);
    if (doctorIndex === -1) return null;

    this.doctors[doctorIndex] = {
      ...this.doctors[doctorIndex],
      status: "rejected",
      rejectionReason: rejectionReason,
      isAvailable: false,
      updatedAt: new Date(),
    };

    const updatedDoctor = this.doctors[doctorIndex];
    const user = this.users.find(u => u.id === updatedDoctor.userId);
    return { ...updatedDoctor, user };
  }

  async seedPreloadedDoctors(): Promise<void> {
    if (this.doctors.length > 0) return;

    console.log('Seeding preloaded doctors...');

    // Create admin user if not exists
    if (!this.users.find(u => u.email === "admin@healthsync.com")) {
      const adminUser: User = {
        id: this.nextId++,
        firebaseUid: "admin_uid_default",
        email: "admin@healthsync.com",
        name: "System Administrator",
        role: "admin",
        profilePicture: null,
        phone: null,
        dateOfBirth: null,
        gender: null,
        emergencyContact: null,
        medicalHistory: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.push(adminUser);
    }
    const adminUser = this.users.find(u => u.email === "admin@healthsync.com");
    const adminId = adminUser?.id;


    const preloadedDoctorsData = [
      {
        user: {
          firebaseUid: 'dr-sarah-wilson-001',
          email: 'dr.sarah.wilson@smartcare.com',
          name: 'Dr. Sarah Wilson',
          role: 'doctor' as const,
        },
        doctor: {
          specialty: 'Cardiology',
          experience: 15,
          consultationFee: '150.00',
          bio: 'Experienced cardiologist with expertise in preventive cardiology and heart failure management. Committed to providing personalized care for each patient.',
          education: ['MD from University of Ghana Medical School', 'Cardiology Fellowship at Korle Bu Teaching Hospital'],
          languages: ['English', 'Twi'],
          isAvailable: true,
          status: 'approved' as const,
          approvedBy: adminId,
          approvedAt: new Date(),
        }
      },
      {
        user: {
          firebaseUid: 'dr-michael-chen-002',
          email: 'dr.michael.chen@smartcare.com',
          name: 'Dr. Michael Chen',
          role: 'doctor' as const,
        },
        doctor: {
          specialty: 'Internal Medicine',
          experience: 12,
          consultationFee: '120.00',
          bio: 'Family physician dedicated to comprehensive primary care for patients of all ages. Focus on preventive medicine and chronic disease management.',
          education: ['MD from Kwame Nkrumah University of Science and Technology', 'Family Medicine Residency'],
          languages: ['English', 'Twi', 'Ga'],
          isAvailable: true,
          status: 'approved' as const,
          approvedBy: adminId,
          approvedAt: new Date(),
        }
      },
      {
        user: {
          firebaseUid: 'dr-emily-rodriguez-003',
          email: 'dr.emily.rodriguez@smartcare.com',
          name: 'Dr. Emily Rodriguez',
          role: 'doctor' as const,
        },
        doctor: {
          specialty: 'Pediatrics',
          experience: 10,
          consultationFee: '130.00',
          bio: 'Pediatrician with over 12 years of experience in child healthcare. Specialized in developmental pediatrics and adolescent medicine.',
          education: ['MD from University of Cape Coast', 'Pediatrics Residency at Komfo Anokye Teaching Hospital'],
          languages: ['English', 'Twi', 'French'],
          isAvailable: true,
          status: 'approved' as const,
          approvedBy: adminId,
          approvedAt: new Date(),
        }
      },
      {
        user: {
          firebaseUid: 'dr-james-thompson-004',
          email: 'dr.james.thompson@smartcare.com',
          name: 'Dr. James Thompson',
          role: 'doctor' as const,
        },
        doctor: {
          specialty: 'Dermatology',
          experience: 8,
          consultationFee: '140.00',
          bio: 'Dermatologist focusing on medical and cosmetic treatments. Dedicated to improving skin health and appearance.',
          education: ['MD from Northwestern University', 'Dermatology Residency at University of Pennsylvania'],
          languages: ['English'],
          isAvailable: true,
          status: 'approved' as const,
          approvedBy: adminId,
          approvedAt: new Date(),
        }
      }
    ];

    for (const { user: userData, doctor: doctorData } of preloadedDoctorsData) {
      const user = await this.createUser(userData);
      await this.createDoctor({
        userId: user.id,
        ...doctorData,
      });
    }

    console.log(`Successfully seeded ${preloadedDoctorsData.length} preloaded doctors`);
  }

  // Health Data
  async getHealthDataByUser(userId: number, limit = 50): Promise<HealthData[]> {
    return this.healthData
      .filter(data => data.userId === userId)
      .slice(0, limit);
  }

  async getHealthDataByType(userId: number, type: string, startDate?: Date, endDate?: Date): Promise<HealthData[]> {
    return this.healthData
      .filter(data => {
        let matches = data.userId === userId && data.type === type;
        if (startDate) {
          matches = matches && new Date(data.timestamp) >= startDate;
        }
        if (endDate) {
          matches = matches && new Date(data.timestamp) <= endDate;
        }
        return matches;
      });
  }

  async createHealthData(data: InsertHealthData): Promise<HealthData> {
    const healthData: HealthData = {
      id: this.nextId++,
      ...data,
      createdAt: new Date(),
    };
    this.healthData.push(healthData);
    // Check for health alerts based on the new data
    await this.checkAndCreateHealthAlerts(healthData);
    return healthData;
  }

  async updateHealthData(id: number, data: Partial<InsertHealthData>): Promise<HealthData | undefined> {
    const existingIndex = this.healthData.findIndex(d => d.id === id);
    if (existingIndex === -1) return undefined;

    const updated: HealthData = {
      ...this.healthData[existingIndex],
      ...data,
    };
    this.healthData[existingIndex] = updated;
    return updated;
  }

  async deleteHealthData(id: number): Promise<boolean> {
    const initialLength = this.healthData.length;
    this.healthData = this.healthData.filter(d => d.id !== id);
    return this.healthData.length < initialLength;
  }

  async getAppointmentsByPatient(patientId: number): Promise<(Appointment & { doctor: Doctor & { user: User } })[]> {
    const result: (Appointment & { doctor: Doctor & { user: User } })[] = [];

    for (const appointment of this.appointments) {
      if (appointment.patientId === patientId) {
        const doctor = await this.getDoctorById(appointment.doctorId);
        if (doctor) {
          result.push({ ...appointment, doctor });
        }
      }
    }

    return result;
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<(Appointment & { patient: User })[]> {
    const result: (Appointment & { patient: User })[] = [];

    for (const appointment of this.appointments) {
      if (appointment.doctorId === doctorId) {
        const patient = this.users.find(u => u.id === appointment.patientId);
        if (patient) {
          result.push({ ...appointment, patient });
        }
      }
    }

    return result;
  }

  async getUpcomingAppointments(userId: number, isDoctor = false): Promise<any[]> {
    const now = new Date();
    if (isDoctor) {
      return this.getAppointmentsByDoctor(userId)
        .then(appointments => appointments.filter(app => new Date(app.appointmentDate) >= now));
    } else {
      return this.getAppointmentsByPatient(userId)
        .then(appointments => appointments.filter(app => new Date(app.appointmentDate) >= now));
    }
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const appointment: Appointment = {
      id: this.nextId++,
      ...appointmentData,
      status: appointmentData.status || "scheduled",
      type: appointmentData.type || "consultation",
      duration: appointmentData.duration || 30,
      isVideoCall: appointmentData.isVideoCall || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.appointments.push(appointment);
    return appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const existingIndex = this.appointments.findIndex(app => app.id === id);
    if (existingIndex === -1) return undefined;

    const updated: Appointment = {
      ...this.appointments[existingIndex],
      ...appointmentData,
      updatedAt: new Date(),
    };
    this.appointments[existingIndex] = updated;
    return updated;
  }

  async getHealthAlerts(userId: number, limit = 10): Promise<HealthAlert[]> {
    return this.healthAlerts
      .filter(alert => alert.userId === userId)
      .slice(0, limit);
  }

  async createHealthAlert(alertData: InsertHealthAlert): Promise<HealthAlert> {
    const alert: HealthAlert = {
      id: this.nextId++,
      ...alertData,
      createdAt: new Date(),
    };
    this.healthAlerts.push(alert);
    return alert;
  }

  async markAlertAsRead(id: number): Promise<boolean> {
    const alertIndex = this.healthAlerts.findIndex(a => a.id === id);
    if (alertIndex === -1) return false;

    this.healthAlerts[alertIndex] = { ...this.healthAlerts[alertIndex], isRead: true, updatedAt: new Date() };
    return true;
  }

  async getAiHealthTips(userId: number, limit = 5): Promise<AiHealthTip[]> {
    return this.aiHealthTips
      .filter(tip => tip.userId === userId)
      .slice(0, limit);
  }

  async createAiHealthTip(tipData: InsertAiHealthTip): Promise<AiHealthTip> {
    const tip: AiHealthTip = {
      id: this.nextId++,
      ...tipData,
      createdAt: new Date(),
    };
    this.aiHealthTips.push(tip);
    return tip;
  }

  async markTipAsRead(id: number): Promise<boolean> {
    const tipIndex = this.aiHealthTips.findIndex(t => t.id === id);
    if (tipIndex === -1) return false;

    this.aiHealthTips[tipIndex] = { ...this.aiHealthTips[tipIndex], isRead: true, updatedAt: new Date() };
    return true;
  }

  // Helper method to check and create health alerts based on health data
  private async checkAndCreateHealthAlerts(data: HealthData): Promise<void> {
    const alerts: InsertHealthAlert[] = [];

    switch (data.type) {
      case 'heart_rate':
        const hr = parseInt(data.value);
        if (hr > 100) {
          alerts.push({
            userId: data.userId,
            healthDataId: data.id,
            type: 'high_hr',
            title: 'High Heart Rate Alert',
            message: `Your heart rate of ${hr} bpm is above normal. Consider resting and consult a doctor if it persists.`,
            priority: hr > 120 ? 'high' : 'medium'
          });
        } else if (hr < 60) {
          alerts.push({
            userId: data.userId,
            healthDataId: data.id,
            type: 'low_hr',
            title: 'Low Heart Rate Alert',
            message: `Your heart rate of ${hr} bpm is below normal. Monitor closely and consult a doctor if you feel unwell.`,
            priority: hr < 40 ? 'high' : 'medium'
          });
        }
        break;

      case 'blood_pressure':
        if (data.systolic && data.diastolic) {
          if (data.systolic >= 140 || data.diastolic >= 90) {
            alerts.push({
              userId: data.userId,
              healthDataId: data.id,
              type: 'high_bp',
              title: 'High Blood Pressure Alert',
              message: `Your blood pressure of ${data.systolic}/${data.diastolic} mmHg is elevated. Please monitor closely and consult your doctor.`,
              priority: (data.systolic >= 160 || data.diastolic >= 100) ? 'critical' : 'high'
            });
          } else if (data.systolic <= 90 || data.diastolic <= 60) {
            alerts.push({
              userId: data.userId,
              healthDataId: data.id,
              type: 'low_bp',
              title: 'Low Blood Pressure Alert',
              message: `Your blood pressure of ${data.systolic}/${data.diastolic} mmHg is low. Stay hydrated and avoid sudden movements.`,
              priority: 'medium'
            });
          }
        }
        break;

      case 'blood_sugar':
        const sugar = parseInt(data.value);
        if (sugar > 180) {
          alerts.push({
            userId: data.userId,
            healthDataId: data.id,
            type: 'high_sugar',
            title: 'High Blood Sugar Alert',
            message: `Your blood sugar level of ${sugar} mg/dL is elevated. Monitor your diet and medication.`,
            priority: sugar > 250 ? 'critical' : 'high'
          });
        } else if (sugar < 70) {
          alerts.push({
            userId: data.userId,
            healthDataId: data.id,
            type: 'low_sugar',
            title: 'Low Blood Sugar Alert',
            message: `Your blood sugar level of ${sugar} mg/dL is low. Have a quick-acting carbohydrate snack immediately.`,
            priority: sugar < 54 ? 'critical' : 'high'
          });
        }
        break;
    }

    // Insert all alerts
    for (const alert of alerts) {
      await this.createHealthAlert(alert);
    }
  }
}

// Use appropriate storage based on environment
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemoryStorage();