import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["user", "doctor", "admin"]),
  profilePicture: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Doctor schema
export const doctorSchema = z.object({
  id: z.string(),
  userId: z.string(),
  specialty: z.string(),
  experience: z.number(),
  rating: z.number(),
  reviewCount: z.number(),
  consultationFee: z.number(),
  availableSlots: z.array(z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    isAvailable: z.boolean(),
  })),
  bio: z.string().optional(),
  education: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertDoctorSchema = doctorSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Doctor = z.infer<typeof doctorSchema>;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;

// Health Data schema
export const healthDataSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["heart_rate", "blood_pressure", "weight", "blood_sugar", "steps", "sleep", "temperature"]),
  value: z.string(),
  unit: z.string(),
  timestamp: z.date(),
  source: z.enum(["manual", "csv", "smartwatch", "fitbit", "apple_health", "samsung_health"]),
  notes: z.string().optional(),
  createdAt: z.date(),
});

export const insertHealthDataSchema = healthDataSchema.omit({
  id: true,
  createdAt: true,
});

export type HealthData = z.infer<typeof healthDataSchema>;
export type InsertHealthData = z.infer<typeof insertHealthDataSchema>;

// Appointment schema
export const appointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  date: z.string(),
  time: z.string(),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]),
  type: z.enum(["consultation", "followup", "emergency"]),
  notes: z.string().optional(),
  amount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertAppointmentSchema = appointmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Appointment = z.infer<typeof appointmentSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Health Alert schema
export const healthAlertSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["high_bp", "low_bp", "high_hr", "low_hr", "critical", "warning", "info"]),
  title: z.string(),
  message: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  isRead: z.boolean().default(false),
  healthDataId: z.string().optional(),
  createdAt: z.date(),
});

export const insertHealthAlertSchema = healthAlertSchema.omit({
  id: true,
  createdAt: true,
});

export type HealthAlert = z.infer<typeof healthAlertSchema>;
export type InsertHealthAlert = z.infer<typeof insertHealthAlertSchema>;

// AI Health Tip schema
export const aiHealthTipSchema = z.object({
  id: z.string(),
  userId: z.string(),
  category: z.enum(["nutrition", "exercise", "sleep", "medication", "lifestyle", "prevention"]),
  title: z.string(),
  content: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  isPersonalized: z.boolean().default(true),
  relatedMetrics: z.array(z.string()).optional(),
  createdAt: z.date(),
});

export const insertAiHealthTipSchema = aiHealthTipSchema.omit({
  id: true,
  createdAt: true,
});

export type AiHealthTip = z.infer<typeof aiHealthTipSchema>;
export type InsertAiHealthTip = z.infer<typeof insertAiHealthTipSchema>;
