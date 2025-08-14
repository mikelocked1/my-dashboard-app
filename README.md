# SmartCare - Intelligent Health Companion

A comprehensive healthcare management system that provides health monitoring, doctor consultations, and personalized health insights with Firebase authentication and Firestore database.

## Features

### 🔐 **Secure Authentication**
- Firebase Authentication with email/password
- Role-based access (Patient, Doctor, Admin)
- Secure session management

### 📊 **Health Data Management**
- Manual health data entry
- CSV file upload for bulk data import
- Smartwatch integration (Apple Watch, Fitbit, Samsung Health)
- Interactive Chart.js visualizations
- Heart rate classification (Good: 60-100 BPM, Alert: <60 or >100 BPM)

### 🩺 **Doctor Booking System**
- Browse available doctors
- Real-time appointment scheduling
- Instant booking confirmation
- Doctor portal for patient management

### 🤖 **AI Health Insights**
- Personalized health recommendations
- Risk assessment and alerts
- Health trend analysis
- Multilingual support (English, Twi, Hausa, French)

### 📱 **Modern UI/UX**
- African-inspired design elements
- Dark/Light mode toggle
- Responsive design for all devices
- Accessibility-first approach

### 📋 **Reports & Analytics**
- Downloadable PDF health reports
- Shareable health summaries
- Detailed health metrics analysis
- Export capabilities

### 🔔 **Health Alerts**
- Real-time health monitoring
- Critical value notifications
- Browser notifications
- SMS alerts (Twilio integration ready)

## Quick Start

### Prerequisites
- Node.js 18+ 
- Firebase account
- Modern web browser

### 1. Firebase Setup

1. **Create Firebase Project**
   ```bash
   # Go to https://console.firebase.google.com
   # Click "Create a project" and follow the wizard
   ```

2. **Enable Authentication**
   - In Firebase Console → Authentication → Sign-in method
   - Enable "Email/Password" provider
   - Save your changes

3. **Enable Firestore Database**
   - In Firebase Console → Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" for development
   - Select your preferred location

4. **Add Web App**
   - In Firebase Console → Project Overview → Add app → Web
   - Register your app with a nickname (e.g., "SmartCare Web")
   - Copy the configuration object

5. **Configure Authorized Domains**
   - In Firebase Console → Authentication → Settings → Authorized domains
   - Add your development URL (e.g., `replit.dev` domain)
   - For production, add your deployment domain

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Optional: Additional Firebase services
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id

# Development
NODE_ENV=development
PORT=5000
```

### 3. Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5000 in your browser
```

## 🔧 Smartwatch Integration Setup

### Apple Watch / HealthKit
```env
# Add to your .env file when you get Apple Developer access
VITE_APPLE_HEALTH_API_KEY=your_apple_health_api_key
```

### Fitbit Integration
```env
# Register at https://dev.fitbit.com
VITE_FITBIT_CLIENT_ID=your_fitbit_client_id
VITE_FITBIT_CLIENT_SECRET=your_fitbit_client_secret
```

### Samsung Health
```env
# Register at https://developer.samsung.com/health
VITE_SAMSUNG_HEALTH_API_KEY=your_samsung_health_api_key
```

**Note**: The app currently uses mock data for smartwatch integration. Replace with actual API calls when you obtain the necessary API keys.

## 📲 SMS Alerts Setup (Optional)

For SMS health alerts via Twilio:

```env
# Get these from https://www.twilio.com/console
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token  
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## 🚀 Deployment

### Deploy to Netlify

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

3. **Configure Firebase**
   - Add your Netlify domain to Firebase authorized domains
   - Update any hardcoded URLs to use your production domain

### Build Command
```bash
npm run build
```

### Production Environment Variables
Make sure to set these in your deployment platform:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID` 
- `VITE_FIREBASE_APP_ID`
- Any additional API keys for integrations

## 🗂️ Project Structure

```
smartcare/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Application pages
│   │   └── utils/          # Helper functions
├── server/                 # Express.js backend
├── shared/                 # Shared TypeScript schemas
├── README.md              # This file
└── package.json           # Dependencies and scripts
```

## 🔒 Security Features

- **Firebase Authentication**: Industry-standard authentication
- **Role-based Access Control**: Different permissions for patients, doctors, and admins
- **Data Validation**: Comprehensive input validation with Zod schemas
- **Secure API Design**: RESTful API with proper error handling
- **End-to-end Encryption Ready**: Infrastructure prepared for encryption implementation

## 🌍 Internationalization

Supported languages:
- **English** - Primary language
- **Twi** - Ghanaian language
- **Hausa** - Nigerian/West African language  
- **French** - French language support

To add more languages, edit `client/src/lib/i18n.ts`.

## 📊 Health Data Types

The system supports tracking:
- Heart Rate (BPM)
- Blood Pressure (mmHg)
- Body Weight (kg)
- Blood Sugar (mg/dL)
- Body Temperature (°C)
- Daily Steps
- Sleep Duration (hours)

## 🔄 Data Import/Export

### CSV Import Format
```csv
type,value,date,notes
heart_rate,72,2024-03-01,Morning reading
blood_pressure,120/80,2024-03-01,After exercise
weight,70.5,2024-03-01,
steps,8547,2024-03-01,Daily total
```

### PDF Export
Generated reports include:
- Health metrics summary
- Trend analysis
- Detailed readings table
- AI-powered recommendations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. **Firebase Setup Issues**: Ensure all Firebase services are enabled and domains are authorized
2. **API Integration**: Check that all required API keys are properly configured
3. **Build Issues**: Verify Node.js version compatibility (18+)
4. **General Questions**: Create an issue in the GitHub repository

## 🔮 Roadmap

- [ ] Real smartwatch API integrations
- [ ] Advanced AI health predictions
- [ ] Telemedicine video consultations  
- [ ] Medication reminders
- [ ] Family health sharing
- [ ] Insurance integration
- [ ] Clinical trial matching
- [ ] Mental health tracking

---

**SmartCare** - Your intelligent companion for better health management.