# SmartCare Deployment Guide

## Netlify Deployment (Recommended)

### Step 1: Prepare for Production

1. **Build the application locally to test**:
   ```bash
   npm run build
   ```

2. **Verify the build works**:
   ```bash
   npm run preview
   ```

### Step 2: Deploy to Netlify

1. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com) and sign up/log in
   - Click "New site from Git"
   - Connect your GitHub/GitLab repository

2. **Configure Build Settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18 or higher

3. **Environment Variables**:
   Add these in Netlify dashboard under Site settings → Environment variables:
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```

### Step 3: Configure Firebase for Production

1. **Update Firebase Authorized Domains**:
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add your Netlify domain (e.g., `yoursite.netlify.app`)
   - Add any custom domains you plan to use

2. **Update Firestore Security Rules** (if needed):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow authenticated users to read/write their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Allow authenticated users to read doctor data for booking
       match /doctors/{doctorId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == doctorId;
       }
       
       // Allow users to manage their health data
       match /healthData/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Allow users to manage their appointments
       match /appointments/{appointmentId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### Step 4: Post-Deployment Verification

1. **Test Authentication**:
   - Create a new account
   - Log in with existing credentials
   - Verify password reset works

2. **Test Core Features**:
   - Add health data manually
   - Upload CSV health data
   - Book an appointment
   - Generate PDF report
   - Switch themes and languages

3. **Test Responsive Design**:
   - Mobile view (phones)
   - Tablet view
   - Desktop view

## Alternative Deployment Options

### Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Configure Environment Variables**:
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_PROJECT_ID
   vercel env add VITE_FIREBASE_APP_ID
   ```

### Manual Static Hosting

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Upload the `dist` folder** to any static hosting service:
   - GitHub Pages
   - Firebase Hosting
   - AWS S3 + CloudFront
   - DigitalOcean Spaces

## Performance Optimization

### Before Deployment

1. **Enable Compression**:
   Most hosting platforms handle this automatically

2. **Optimize Images**:
   All images are SVGs for optimal performance

3. **Lazy Loading**:
   Components are already optimized for code splitting

### After Deployment

1. **Monitor Performance**:
   - Use browser DevTools
   - Monitor Core Web Vitals
   - Check Firebase usage quotas

2. **CDN Configuration**:
   - Most platforms handle this automatically
   - Verify static assets are cached properly

## Security Checklist

- ✅ Firebase Security Rules configured
- ✅ Environment variables secured
- ✅ HTTPS enabled (automatic on most platforms)
- ✅ Authorized domains configured
- ✅ No sensitive data in client-side code

## Domain Configuration (Optional)

### Custom Domain Setup

1. **Purchase a domain** from any registrar
2. **Configure DNS**:
   - Point A record to hosting platform IP
   - Or set CNAME to platform domain
3. **Update Firebase Authorized Domains**:
   - Add your custom domain
4. **Enable SSL** (usually automatic)

### Recommended Domain Structure

- **Main app**: `smartcare.yourdom.in`
- **API docs**: `docs.smartcare.yourdom.in`
- **Status page**: `status.smartcare.yourdom.in`

## Monitoring & Analytics

### Firebase Analytics (Optional)

1. **Enable Firebase Analytics** in console
2. **Add tracking code** to `firebase.ts`
3. **Monitor user engagement** and app performance

### Error Monitoring

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for user insights

## Backup Strategy

### Firestore Backups

1. **Enable Firestore Backups** in Firebase Console
2. **Schedule regular exports** to Cloud Storage
3. **Test restore procedures** periodically

### Code Backups

- Repository is version controlled with Git
- Consider multiple git remotes for redundancy
- Regular dependency updates with security patches

## Cost Optimization

### Firebase Costs

- **Authentication**: Free for up to 50,000 MAU
- **Firestore**: Free tier generous for small apps
- **Hosting**: Consider Firebase Hosting for integration

### Monitoring Costs

- Set up billing alerts in Firebase Console
- Monitor usage in the Firebase dashboard
- Scale plans as needed

---

**SmartCare is now ready for production deployment!** 🚀

For support with deployment, refer to the main README.md or create an issue in the repository.