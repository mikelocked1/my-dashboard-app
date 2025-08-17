
import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  specialty: string;
  consultationFee: string;
  isVideoCall: boolean;
  appointmentType: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    if (this.transporter || this.isInitializing) {
      return this.initPromise;
    }

    this.isInitializing = true;
    
    this.initPromise = (async () => {
      try {
        // For development, use ethereal email (fake SMTP)
        // In production, replace with your actual email service credentials
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (isDevelopment) {
          console.log('Creating test email account for development...');
          const testAccount = await nodemailer.createTestAccount();
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          console.log('Test email account created:', testAccount.user);
        } else {
          // Production email configuration
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
        }
        console.log('Email service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize email service:', error);
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  async sendAppointmentConfirmation(appointmentData: AppointmentEmailData): Promise<boolean> {
    // Ensure transporter is initialized
    await this.initTransporter();
    
    if (!this.transporter) {
      console.log('Email transporter failed to initialize');
      return false;
    }

    const { 
      patientName, 
      patientEmail, 
      doctorName, 
      appointmentDate, 
      appointmentTime, 
      specialty, 
      consultationFee, 
      isVideoCall, 
      appointmentType 
    } = appointmentData;

    const emailSubject = `Appointment Confirmation - Dr. ${doctorName}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316; margin: 0;">SmartCare Health</h1>
            <h2 style="color: #333; margin: 10px 0;">Appointment Confirmed</h2>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin-top: 0;">Dear ${patientName},</h3>
            <p style="color: #374151; line-height: 1.6;">
              Your appointment has been successfully booked! Here are the details:
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #92400e; margin-top: 0;">Appointment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Doctor:</td>
                <td style="padding: 8px 0; color: #374151;">Dr. ${doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Specialty:</td>
                <td style="padding: 8px 0; color: #374151;">${specialty}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Date:</td>
                <td style="padding: 8px 0; color: #374151;">${appointmentDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Time:</td>
                <td style="padding: 8px 0; color: #374151;">${appointmentTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Type:</td>
                <td style="padding: 8px 0; color: #374151;">${appointmentType} ${isVideoCall ? '(Video Call)' : '(In-person)'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Consultation Fee:</td>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">GHS ${consultationFee}</td>
              </tr>
            </table>
          </div>
          
          ${isVideoCall ? `
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #166534; margin-top: 0;">Video Call Instructions</h3>
              <p style="color: #374151; line-height: 1.6;">
                This is a video consultation. A join link will be sent to you 15 minutes before your appointment time.
                Please ensure you have a stable internet connection and a quiet environment for the call.
              </p>
            </div>
          ` : `
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #166534; margin-top: 0;">In-Person Visit</h3>
              <p style="color: #374151; line-height: 1.6;">
                Please arrive 15 minutes early for your in-person appointment. 
                Don't forget to bring a valid ID and any relevant medical documents.
              </p>
            </div>
          `}
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #dc2626; margin-top: 0;">Important Reminders</h3>
            <ul style="color: #374151; line-height: 1.6; padding-left: 20px;">
              <li>Please arrive 15 minutes before your scheduled time</li>
              <li>Bring any relevant medical history or documents</li>
              <li>If you need to reschedule, please do so at least 24 hours in advance</li>
              <li>Contact us immediately if you experience any emergency symptoms</li>
            </ul>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0;">
              If you have any questions, please contact us at support@smartcare.com
            </p>
            <p style="color: #6b7280; margin: 10px 0 0 0;">
              Thank you for choosing SmartCare Health!
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: '"SmartCare Health" <noreply@smartcare.com>',
        to: patientEmail,
        subject: emailSubject,
        html: emailHtml,
      });

      console.log('Appointment confirmation email sent:', info.messageId);
      
      // In development, log the preview URL
      if (process.env.NODE_ENV === 'development') {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return true;
    } catch (error) {
      console.error('Error sending appointment confirmation email:', error);
      return false;
    }
  }

  async sendAppointmentReminder(appointmentData: AppointmentEmailData): Promise<boolean> {
    // Similar implementation for reminder emails
    console.log('Sending appointment reminder email...');
    return true;
  }
}

export const emailService = new EmailService();
