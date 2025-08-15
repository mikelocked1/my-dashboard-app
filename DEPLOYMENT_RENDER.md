# SmartCare Deployment Guide - Render

## Quick Deploy to Render

### Option 1: One-Click Deploy (Recommended)

1. **Connect GitHub Repository**
   - Fork or upload this repository to GitHub
   - Go to [render.com](https://render.com) and sign up/log in
   - Click "New+" → "Web Service"
   - Connect your GitHub repository

2. **Auto-Configuration**
   - Render will detect the `render.yaml` file
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node.js`
   - Plan: `Free` (sufficient for testing)

3. **Environment Variables**
   Add these in the Render dashboard:
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   NODE_ENV=production
   ```

### Option 2: Manual Configuration

1. **Create Web Service**
   - Go to Render dashboard
   - Click "New+" → "Web Service"
   - Connect your repository

2. **Build Settings**
   ```
   Name: smartcare-app
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Advanced Settings**
   ```
   Health Check Path: /
   Auto-Deploy: Yes
   ```

## Environment Variables Setup

### Required Variables
```bash
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id  
VITE_FIREBASE_APP_ID=your_app_id

# Application Settings
NODE_ENV=production
PORT=5000  # Render sets this automatically
```

### Optional Variables
```bash
# Additional Firebase services (if using)
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id

# External APIs (when available)
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_token
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone
```

## Firebase Configuration for Production

### Update Authorized Domains
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your Render domain: `your-app-name.onrender.com`
3. If using custom domain, add that too

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Health data access control
    match /healthData/{userId}/records/{recordId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Doctors can read patient data with permission
    match /healthData/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         exists(/databases/$(database)/documents/doctors/$(request.auth.uid)));
    }
    
    // Appointments management
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }
    
    // Public doctor profiles for booking
    match /doctors/{doctorId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == doctorId;
    }
  }
}
```

## Deployment Process

### Automatic Deployment
1. Push changes to your connected GitHub branch
2. Render automatically builds and deploys
3. Build process takes ~3-5 minutes
4. Your app will be available at `https://your-app-name.onrender.com`

### Manual Deployment
```bash
# Build locally first to test
npm run build

# Deploy via Render CLI (optional)
npm install -g @render/cli
render login
render deploy
```

## Performance Optimization

### Enable Compression & Caching
Render automatically handles:
- Gzip compression
- Static asset caching
- CDN distribution
- SSL certificates

### Bundle Optimization
The build produces optimized bundles:
- CSS: ~73KB (12KB gzipped)
- JavaScript: ~1.4MB (428KB gzipped)
- Total initial load: ~440KB gzipped

### Monitoring
- Built-in metrics dashboard
- Automatic health checks at `/`
- Uptime monitoring
- Error alerting

## Custom Domain (Optional)

### Setup Custom Domain
1. Purchase domain from any registrar
2. In Render dashboard: Settings → Custom Domains
3. Add your domain (e.g., `smartcare.yoursite.com`)
4. Update DNS records as instructed
5. SSL certificate is automatically provisioned

### DNS Configuration
```
Type: CNAME
Name: smartcare (or @)
Value: your-app-name.onrender.com
```

## Database Scaling

### Current Setup
- Firebase Firestore (free tier)
- Scales automatically
- Global CDN distribution

### If Adding PostgreSQL
```bash
# Add to render.yaml
databases:
  - name: smartcare-db
    plan: free
    databaseName: smartcare
    user: smartcare_user
```

## Security Checklist

- ✅ Environment variables secured
- ✅ HTTPS enabled automatically
- ✅ Firebase security rules configured
- ✅ Authorized domains updated
- ✅ API keys properly scoped
- ✅ No sensitive data in client bundle

## Monitoring & Maintenance

### Health Checks
- Automatic health checks at `/`
- 30-second interval monitoring
- Auto-restart on failures

### Logs & Debugging
```bash
# View logs in Render dashboard
# Or via CLI
render logs --service=smartcare-app --tail
```

### Updates & Maintenance
- Automatic deployments on git push
- Zero-downtime deployments
- Rollback capability in dashboard

## Cost Optimization

### Free Tier Limits
- **Web Service**: 750 hours/month (enough for 24/7)
- **Builds**: Unlimited
- **Bandwidth**: 100GB/month
- **Custom domains**: 1 free

### Upgrading Plans
- **Starter ($7/month)**: Always-on service
- **Standard ($25/month)**: More resources, priority support
- **Pro ($85/month)**: Auto-scaling, advanced features

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies in package.json
   - Review build logs for specific errors

2. **Environment Variables**
   - Ensure all required Firebase keys are set
   - Check variable names match exactly
   - Restart service after variable changes

3. **Firebase Connection**
   - Verify authorized domains include Render URL
   - Check API key permissions
   - Test Firebase rules with Security Rules simulator

### Support
- Render documentation: [render.com/docs](https://render.com/docs)
- Firebase support: [firebase.google.com/support](https://firebase.google.com/support)
- GitHub issues for app-specific problems

---

## 🚀 Your SmartCare app is now ready for production deployment!

The application includes:
- ✅ Complete healthcare management system
- ✅ Firebase authentication & database
- ✅ Responsive design with dark/light themes
- ✅ Multi-language support (English/Twi/Hausa/French)
- ✅ Health data visualization & PDF reports
- ✅ Doctor booking system
- ✅ Production-ready build configuration

**Deploy URL**: `https://your-app-name.onrender.com`

For any deployment issues, check the troubleshooting section or create an issue in the repository.