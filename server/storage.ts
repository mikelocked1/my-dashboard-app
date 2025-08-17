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
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Doctors
  getDoctors(): Promise<(Doctor & { user: User })[]>;
  getDoctorById(id: number): Promise<(Doctor & { user: User }) | undefined>;
  getDoctorsBySpecialty(specialty: string): Promise<(Doctor & { user: User })[]>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: number, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined>;
  getDoctorByUserId(userId: number): Promise<(Doctor & { user: User }) | undefined>;
  getApprovedDoctors(): Promise<(Doctor & { user: User })[]>;
  seedPreloadedDoctors(): Promise<void>;

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

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set({ ...user, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return result[0] || undefined;
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
        .where(and(eq(doctors.specialty, specialty), eq(doctors.isAvailable, true)));

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

  async seedPreloadedDoctors(): Promise<void> {
    try {
      // Check if preloaded doctors already exist
      const existingDoctors = await this.getDoctors();
      if (existingDoctors.length > 0) {
        return; // Preloaded doctors already exist
      }

      console.log('Seeding preloaded doctors...');

      const preloadedDoctors = [
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
            bio: 'Dr. Sarah Wilson is a board-certified cardiologist with over 15 years of experience treating heart conditions. She specializes in preventive cardiology and heart disease management.',
            education: ['MD from Harvard Medical School', 'Residency at Johns Hopkins', 'Fellowship in Cardiology at Mayo Clinic'],
            languages: ['English', 'Spanish'],
            status: 'approved' as const,
            isAvailable: true,
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
            bio: 'Dr. Michael Chen is an experienced internal medicine physician focusing on comprehensive primary care and chronic disease management.',
            education: ['MD from Stanford University', 'Residency at UCSF Medical Center'],
            languages: ['English', 'Mandarin', 'Cantonese'],
            status: 'approved' as const,
            isAvailable: true,
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
            bio: 'Dr. Emily Rodriguez is a dedicated pediatrician with extensive experience in child healthcare, vaccinations, and developmental assessments.',
            education: ['MD from UCLA School of Medicine', 'Residency at Children\'s Hospital Los Angeles'],
            languages: ['English', 'Spanish'],
            status: 'approved' as const,
            isAvailable: true,
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
            bio: 'Dr. James Thompson specializes in medical and cosmetic dermatology, treating various skin conditions and providing comprehensive skin care.',
            education: ['MD from Northwestern University', 'Dermatology Residency at University of Pennsylvania'],
            languages: ['English'],
            status: 'approved' as const,
            isAvailable: true,
          }
        }
      ];

      for (const preloadedDoctor of preloadedDoctors) {
        // Create user first
        const createdUser = await this.createUser(preloadedDoctor.user);

        // Then create doctor profile
        await this.createDoctor({
          ...preloadedDoctor.doctor,
          userId: createdUser.id,
          approvedAt: new Date(),
          approvedBy: 1, // Assuming admin user with ID 1
        });
      }

      console.log(`Successfully seeded ${preloadedDoctors.length} preloaded doctors`);
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
  private users: Map<number, User> = new Map();
  private doctors: Map<number, Doctor> = new Map();
  private healthData: Map<number, HealthData> = new Map();
  private appointments: Map<number, Appointment> = new Map();
  private healthAlerts: Map<number, HealthAlert> = new Map();
  private aiHealthTips: Map<number, AiHealthTip> = new Map();
  private nextId = 1;

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextId++,
      ...userData,
      role: userData.role || "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    const updated: User = {
      ...existing,
      ...userData,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  // Doctors
  async getDoctors(): Promise<(Doctor & { user: User })[]> {
    const result: (Doctor & { user: User })[] = [];

    for (const doctor of this.doctors.values()) {
      const user = this.users.get(doctor.userId);
      if (user) {
        result.push({ ...doctor, user });
      }
    }

    return result;
  }

  async getDoctorById(id: number): Promise<(Doctor & { user: User }) | undefined> {
    const doctor = this.doctors.get(id);
    if (!doctor) return undefined;

    const user = this.users.get(doctor.userId);
    if (!user) return undefined;

    return { ...doctor, user };
  }

  async getDoctorsBySpecialty(specialty: string): Promise<(Doctor & { user: User })[]> {
    const allDoctors = await this.getDoctors();
    return allDoctors.filter(doctor => doctor.specialty === specialty);
  }

  async createDoctor(doctorData: InsertDoctor): Promise<Doctor> {
    const doctor: Doctor = {
      id: this.nextId++,
      ...doctorData,
      status: doctorData.status || "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.doctors.set(doctor.id, doctor);
    return doctor;
  }

  async updateDoctor(id: number, doctorData: Partial<InsertDoctor>): Promise<Doctor | undefined> {
    const existing = this.doctors.get(id);
    if (!existing) return undefined;

    const updated: Doctor = {
      ...existing,
      ...doctorData,
      updatedAt: new Date(),
    };
    this.doctors.set(id, updated);
    return updated;
  }

  async getDoctorByUserId(userId: number): Promise<(Doctor & { user: User }) | undefined> {
    const doctor = Array.from(this.doctors.values()).find(d => d.userId === userId);
    if (!doctor) return undefined;

    const user = this.users.get(doctor.userId);
    if (!user) return undefined;

    return { ...doctor, user };
  }

  async getApprovedDoctors(): Promise<(Doctor & { user: User })[]> {
    const allDoctors = await this.getDoctors();
    return allDoctors.filter(doctor => doctor.status === 'approved');
  }

  async seedPreloadedDoctors(): Promise<void> {
    // Check if doctors already exist
    const existingDoctors = await this.getDoctors();
    if (existingDoctors.length > 0) {
      return;
    }

    console.log('Seeding preloaded doctors...');

    const preloadedDoctors = [
      {
        user: {
          firebaseUid: 'dr-kwame-asante-001',
          email: 'dr.kwame.asante@smartcare.com',
          name: 'Dr. Kwame Asante',
          role: 'doctor' as const,
        },
        doctor: {
          specialty: 'Cardiology',
          experience: 15,
          consultationFee: '480.00',
          bio: 'Dr. Kwame Asante is a board-certified cardiologist with over 15 years of experience treating heart conditions across Ghana.',
          education: ['MBChB from University of Ghana Medical School', 'Cardiology Fellowship at Korle Bu Teaching Hospital'],
          languages: ['English', 'Twi', 'Ga'],
          status: 'approved' as const,
          isAvailable: true,
        }
      },
      {
        user: {
          firebaseUid: 'dr-akosua-mensah-002',
          email: 'dr.akosua.mensah@smartcare.com',
          name: 'Dr. Akosua Mensah',
          role: 'doctor' as const,
        },
        doctor: {
          specialty: 'Internal Medicine',
          experience: 12,
          consultationFee: '380.00',
          bio: 'Dr. Akosua Mensah is an experienced internal medicine physician specializing in comprehensive primary care.',
          education: ['MBChB from Kwame Nkrumah University of Science and Technology', 'Internal Medicine Residency at Komfo Anokye Teaching Hospital'],
          languages: ['English', 'Twi', 'Fante'],
          status: 'approved' as const,
          isAvailable: true,
        }
      },
      {
        user: {
          firebaseUid: 'dr-kofi-oppong-003',
          email: 'dr.kofi.oppong@smartcare.com',
          name: 'Dr. Kofi Oppong',
          role: 'doctor' as const,
        },
        doctor: {
          specialty: 'Dermatology',
          experience: 8,
          consultationFee: '420.00',
          bio: 'Dr. Kofi Oppong specializes in dermatology and skin care treatments with focus on tropical skin conditions.',
          education: ['MBChB from University of Cape Coast Medical School', 'Dermatology Residency at Ridge Hospital'],
          languages: ['English', 'Twi'],
          status: 'approved' as const,
          isAvailable: true,
        }
      },
      {
        user: {
          firebaseUid: 'dr-ama-boateng-004',
          email: 'dr.ama.boateng@smartcare.com',
          name: 'Dr. Ama Boateng',
          role: 'doctor' as const,
        },
        doctor: {
          specialty: 'Pediatrics',
          experience: 10,
          consultationFee: '350.00',
          bio: 'Dr. Ama Boateng is a dedicated pediatrician with extensive experience in child healthcare and maternal health.',
          education: ['MBChB from University of Ghana Medical School', 'Pediatric Residency at Korle Bu Teaching Hospital'],
          languages: ['English', 'Twi', 'Ewe'],
          status: 'approved' as const,
          isAvailable: true,
        }
      }
    ];

    // Create users and doctors
    for (const { user: userData, doctor: doctorData } of preloadedDoctors) {
      const user = await this.createUser(userData);
      await this.createDoctor({
        userId: user.id,
        ...doctorData,
      });
    }

    console.log('Successfully seeded 4 preloaded doctors');
  }

  // Remaining methods with basic implementations
  async getHealthDataByUser(userId: number, limit = 50): Promise<HealthData[]> {
    return Array.from(this.healthData.values())
      .filter(data => data.userId === userId)
      .slice(0, limit);
  }

  async getHealthDataByType(userId: number, type: string, startDate?: Date, endDate?: Date): Promise<HealthData[]> {
    return Array.from(this.healthData.values())
      .filter(data => data.userId === userId && data.type === type);
  }

  async createHealthData(data: InsertHealthData): Promise<HealthData> {
    const healthData: HealthData = {
      id: this.nextId++,
      ...data,
      createdAt: new Date(),
    };
    this.healthData.set(healthData.id, healthData);
    return healthData;
  }

  async updateHealthData(id: number, data: Partial<InsertHealthData>): Promise<HealthData | undefined> {
    const existing = this.healthData.get(id);
    if (!existing) return undefined;

    const updated: HealthData = {
      ...existing,
      ...data,
    };
    this.healthData.set(id, updated);
    return updated;
  }

  async deleteHealthData(id: number): Promise<boolean> {
    return this.healthData.delete(id);
  }

  async getAppointmentsByPatient(patientId: number): Promise<(Appointment & { doctor: Doctor & { user: User } })[]> {
    const result: (Appointment & { doctor: Doctor & { user: User } })[] = [];

    for (const appointment of this.appointments.values()) {
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

    for (const appointment of this.appointments.values()) {
      if (appointment.doctorId === doctorId) {
        const patient = this.users.get(appointment.patientId);
        if (patient) {
          result.push({ ...appointment, patient });
        }
      }
    }

    return result;
  }

  async getUpcomingAppointments(userId: number, isDoctor = false): Promise<any[]> {
    if (isDoctor) {
      return this.getAppointmentsByDoctor(userId);
    } else {
      return this.getAppointmentsByPatient(userId);
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
    this.appointments.set(appointment.id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const existing = this.appointments.get(id);
    if (!existing) return undefined;

    const updated: Appointment = {
      ...existing,
      ...appointmentData,
      updatedAt: new Date(),
    };
    this.appointments.set(id, updated);
    return updated;
  }

  async getHealthAlerts(userId: number, limit = 10): Promise<HealthAlert[]> {
    return Array.from(this.healthAlerts.values())
      .filter(alert => alert.userId === userId)
      .slice(0, limit);
  }

  async createHealthAlert(alertData: InsertHealthAlert): Promise<HealthAlert> {
    const alert: HealthAlert = {
      id: this.nextId++,
      ...alertData,
      createdAt: new Date(),
    };
    this.healthAlerts.set(alert.id, alert);
    return alert;
  }

  async markAlertAsRead(id: number): Promise<boolean> {
    const alert = this.healthAlerts.get(id);
    if (!alert) return false;

    const updated = { ...alert, isRead: true, updatedAt: new Date() };
    this.healthAlerts.set(id, updated);
    return true;
  }

  async getAiHealthTips(userId: number, limit = 5): Promise<AiHealthTip[]> {
    return Array.from(this.aiHealthTips.values())
      .filter(tip => tip.userId === userId)
      .slice(0, limit);
  }

  async createAiHealthTip(tipData: InsertAiHealthTip): Promise<AiHealthTip> {
    const tip: AiHealthTip = {
      id: this.nextId++,
      ...tipData,
      createdAt: new Date(),
    };
    this.aiHealthTips.set(tip.id, tip);
    return tip;
  }

  async markTipAsRead(id: number): Promise<boolean> {
    const tip = this.aiHealthTips.get(id);
    if (!tip) return false;

    const updated = { ...tip, isRead: true, updatedAt: new Date() };
    this.aiHealthTips.set(id, updated);
    return true;
  }
}

// Use appropriate storage based on environment
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemoryStorage();