# SmartCare Healthcare Management System

## Overview

SmartCare is an intelligent healthcare companion application that provides comprehensive health monitoring, doctor consultations, and personalized health insights. The system serves three types of users: patients, doctors, and administrators, offering features like health data tracking, appointment booking, AI-powered health tips, smartwatch integration, and detailed health reporting.

## Recent Changes (August 14, 2025)

✓ **Application Successfully Deployed**: SmartCare is now fully functional and running on port 5000
✓ **Firebase Integration Complete**: Authentication and Firestore database properly configured with user-provided API keys
✓ **CSS Styling Issues Resolved**: Fixed all Tailwind CSS opacity class conflicts and custom color definitions
✓ **Chart.js Error Fixed**: Resolved HeartRateChart component error with proper context handling for dynamic color functions
✓ **Comprehensive Documentation**: Created detailed README.md with Firebase setup instructions, deployment guides, and feature documentation
✓ **All Core Features Operational**: Health tracking, doctor booking, PDF reports, multi-language support, and theme switching working properly

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using React with TypeScript, implementing a modern component-based architecture. The UI leverages Radix UI components with custom Tailwind CSS styling for consistent design. The application uses Wouter for client-side routing and TanStack Query for efficient server state management and caching.

Key frontend decisions:
- **Component Library**: Radix UI provides accessible, unstyled components that are customized with Tailwind CSS
- **State Management**: TanStack Query handles server state while React Context manages authentication and theme state
- **Routing**: Wouter provides a lightweight routing solution suitable for the application's needs
- **Styling**: Tailwind CSS with CSS custom properties enables consistent theming and responsive design

### Backend Architecture
The server follows a RESTful API design pattern using Express.js with TypeScript. The application implements a layered architecture with clear separation between routes, business logic, and data access through a storage interface pattern.

Current backend structure:
- **API Layer**: Express routes handle HTTP requests and responses
- **Storage Layer**: Abstract storage interface allows for flexible data persistence implementations
- **Middleware**: Custom logging and error handling middleware for request processing

### Authentication & Authorization
The system uses Firebase Authentication for user management, providing secure login/registration with email/password. User profiles are stored in Firestore with role-based access control supporting three user types: patients, doctors, and administrators.

Authentication features:
- **Firebase Auth**: Handles user authentication and session management
- **Role-based Access**: Different UI and functionality based on user roles
- **Protected Routes**: Client-side route protection based on authentication status

### Data Management
The application uses a hybrid data storage approach with Firebase Firestore for real-time data and Drizzle ORM configured for PostgreSQL as the primary database. Health data is structured with comprehensive schemas for users, doctors, health metrics, appointments, and AI-generated insights.

Data architecture highlights:
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Firebase Firestore**: Real-time updates for collaborative features
- **Schema Validation**: Zod schemas ensure data integrity across the application
- **Health Data Types**: Support for various metrics (heart rate, blood pressure, steps, etc.)

### Real-time Features
The system implements real-time capabilities through Firebase Firestore for live updates on appointments, health alerts, and collaborative features between patients and doctors.

### Multi-language Support
Internationalization is implemented with support for English, Twi, Hausa, and French, catering to diverse user bases with a centralized translation system.

## External Dependencies

### Database Services
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL for scalable data storage
- **Firebase Firestore**: Real-time database for collaborative features and live updates
- **Drizzle ORM**: Type-safe database operations and migrations

### Authentication & User Management
- **Firebase Authentication**: User registration, login, and session management
- **Firebase Firestore**: User profile and role management storage

### Frontend Libraries
- **React**: Core UI framework with TypeScript support
- **Radix UI**: Accessible component primitives for consistent UI
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Chart.js**: Data visualization for health metrics and analytics
- **Wouter**: Lightweight client-side routing

### Development & Build Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast bundling for production builds

### Third-party Integrations
- **Smartwatch APIs**: Integration capabilities for Apple Watch and other devices (implementation ready)
- **PDF Generation**: jsPDF for health report generation
- **CSV Parsing**: Health data import functionality
- **Date Utilities**: date-fns for date manipulation and formatting

### Monitoring & Development
- **Replit Integration**: Development environment optimizations and runtime error handling
- **Development Middleware**: Request logging and error tracking during development