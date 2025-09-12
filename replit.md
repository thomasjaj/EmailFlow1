# EmailPro

## Overview

EmailPro is a comprehensive email marketing platform that enables users to create, send, and track email campaigns with professional features. The application provides multi-server SMTP support, advanced analytics, contact management, and email template creation capabilities.

The system is built as a full-stack web application with a React frontend, Express.js backend, and PostgreSQL database. It includes authentication through Replit Auth, file upload capabilities via Google Cloud Storage, and real-time campaign tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**August 21, 2025 - GitHub Repository Setup Complete**
- EmailPro project fully prepared for GitHub deployment to https://github.com/thomasjaj/emailpro.git
- Created comprehensive PowerMTA VirtualBox installation script with automated setup
- Added detailed documentation for VM deployment without port 25 requirements
- All project files organized and ready for open-source publication
- Git repository configured but experiencing lock issues during remote setup in Replit environment

**August 16, 2025 - Project Organization and GitHub Preparation Complete**
- Completely organized EmailPro project structure for GitHub publication
- Created comprehensive documentation (README, API docs, deployment guides)
- Removed all temporary files and outdated PowerMTA configurations
- Added professional .gitignore and GitHub Actions CI/CD pipeline
- Created automated setup and backup scripts for production deployment
- Updated PowerMTA integration guide with generic template for any server setup
- Added contributing guidelines and changelog for open source collaboration
- Project now ready for GitHub publication with professional presentation

**August 16, 2025 - Successful Ubuntu 24.04 Production Deployment**
- Successfully deployed EmailPro on standalone Ubuntu 24.04 server (192.168.100.170)
- Configured PostgreSQL 16 database with custom authentication
- Created custom authentication bypass system for standalone deployment
- Application fully operational with PM2 process management
- Complete email marketing platform ready for campaign management and analytics

**January 12, 2025 - Production Installation Guide**
- Created comprehensive CentOS 10 installation guide for production deployment
- Fixed runtime error "campaigns.map is not a function" in ClickTracking component
- Corrected navigation routing for all missing pages (Lists & Segments, Click Tracking, Account Settings)
- Resolved API query key format issues causing [object Object] errors
- All 7 missing platform sections now fully functional and tested
- Platform ready for production deployment on CentOS servers

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components with Radix UI primitives and Tailwind CSS for styling
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **File Uploads**: Uppy with AWS S3 integration for handling email attachments and assets

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API endpoints with consistent error handling
- **File Processing**: Server-side file handling with streaming support
- **Development Tools**: Hot reloading with Vite in development mode

### Database Design
- **Primary Database**: PostgreSQL with connection pooling via Neon serverless
- **Schema Management**: Drizzle migrations with type-safe schema definitions
- **Key Entities**: Users, SMTP servers, contact lists, contacts, email templates, campaigns, and email events
- **Session Storage**: PostgreSQL-backed session store for authentication persistence

### Authentication & Authorization
- **Authentication Provider**: Replit OIDC integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Security**: HTTPS enforcement, secure cookies, and CSRF protection
- **User Management**: Automatic user provisioning and profile synchronization

### Email Infrastructure
- **SMTP Management**: Multi-server SMTP configuration with load balancing capabilities
- **Template Engine**: HTML/text email template builder with variable substitution
- **Campaign Management**: Scheduled sending, recipient targeting, and delivery tracking
- **Analytics Tracking**: Email opens, clicks, bounces, and unsubscribe tracking

### File Storage & CDN
- **Cloud Storage**: Google Cloud Storage for static assets and email attachments
- **Upload Handling**: Multi-part uploads with progress tracking
- **Asset Management**: Organized storage structure with automatic cleanup

## External Dependencies

### Cloud Services
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **Google Cloud Storage**: File storage and CDN for email assets
- **Replit Authentication**: OIDC provider for user authentication

### Key NPM Packages
- **Backend**: Express.js, Drizzle ORM, Passport.js for auth, Memoizee for caching
- **Frontend**: React, TanStack React Query, Radix UI, Tailwind CSS, Uppy
- **Development**: TypeScript, Vite, ESBuild for production builds
- **Utilities**: Zod for validation, date-fns for date handling, Lucide for icons

### Email & Communication
- **SMTP Integration**: Support for multiple SMTP providers (configurable)
- **Email Templates**: Rich HTML email builder with responsive design
- **Delivery Tracking**: Webhook integrations for tracking email events

### Development & Deployment
- **Build System**: Vite for frontend, ESBuild for backend bundling
- **Code Quality**: TypeScript strict mode, ESLint configuration
- **Environment**: Replit-optimized development environment with hot reloading