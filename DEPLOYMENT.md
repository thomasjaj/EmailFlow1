# Deployment Guide for EmailPro

This guide covers deploying EmailPro to GitHub and setting up production environments.

## Pushing to GitHub Repository

Since you have the repository https://github.com/thomasjaj/emailpro, here are the commands to push your code:

### Step 1: Prepare Your Local Repository

```bash
# Navigate to your project directory
cd /path/to/emailpro

# Check if git is already initialized
git status

# If not initialized, initialize git
git init

# Add your GitHub repository as remote
git remote add origin https://github.com/thomasjaj/emailpro.git

# Or if remote already exists, update it
git remote set-url origin https://github.com/thomasjaj/emailpro.git
```

### Step 2: Prepare Files for Commit

```bash
# Create .gitignore to exclude sensitive files
echo "node_modules/
.env
.env.local
.env.production
dist/
build/
*.log
.DS_Store
.vscode/
.idea/
*.swp
*.swo
.nyc_output/
coverage/
.cache/
tmp/
temp/" > .gitignore

# Add all files to staging
git add .

# Check what will be committed
git status
```

### Step 3: Commit and Push

```bash
# Make initial commit
git commit -m "Initial commit: EmailPro email marketing platform

- Complete React + Express.js email marketing platform
- PostgreSQL database with Drizzle ORM
- Replit Auth integration
- PowerMTA support for enterprise email delivery
- Comprehensive analytics and reporting
- Contact management and segmentation
- Campaign creation and scheduling
- Template management system
- Multi-server SMTP support
- Real-time delivery tracking
- Bounce and complaint handling
- Production-ready CentOS installation guide"

# Push to GitHub
git push -u origin main
```

### Step 4: Set Up GitHub Repository

1. **Go to your repository**: https://github.com/thomasjaj/emailpro
2. **Add repository description**: "Professional email marketing platform with PowerMTA integration"
3. **Add topics/tags**: `email-marketing`, `nodejs`, `react`, `postgresql`, `powermta`, `typescript`
4. **Enable GitHub Pages** (if you want to host documentation)
5. **Set up branch protection** for main branch

## Production Deployment Options

### Option 1: Manual Server Deployment

Follow the comprehensive guides included in your repository:

1. **[CENTOS_INSTALLATION.md](CENTOS_INSTALLATION.md)** - Complete CentOS 10 setup
2. **[POWERMTA_INTEGRATION.md](POWERMTA_INTEGRATION.md)** - PowerMTA integration

### Option 2: Cloud Deployment

#### DigitalOcean Droplet
```bash
# Create CentOS 10 droplet (4GB RAM minimum)
# SSH into your server
ssh root@your-server-ip

# Clone your repository
git clone https://github.com/thomasjaj/emailpro.git
cd emailpro

# Follow the installation guide
cat CENTOS_INSTALLATION.md
```

#### AWS EC2
```bash
# Launch CentOS 10 instance (t3.medium or larger)
# Configure security groups (ports 22, 80, 443, 25, 587)
# SSH and clone repository
git clone https://github.com/thomasjaj/emailpro.git
```

#### Google Cloud Platform
```bash
# Create Compute Engine instance with CentOS 10
# Configure firewall rules
# Deploy using the installation guide
```

### Option 3: Docker Deployment

Create a Dockerfile for containerized deployment:

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
```

```bash
# Build and run with Docker
docker build -t emailpro .
docker run -p 5000:5000 -e DATABASE_URL=your_db_url emailpro
```

## Environment Setup

### Required Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
nano .env
```

Fill in all required values:
- Database connection details
- Session secrets
- SMTP/PowerMTA configuration
- Authentication settings

### Database Setup

```bash
# Create PostgreSQL database
createdb emailpro

# Run migrations
npm run db:push

# Verify setup
psql emailpro -c "\dt"
```

### SSL Certificate Setup

```bash
# Using Let's Encrypt (recommended)
certbot --nginx -d yourdomain.com

# Or use your own certificates
# Copy certificates to /etc/ssl/certs/
```

## Post-Deployment Steps

### 1. DNS Configuration

```bash
# Add DNS records for your domain
A     yourdomain.com        -> your-server-ip
MX    yourdomain.com        -> yourdomain.com
TXT   yourdomain.com        -> "v=spf1 ip4:your-server-ip ~all"
TXT   _dmarc.yourdomain.com -> "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

### 2. PowerMTA DKIM Setup

```bash
# Generate DKIM keys (if using PowerMTA)
pmta-keygen yourdomain.com /etc/pmta/dkim/yourdomain.com.pem

# Add DKIM DNS record (output from above command)
TXT   default._domainkey.yourdomain.com -> "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"
```

### 3. Monitoring Setup

```bash
# Set up log rotation
logrotate -f /etc/logrotate.conf

# Configure system monitoring
systemctl enable emailpro
systemctl start emailpro
```

### 4. Backup Configuration

```bash
# Database backup script
pg_dump emailpro > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /var/www/emailpro
```

## Security Checklist

- [ ] Firewall configured (ufw or firewalld)
- [ ] SSL certificates installed
- [ ] Database passwords changed from defaults
- [ ] SSH key authentication enabled
- [ ] Regular security updates scheduled
- [ ] Log monitoring configured
- [ ] Backup system operational
- [ ] DKIM/SPF/DMARC records configured

## Troubleshooting

### Common Issues

1. **Port 25 blocked**: Contact your hosting provider
2. **Database connection failed**: Check credentials and service status
3. **PowerMTA not starting**: Verify license and configuration
4. **SSL certificate errors**: Check domain DNS and certificate validity

### Log Locations

```bash
# Application logs
journalctl -u emailpro -f

# PowerMTA logs
tail -f /var/log/pmta/acct.csv

# System logs
tail -f /var/log/messages

# Nginx logs
tail -f /var/log/nginx/error.log
```

## Support

For deployment assistance:
- Check the installation guides in this repository
- Review PowerMTA documentation
- Contact your hosting provider for network issues
- Submit GitHub issues for application bugs

Remember to always test your deployment in a staging environment before going live with production email campaigns.