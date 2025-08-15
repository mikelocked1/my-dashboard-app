# SmartCare - Netlify Deployment Guide

## Overview
This guide covers deploying the SmartCare healthcare management system to Netlify with serverless functions for the API backend.

## Prerequisites

1. **Netlify Account**: Create an account at https://netlify.com
2. **Database**: Set up a production PostgreSQL database (recommended: Neon, PlanetScale, or Railway)
3. **Firebase Project**: Configure Firebase for production use

## Environment Variables

Configure the following environment variables in your Netlify dashboard:

### Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database
```

### Firebase Configuration
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Deployment Steps

### 1. Connect Repository
1. Push your code to GitHub, GitLab, or Bitbucket
2. In Netlify dashboard, click "New site from Git"
3. Connect your repository

### 2. Build Settings
Configure the following build settings:
- **Build command**: `npm run build`
- **Publish directory**: `dist/public`
- **Functions directory**: `netlify/functions`

### 3. Environment Variables
1. Go to Site settings → Environment variables
2. Add all the environment variables listed above
3. Ensure Firebase variables have the `VITE_` prefix

### 4. Database Setup
1. Create production database tables using:
   ```bash
   npm run db:push
   ```
2. Ensure your production database URL is correctly set

### 5. Deploy
1. Trigger deployment from Netlify dashboard
2. Monitor build logs for any issues
3. Test the deployed application

## Architecture

### Frontend
- Built with Vite and deployed as static files to CDN
- Uses React with TypeScript for the user interface
- Includes all necessary build optimizations

### Backend API
- Deployed as Netlify Functions (serverless)
- Handles all database operations and business logic
- Uses PostgreSQL for data persistence
- Includes proper CORS configuration for frontend requests

### Database
- PostgreSQL database hosted externally (not on Netlify)
- Drizzle ORM for type-safe database operations
- Connection pooling for optimal performance

## Post-Deployment

### Testing
1. Test user registration and login
2. Verify health data entry and retrieval
3. Check doctor portal functionality
4. Test appointment booking system
5. Validate report generation

### Monitoring
1. Set up Netlify Analytics for usage insights
2. Monitor function execution times and errors
3. Check database performance and connections

### Custom Domain (Optional)
1. Purchase domain from your preferred registrar
2. Configure DNS settings in Netlify
3. Enable HTTPS (automatic with Netlify)

## Troubleshooting

### Common Issues

**Build Failures**
- Check build logs for specific error messages
- Verify all dependencies are properly installed
- Ensure environment variables are correctly set

**API Function Errors**
- Check function logs in Netlify dashboard
- Verify database connection string
- Ensure all secrets are properly configured

**Database Connection Issues**
- Verify DATABASE_URL format and credentials
- Check database server allows connections from Netlify's IP ranges
- Test connection locally first

**Firebase Authentication Issues**
- Verify all Firebase environment variables
- Check Firebase project settings
- Ensure domains are added to Firebase auth settings

### Performance Optimization

1. **Database Queries**
   - Add appropriate indexes
   - Optimize query patterns
   - Use connection pooling

2. **Frontend Assets**
   - Images are automatically optimized by Vite
   - JavaScript bundles are split for optimal loading
   - CSS is minimized and extracted

3. **Function Cold Starts**
   - Keep functions warm with scheduled pings
   - Optimize import statements
   - Use lightweight dependencies

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to repository
   - Use different Firebase projects for dev/prod
   - Rotate database credentials regularly

2. **API Security**
   - CORS is configured for production domains
   - Input validation on all endpoints
   - Proper error handling without information leakage

3. **Database Security**
   - Use strong database passwords
   - Enable SSL connections
   - Regular security updates

## Maintenance

### Regular Tasks
1. Monitor application performance
2. Update dependencies monthly
3. Review and optimize database queries
4. Check for security updates

### Scaling Considerations
- Netlify Functions auto-scale based on demand
- Database may need upgrading for high traffic
- Consider CDN optimization for global users
- Monitor function execution limits

## Support
For deployment issues:
1. Check Netlify documentation
2. Review application logs
3. Test locally with production environment variables
4. Contact support if needed

## Cost Estimation
- Netlify: Free tier includes 100GB bandwidth, 300 build minutes
- Database: Varies by provider (Neon free tier available)
- Firebase: Generous free tier for authentication
- Domain: $10-15/year (optional)

Total estimated cost: $0-20/month for small to medium usage