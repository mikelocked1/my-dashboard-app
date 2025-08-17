import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./email";
import { 
  insertUserSchema, 
  insertDoctorSchema, 
  insertHealthDataSchema, 
  insertAppointmentSchema,
  insertHealthAlertSchema,
  insertAiHealthTipSchema 
} from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users/:firebaseUid", async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.params.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // If user registered as a doctor, create doctor profile with pending status
      if (userData.role === "doctor") {
        const defaultDoctorData = {
          userId: user.id,
          specialty: "General Practice", // Default, will be updated during profile completion
          experience: 0,
          consultationFee: "0.00",
          bio: "",
          education: [],
          languages: ["English"],
          status: "pending" as const,
          isAvailable: false, // Not available until approved
        };
        
        await storage.createDoctor(defaultDoctorData);
      }
      
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Doctor routes
  app.get("/api/doctors", async (req, res) => {
    try {
      const specialty = req.query.specialty as string;
      const approvedOnly = req.query.approved !== "false"; // Default to approved only
      let doctors;
      
      if (approvedOnly) {
        if (specialty) {
          doctors = await storage.getDoctorsBySpecialty(specialty);
          doctors = doctors.filter(doctor => doctor.status === "approved");
        } else {
          doctors = await storage.getApprovedDoctors();
        }
      } else {
        if (specialty) {
          doctors = await storage.getDoctorsBySpecialty(specialty);
        } else {
          doctors = await storage.getDoctors();
        }
      }
      res.json(doctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/doctors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const doctor = await storage.getDoctorById(id);
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }
      res.json(doctor);
    } catch (error) {
      console.error("Error fetching doctor:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/doctors", async (req, res) => {
    try {
      const doctorData = insertDoctorSchema.parse(req.body);
      const doctor = await storage.createDoctor(doctorData);
      res.status(201).json(doctor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid doctor data", details: error.errors });
      }
      console.error("Error creating doctor:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/doctors/approved", async (req, res) => {
    try {
      const doctors = await storage.getApprovedDoctors();
      res.json(doctors);
    } catch (error) {
      console.error("Error fetching approved doctors:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/doctors/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const doctor = await storage.getDoctorByUserId(userId);
      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      res.json(doctor);
    } catch (error) {
      console.error("Error fetching doctor by user ID:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/doctors/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { approvedBy } = req.body;
      
      const doctor = await storage.updateDoctor(id, {
        status: "approved",
        approvedBy: approvedBy,
        approvedAt: new Date(),
      });
      
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }
      res.json(doctor);
    } catch (error) {
      console.error("Error approving doctor:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/doctors/:id/reject", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rejectionReason } = req.body;
      
      const doctor = await storage.updateDoctor(id, {
        status: "rejected",
        rejectionReason: rejectionReason,
      });
      
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }
      res.json(doctor);
    } catch (error) {
      console.error("Error rejecting doctor:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Health Data routes
  app.get("/api/health-data/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const type = req.query.type as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      let healthData;
      if (type) {
        healthData = await storage.getHealthDataByType(userId, type, startDate, endDate);
      } else {
        healthData = await storage.getHealthDataByUser(userId, limit);
      }
      res.json(healthData);
    } catch (error) {
      console.error("Error fetching health data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/health-data", async (req, res) => {
    try {
      const healthData = insertHealthDataSchema.parse(req.body);
      const result = await storage.createHealthData(healthData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid health data", details: error.errors });
      }
      console.error("Error creating health data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/health-data/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const healthData = insertHealthDataSchema.partial().parse(req.body);
      const result = await storage.updateHealthData(id, healthData);
      if (!result) {
        return res.status(404).json({ error: "Health data not found" });
      }
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid health data", details: error.errors });
      }
      console.error("Error updating health data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/health-data/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteHealthData(id);
      if (!success) {
        return res.status(404).json({ error: "Health data not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting health data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Appointment routes
  app.get("/api/appointments/patient/:patientId", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const appointments = await storage.getAppointmentsByPatient(patientId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching patient appointments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/appointments/doctor/:doctorId", async (req, res) => {
    try {
      const doctorId = parseInt(req.params.doctorId);
      const appointments = await storage.getAppointmentsByDoctor(doctorId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching doctor appointments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/appointments/upcoming/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const isDoctor = req.query.isDoctor === 'true';
      const appointments = await storage.getUpcomingAppointments(userId, isDoctor);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      console.log("Received appointment data:", req.body);
      const appointmentData = insertAppointmentSchema.parse(req.body);
      console.log("Parsed appointment data:", appointmentData);
      const appointment = await storage.createAppointment(appointmentData);
      
      // Send email confirmation
      try {
        console.log('🔄 Starting email confirmation process...');
        // Get patient and doctor information for email
        const patient = await storage.getUserById(appointmentData.patientId);
        const doctor = await storage.getDoctorById(appointmentData.doctorId);
        
        console.log('👤 Patient data:', patient ? { id: patient.id, name: patient.name, email: patient.email } : 'NOT FOUND');
        console.log('👨‍⚕️ Doctor data:', doctor ? { id: doctor.id, name: doctor.user?.name, specialty: doctor.specialty } : 'NOT FOUND');
        
        if (patient && doctor && patient.email) {
          const appointmentDateTime = new Date(appointmentData.appointmentDate);
          
          const emailData = {
            patientName: patient.name,
            patientEmail: patient.email,
            doctorName: doctor.user.name,
            appointmentDate: format(appointmentDateTime, "EEEE, MMMM do, yyyy"),
            appointmentTime: format(appointmentDateTime, "h:mm a"),
            specialty: doctor.specialty,
            consultationFee: appointmentData.consultationFee.toString(),
            isVideoCall: appointmentData.isVideoCall || false,
            appointmentType: appointmentData.type || "consultation"
          };
          
          console.log('📧 Preparing to send email with data:', {
            to: emailData.patientEmail,
            doctor: emailData.doctorName,
            date: emailData.appointmentDate,
            time: emailData.appointmentTime
          });
          
          const emailSent = await emailService.sendAppointmentConfirmation(emailData);
          
          if (emailSent) {
            console.log('✅ Email confirmation sent successfully!');
          } else {
            console.log('❌ Email confirmation failed to send');
          }
        } else {
          if (!patient) console.log('❌ Patient not found - cannot send email');
          if (!doctor) console.log('❌ Doctor not found - cannot send email');
          if (patient && !patient.email) console.log('❌ Patient email is missing - cannot send email');
        }
      } catch (emailError) {
        // Don't fail the appointment creation if email fails
        console.error("❌ Failed to send confirmation email:", emailError);
      }
      
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ error: "Invalid appointment data", details: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointmentData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(id, appointmentData);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid appointment data", details: error.errors });
      }
      console.error("Error updating appointment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Health Alert routes
  app.get("/api/health-alerts/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const alerts = await storage.getHealthAlerts(userId, limit);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching health alerts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/health-alerts", async (req, res) => {
    try {
      const alertData = insertHealthAlertSchema.parse(req.body);
      const alert = await storage.createHealthAlert(alertData);
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid alert data", details: error.errors });
      }
      console.error("Error creating health alert:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/health-alerts/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markAlertAsRead(id);
      if (!success) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // AI Health Tips routes
  app.get("/api/health-tips/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const tips = await storage.getAiHealthTips(userId, limit);
      res.json(tips);
    } catch (error) {
      console.error("Error fetching health tips:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/health-tips", async (req, res) => {
    try {
      const tipData = insertAiHealthTipSchema.parse(req.body);
      const tip = await storage.createAiHealthTip(tipData);
      res.status(201).json(tip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tip data", details: error.errors });
      }
      console.error("Error creating health tip:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/health-tips/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markTipAsRead(id);
      if (!success) {
        return res.status(404).json({ error: "Tip not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking tip as read:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin routes for doctor management
  app.get("/api/admin/doctors/pending", async (req, res) => {
    try {
      const pendingDoctors = await storage.getPendingDoctors();
      res.json(pendingDoctors);
    } catch (error) {
      console.error("Error fetching pending doctors:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/doctors/:id/approve", async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const { approvedBy } = req.body;
      
      const doctor = await storage.approveDoctor(doctorId, approvedBy);
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }
      
      res.json(doctor);
    } catch (error) {
      console.error("Error approving doctor:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/doctors/:id/reject", async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const { rejectionReason } = req.body;
      
      const doctor = await storage.rejectDoctor(doctorId, rejectionReason);
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }
      
      res.json(doctor);
    } catch (error) {
      console.error("Error rejecting doctor:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin account creation route - for development/demo purposes
  app.post("/api/create-admin", async (req, res) => {
    try {
      // Check if admin already exists in local database
      const existingAdmin = await storage.getUserByEmail("admin@healthsync.com");
      
      if (existingAdmin) {
        return res.json({ 
          message: "Admin account already exists",
          email: "admin@healthsync.com",
          note: "Use Firebase Auth to create the authentication account if needed"
        });
      }

      // Create admin in local database
      const adminData = {
        firebaseUid: "admin_uid_manual_" + Date.now(),
        email: "admin@healthsync.com",
        name: "System Administrator",
        role: "admin" as const
      };

      const admin = await storage.createUser(adminData);
      
      res.json({
        message: "Admin account created successfully",
        admin: admin,
        credentials: {
          email: "admin@healthsync.com",
          password: "admin123",
          note: "You still need to create this account in Firebase Auth by registering through the app"
        }
      });
    } catch (error) {
      console.error("Error creating admin account:", error);
      res.status(500).json({ error: "Failed to create admin account" });
    }
  });

  // Seed data route - for development/demo purposes
  app.post("/api/seed-data", async (req, res) => {
    try {
      const { firebaseUid } = req.body;
      if (!firebaseUid) {
        return res.status(400).json({ error: "Firebase UID is required" });
      }

      // Check if user exists
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found. Please create user first." });
      }

      // Create sample doctors
      const sampleDoctors = [
        {
          userId: user.id,
          specialty: "Cardiology",
          experience: 15,
          consultationFee: "150.00",
          bio: "Experienced cardiologist specializing in heart disease prevention and treatment.",
          education: ["MD from Harvard Medical School", "Residency at Johns Hopkins"],
          languages: ["English", "Spanish"]
        },
        {
          userId: user.id,
          specialty: "General Practice",
          experience: 8,
          consultationFee: "80.00",
          bio: "Family medicine physician providing comprehensive primary care.",
          education: ["MD from University of California", "Family Medicine Residency"],
          languages: ["English", "French"]
        },
        {
          userId: user.id,
          specialty: "Endocrinology",
          experience: 12,
          consultationFee: "180.00",
          bio: "Diabetes and hormone specialist with expertise in metabolic disorders.",
          education: ["MD from Yale School of Medicine", "Endocrinology Fellowship"],
          languages: ["English"]
        }
      ];

      const createdDoctors = [];
      for (const doctor of sampleDoctors) {
        try {
          const created = await storage.createDoctor(doctor);
          createdDoctors.push(created);
        } catch (error) {
          console.log(`Doctor may already exist, skipping...`);
        }
      }

      // Create sample health tips
      const sampleTips = [
        {
          userId: user.id,
          category: "exercise" as const,
          title: "Daily Walking Benefits",
          content: "Walking for just 30 minutes daily can reduce your risk of heart disease, stroke, and diabetes by up to 50%. Start with 10-minute walks and gradually increase.",
          priority: "medium" as const
        },
        {
          userId: user.id,
          category: "nutrition" as const,
          title: "Heart-Healthy Diet",
          content: "Include more omega-3 rich foods like salmon, walnuts, and flaxseeds in your diet. These healthy fats help reduce inflammation and support cardiovascular health.",
          priority: "high" as const
        },
        {
          userId: user.id,
          category: "sleep" as const,
          title: "Quality Sleep Matters",
          content: "Aim for 7-9 hours of quality sleep each night. Good sleep helps regulate hormones, supports immune function, and improves mental health.",
          priority: "medium" as const
        }
      ];

      const createdTips = [];
      for (const tip of sampleTips) {
        try {
          const created = await storage.createAiHealthTip(tip);
          createdTips.push(created);
        } catch (error) {
          console.log(`Tip may already exist, skipping...`);
        }
      }

      res.json({ 
        message: "Sample data created successfully",
        doctors: createdDoctors,
        tips: createdTips
      });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
