import { z } from "zod";
import { pgTable, text, integer, decimal, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").unique().notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["user", "doctor", "admin"] }).notNull().default("user"),
  profilePicture: text("profile_picture"),
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  emergencyContact: text("emergency_contact"),
  medicalHistory: text("medical_history"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Doctors table
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  specialty: text("specialty").notNull(),
  experience: integer("experience").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.0"),
  reviewCount: integer("review_count").default(0),
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }).notNull(),
  bio: text("bio"),
  education: text("education").array(),
  languages: text("languages").array().default(["English"]),
  isAvailable: boolean("is_available").default(true),
  workingHours: jsonb("working_hours").default({
    monday: { start: "09:00", end: "17:00", available: true },
    tuesday: { start: "09:00", end: "17:00", available: true },
    wednesday: { start: "09:00", end: "17:00", available: true },
    thursday: { start: "09:00", end: "17:00", available: true },
    friday: { start: "09:00", end: "17:00", available: true },
    saturday: { start: "09:00", end: "13:00", available: false },
    sunday: { start: "09:00", end: "13:00", available: false }
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectDoctorSchema = createSelectSchema(doctors);
export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;

// Health Data table
export const healthData = pgTable("health_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type", { 
    enum: ["heart_rate", "blood_pressure", "weight", "blood_sugar", "steps", "sleep", "temperature", "oxygen_saturation", "bmi"] 
  }).notNull(),
  value: text("value").notNull(),
  unit: text("unit").notNull(),
  systolic: integer("systolic"), // for blood pressure
  diastolic: integer("diastolic"), // for blood pressure
  timestamp: timestamp("timestamp", { mode: 'string' }).notNull(),
  source: text("source", { 
    enum: ["manual", "csv", "smartwatch", "fitbit", "apple_health", "samsung_health", "google_fit"] 
  }).default("manual").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHealthDataSchema = createInsertSchema(healthData).omit({
  id: true,
  createdAt: true,
});

export const selectHealthDataSchema = createSelectSchema(healthData);
export type HealthData = typeof healthData.$inferSelect;
export type InsertHealthData = z.infer<typeof insertHealthDataSchema>;

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => users.id).notNull(),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  status: text("status", { 
    enum: ["scheduled", "confirmed", "completed", "cancelled", "no_show"] 
  }).default("scheduled").notNull(),
  type: text("type", { 
    enum: ["consultation", "followup", "emergency", "routine_checkup", "specialist_visit"] 
  }).default("consultation").notNull(),
  duration: integer("duration").default(30), // in minutes
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }),
  patientNotes: text("patient_notes"),
  doctorNotes: text("doctor_notes"),
  prescription: text("prescription"),
  nextAppointment: timestamp("next_appointment"),
  isVideoCall: boolean("is_video_call").default(false),
  meetingLink: text("meeting_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectAppointmentSchema = createSelectSchema(appointments);
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Health Alerts table
export const healthAlerts = pgTable("health_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  healthDataId: integer("health_data_id").references(() => healthData.id),
  type: text("type", { 
    enum: ["high_bp", "low_bp", "high_hr", "low_hr", "high_sugar", "low_sugar", "critical", "warning", "info"] 
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium").notNull(),
  isRead: boolean("is_read").default(false),
  actionTaken: text("action_taken"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHealthAlertSchema = createInsertSchema(healthAlerts).omit({
  id: true,
  createdAt: true,
});

export const selectHealthAlertSchema = createSelectSchema(healthAlerts);
export type HealthAlert = typeof healthAlerts.$inferSelect;
export type InsertHealthAlert = z.infer<typeof insertHealthAlertSchema>;

// AI Health Tips table
export const aiHealthTips = pgTable("ai_health_tips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  category: text("category", { 
    enum: ["nutrition", "exercise", "sleep", "medication", "lifestyle", "prevention", "mental_health"] 
  }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  isPersonalized: boolean("is_personalized").default(true),
  relatedMetrics: text("related_metrics").array(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAiHealthTipSchema = createInsertSchema(aiHealthTips).omit({
  id: true,
  createdAt: true,
});

export const selectAiHealthTipSchema = createSelectSchema(aiHealthTips);
export type AiHealthTip = typeof aiHealthTips.$inferSelect;
export type InsertAiHealthTip = z.infer<typeof insertAiHealthTipSchema>;

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  healthData: many(healthData),
  healthAlerts: many(healthAlerts),
  aiHealthTips: many(aiHealthTips),
  patientAppointments: many(appointments, { relationName: "patientAppointments" }),
  doctorProfile: one(doctors, {
    fields: [users.id],
    references: [doctors.userId],
  }),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, {
    fields: [doctors.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
}));

export const healthDataRelations = relations(healthData, ({ one, many }) => ({
  user: one(users, {
    fields: [healthData.userId],
    references: [users.id],
  }),
  alerts: many(healthAlerts),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(users, {
    fields: [appointments.patientId],
    references: [users.id],
    relationName: "patientAppointments",
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
}));

export const healthAlertsRelations = relations(healthAlerts, ({ one }) => ({
  user: one(users, {
    fields: [healthAlerts.userId],
    references: [users.id],
  }),
  healthData: one(healthData, {
    fields: [healthAlerts.healthDataId],
    references: [healthData.id],
  }),
}));

export const aiHealthTipsRelations = relations(aiHealthTips, ({ one }) => ({
  user: one(users, {
    fields: [aiHealthTips.userId],
    references: [users.id],
  }),
}));
