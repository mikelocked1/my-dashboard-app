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
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Doctors
  getDoctors(): Promise<(Doctor & { user: User })[]>;
  getDoctorById(id: number): Promise<(Doctor & { user: User }) | undefined>;
  getDoctorsBySpecialty(specialty: string): Promise<(Doctor & { user: User })[]>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: number, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined>;

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
    const result = await db
      .select()
      .from(doctors)
      .leftJoin(users, eq(doctors.userId, users.id))
      .where(eq(doctors.isAvailable, true));
    
    return result.map(row => ({
      ...row.doctors,
      user: row.users!
    }));
  }

  async getDoctorById(id: number): Promise<(Doctor & { user: User }) | undefined> {
    const result = await db
      .select()
      .from(doctors)
      .leftJoin(users, eq(doctors.userId, users.id))
      .where(eq(doctors.id, id))
      .limit(1);
    
    if (result[0]) {
      return {
        ...result[0].doctors,
        user: result[0].users!
      };
    }
    return undefined;
  }

  async getDoctorsBySpecialty(specialty: string): Promise<(Doctor & { user: User })[]> {
    const result = await db
      .select()
      .from(doctors)
      .leftJoin(users, eq(doctors.userId, users.id))
      .where(and(eq(doctors.specialty, specialty), eq(doctors.isAvailable, true)));
    
    return result.map(row => ({
      ...row.doctors,
      user: row.users!
    }));
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const result = await db.insert(doctors).values(doctor).returning();
    return result[0];
  }

  async updateDoctor(id: number, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined> {
    const result = await db.update(doctors).set({ ...doctor, updatedAt: new Date() }).where(eq(doctors.id, id)).returning();
    return result[0] || undefined;
  }

  // Health Data
  async getHealthDataByUser(userId: number, limit: number = 50): Promise<HealthData[]> {
    return await db
      .select()
      .from(healthData)
      .where(eq(healthData.userId, userId))
      .orderBy(desc(healthData.timestamp))
      .limit(limit);
  }

  async getHealthDataByType(userId: number, type: string, startDate?: Date, endDate?: Date): Promise<HealthData[]> {
    const conditions = [eq(healthData.userId, userId), eq(healthData.type, type as any)];
    
    if (startDate) {
      conditions.push(gte(healthData.timestamp, startDate));
    }
    if (endDate) {
      conditions.push(lte(healthData.timestamp, endDate));
    }

    return await db
      .select()
      .from(healthData)
      .where(and(...conditions))
      .orderBy(desc(healthData.timestamp));
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
    const result = await db
      .select()
      .from(appointments)
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .leftJoin(users, eq(doctors.userId, users.id))
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.appointmentDate));

    return result.map(row => ({
      ...row.appointments,
      doctor: {
        ...row.doctors!,
        user: row.users!
      }
    }));
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<(Appointment & { patient: User })[]> {
    const result = await db
      .select()
      .from(appointments)
      .leftJoin(users, eq(appointments.patientId, users.id))
      .where(eq(appointments.doctorId, doctorId))
      .orderBy(desc(appointments.appointmentDate));

    return result.map(row => ({
      ...row.appointments,
      patient: row.users!
    }));
  }

  async getUpcomingAppointments(userId: number, isDoctor: boolean = false): Promise<any[]> {
    const now = new Date();
    let query;
    
    if (isDoctor) {
      query = db
        .select()
        .from(appointments)
        .leftJoin(users, eq(appointments.patientId, users.id))
        .where(and(
          eq(appointments.doctorId, userId),
          gte(appointments.appointmentDate, now),
          sql`${appointments.status} IN ('scheduled', 'confirmed')`
        ));
    } else {
      query = db
        .select()
        .from(appointments)
        .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
        .leftJoin(users, eq(doctors.userId, users.id))
        .where(and(
          eq(appointments.patientId, userId),
          gte(appointments.appointmentDate, now),
          sql`${appointments.status} IN ('scheduled', 'confirmed')`
        ));
    }
    
    const result = await query.orderBy(appointments.appointmentDate).limit(10);
    
    return result.map(row => ({
      ...row.appointments,
      ...(isDoctor ? { patient: row.users } : { doctor: row.doctors && row.users ? { ...row.doctors, user: row.users } : null })
    }));
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
    return await db
      .select()
      .from(healthAlerts)
      .where(eq(healthAlerts.userId, userId))
      .orderBy(desc(healthAlerts.createdAt))
      .limit(limit);
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
    return await db
      .select()
      .from(aiHealthTips)
      .where(eq(aiHealthTips.userId, userId))
      .orderBy(desc(aiHealthTips.createdAt))
      .limit(limit);
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

export const storage = new DatabaseStorage();
