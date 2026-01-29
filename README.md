# EmailPro - Professional Email Marketing Platform

A comprehensive email marketing platform that enables users to create, send, and track email campaigns with professional features. Built with React, Express.js, PostgreSQL, and integrated with PowerMTA for enterprise-grade email delivery.

## � Quick Installation

### One-Command Installation for CentOS 10

```bash
curl -fsSL https://raw.githubusercontent.com/thomasjaj/EmailFlow1/main/install-centos10.sh | sudo bash
```

**[📖 Full Installation Guide](INSTALLATION_GUIDE.md)** - Includes troubleshooting, SSL setup, and advanced configuration

## �🚀 Features

### Campaign Management
- Create and manage email campaigns
- Schedule sending with optimal timing
- Template-based email creation
- A/B testing capabilities
- Real-time campaign monitoring

### Contact Management
- Import contacts from various sources
- Create and manage contact lists
- Advanced segmentation tools
- Contact engagement tracking
- Automated list hygiene

### Analytics & Reporting
- Real-time delivery tracking
- Open and click rate analytics
- Bounce and complaint monitoring
- Domain reputation tracking
- Comprehensive reporting dashboard

### Email Infrastructure
- Multi-server SMTP support
- PowerMTA integration for high-volume sending
- IP warming and reputation management
- Automated bounce handling
- Feedback loop processing

### Advanced Features
- DKIM and SPF authentication
- Suppression list management
- Deliverability optimization
- Server health monitoring
- User account management

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components
- **TanStack React Query** for state management
- **Wouter** for client-side routing

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** for data persistence
- **Replit Auth** for authentication
- **Google Cloud Storage** for file handling

### Email Delivery
- **PowerMTA** integration for enterprise sending
- **Multi-IP** support and rotation
- **ISP-specific** delivery optimization
- **Real-time** bounce and feedback processing

## 📋 Requirements

### System Requirements
- **CentOS 10** (or compatible Linux distribution)
- **Node.js 20+**
- **PostgreSQL 13+**
- **Minimum 4GB RAM**
- **20GB disk space**

### Optional (Recommended)
- **PowerMTA license** for high-volume sending
- **Multiple IP addresses** for better deliverability
- **SSL certificate** for secure connections

## 🛠️ Installation

### Quick Start (Development)
```bash
# Clone the repository
git clone https://github.com/thomasjaj/emailpro.git
cd emailpro

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and configuration details

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Production Deployment

For production deployment on CentOS 10, follow the comprehensive guides:

1. **[CentOS Installation Guide](CENTOS_INSTALLATION.md)** - Complete system setup
2. **[PowerMTA Integration Guide](POWERMTA_INTEGRATION.md)** - Enterprise email delivery

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/emailpro

# Authentication
SESSION_SECRET=your-session-secret
REPL_ID=your-replit-app-id
ISSUER_URL=https://replit.com/oidc

# Email Configuration
SMTP_HOST=localhost
SMTP_PORT=25
PMTA_WEB_MONITOR=http://localhost:8080

# Storage
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name
```

### PowerMTA Setup

The platform integrates seamlessly with PowerMTA for enterprise email delivery:

- **High-volume sending** (millions of emails per hour)
- **Advanced queue management** with ISP optimization
- **Real-time delivery tracking** and analytics
- **Automatic bounce and complaint handling**
- **IP warming and reputation management**

See [PowerMTA Integration Guide](POWERMTA_INTEGRATION.md) for detailed setup instructions.

## 📊 Usage

### Dashboard
Access the main dashboard at `http://your-domain.com` after installation. The dashboard provides:
- Campaign overview and statistics
- Real-time delivery monitoring
- Contact list management
- Template creation tools
- Analytics and reporting

### API Endpoints

The platform provides a comprehensive REST API:

```
# Authentication
GET  /api/auth/user

# Campaigns
GET  /api/campaigns
POST /api/campaigns
PUT  /api/campaigns/:id

# Contacts
GET  /api/contact-lists
GET  /api/contacts/:listId
POST /api/contacts/import

# Analytics
GET  /api/analytics/deliverability/:days/:server
GET  /api/analytics/click-tracking/:campaign/:days
GET  /api/analytics/bounce-analysis/:days

# PowerMTA Integration
GET  /api/pmta/status
GET  /api/pmta/queue
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
```bash
docker build -t emailpro .
docker run -p 5000:5000 emailpro
```

## 📈 Performance

### Scalability
- **High throughput**: Supports millions of emails per day
- **Horizontal scaling**: Multiple server deployment support
- **Database optimization**: Efficient queries with connection pooling
- **CDN integration**: Fast asset delivery via Google Cloud Storage

### Monitoring
- Real-time server health monitoring
- Database performance tracking
- Email delivery rate monitoring
- Alert system for critical issues

## 🔐 Security

### Authentication
- Secure session management with PostgreSQL storage
- HTTPS enforcement in production
- CSRF protection
- User session timeout

### Email Security
- DKIM signing for all outbound emails
- SPF record validation
- Bounce and complaint feedback loops
- Suppression list management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use consistent code formatting
- Write comprehensive tests
- Update documentation for new features

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Installation Guide](CENTOS_INSTALLATION.md)
- [PowerMTA Integration](POWERMTA_INTEGRATION.md)
- [API Documentation](docs/API.md)

### Community
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions
- **Support**: Email support at support@yourdomain.com

## 🙏 Acknowledgments

- Built with modern web technologies
- Powered by PowerMTA for enterprise email delivery
- UI components from shadcn/ui
- Authentication via Replit Auth
- Database management with Drizzle ORM

---

**EmailPro** - Professional email marketing made simple and scalable.