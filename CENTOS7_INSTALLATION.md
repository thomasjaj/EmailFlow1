# EmailPro Installation Guide for CentOS 7

This guide is specifically for CentOS 7 systems. Your PostgreSQL database is already set up successfully.

## Current Status: ✅ Database Ready

Your database setup is complete:
- Database: `emailpro` 
- User: `emailpro`
- Password: `19940804.Muhamed`

## Next Steps for EmailPro Installation

### Step 1: Test Database Connection

```bash
# Test the database connection
psql -h localhost -U emailpro -d emailpro
# Enter password: 19940804.Muhamed
# Type \q to exit when connected successfully
```

### Step 2: Create Application Directory

```bash
# Create EmailPro directory
sudo mkdir -p /var/www/emailpro
sudo chown -R centos:centos /var/www/emailpro
sudo chmod 755 /var/www/emailpro
```

### Step 3: Transfer Your EmailPro Files

Using WinSCP, transfer all your EmailPro files to `/var/www/emailpro/`

The directory structure should look like:
```
/var/www/emailpro/
├── client/
├── server/
├── shared/
├── package.json
├── README.md
├── CENTOS_INSTALLATION.md
├── POWERMTA_INTEGRATION.md
└── other files...
```

### Step 4: Install Dependencies

```bash
cd /var/www/emailpro

# Install Node.js dependencies
npm install
```

### Step 5: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

Update the `.env` file with your database credentials:

```bash
# Database Configuration
DATABASE_URL=postgresql://emailpro:19940804.Muhamed@localhost:5432/emailpro
PGHOST=localhost
PGPORT=5432
PGUSER=emailpro
PGPASSWORD=19940804.Muhamed
PGDATABASE=emailpro

# Session Secret (change this to a random string)
SESSION_SECRET=your-super-secret-session-key-change-this

# Application Settings
NODE_ENV=production
PORT=5000

# Email Configuration (for PowerMTA integration later)
SMTP_HOST=localhost
SMTP_PORT=25
```

### Step 6: Set Up Database Schema

```bash
cd /var/www/emailpro

# Create database tables
npm run db:push
```

### Step 7: Build Application

```bash
# Build the frontend
npm run build
```

### Step 8: Create System Service

```bash
# Create emailpro user for service
sudo useradd -r -s /bin/false emailpro

# Create systemd service file
sudo nano /etc/systemd/system/emailpro.service
```

Add this content to the service file:

```ini
[Unit]
Description=EmailPro Email Marketing Platform
After=network.target postgresql.service

[Service]
Type=simple
User=emailpro
Group=emailpro
WorkingDirectory=/var/www/emailpro
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/emailpro

[Install]
WantedBy=multi-user.target
```

### Step 9: Set Permissions and Start Service

```bash
# Set proper ownership
sudo chown -R emailpro:emailpro /var/www/emailpro

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable emailpro
sudo systemctl start emailpro

# Check service status
sudo systemctl status emailpro
```

### Step 10: Configure Nginx Web Server

```bash
# Create Nginx configuration
sudo nano /etc/nginx/conf.d/emailpro.conf
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Main application proxy
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files optimization
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 11: Start Nginx and Configure Firewall

```bash
# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=25/tcp  # SMTP
sudo firewall-cmd --permanent --add-port=587/tcp # SMTP submission
sudo firewall-cmd --reload

# Check firewall status
sudo firewall-cmd --list-all
```

### Step 12: Verify Installation

```bash
# Check all services are running
sudo systemctl status postgresql
sudo systemctl status emailpro
sudo systemctl status nginx

# Check if EmailPro is listening on port 5000
sudo netstat -tlnp | grep 5000

# Check application logs
sudo journalctl -u emailpro -f
```

### Step 13: Access Your Application

- **Local access**: `http://your-server-ip`
- **Domain access**: `http://your-domain.com` (after DNS configuration)

## Troubleshooting Commands

```bash
# View EmailPro logs
sudo journalctl -u emailpro -f

# Check database connection
psql -h localhost -U emailpro -d emailpro

# Restart services
sudo systemctl restart emailpro
sudo systemctl restart nginx

# Check port usage
sudo netstat -tlnp | grep -E "(5000|80|443)"
```

## Security Recommendations

1. **Change default passwords** in your `.env` file
2. **Set up SSL certificates** using Let's Encrypt
3. **Configure fail2ban** for SSH protection
4. **Regular system updates**: `sudo yum update`
5. **Backup database regularly**: `pg_dump emailpro > backup.sql`

## PowerMTA Integration (Optional)

After basic installation is complete, follow the PowerMTA integration guide in `POWERMTA_INTEGRATION.md` for enterprise email delivery capabilities.

Your EmailPro platform will then be ready for professional email marketing campaigns with high-volume sending capabilities.