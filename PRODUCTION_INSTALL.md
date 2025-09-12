# EmailPro Production Installation Guide

This guide will help you install EmailPro on your own server for production use.

## System Requirements

### Recommended OS
- **Ubuntu 24.04 LTS** (Recommended)
- **Ubuntu 22.04 LTS** (Also supported)
- **CentOS 8/9** or **RHEL 8/9** (Alternative)

### Hardware Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum, SSD recommended
- **Network**: Stable internet connection

## Quick Installation (Ubuntu 24.04)

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v20.x.x
```

### 3. Install PostgreSQL 15
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Setup Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user (in PostgreSQL shell)
CREATE DATABASE emailpro;
CREATE USER emailpro WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE emailpro TO emailpro;
\q
```

### 5. Install EmailPro
```bash
# Create application directory
sudo mkdir -p /opt/emailpro
sudo chown $USER:$USER /opt/emailpro
cd /opt/emailpro

# Download and extract EmailPro
# (Replace with your actual download method)
wget https://your-server.com/emailpro-latest.tar.gz
tar -xzf emailpro-latest.tar.gz
cd emailpro

# Install dependencies
npm install
```

### 6. Configure Environment
```bash
# Create environment file
cp .env.example .env

# Edit the environment file
nano .env
```

Update `.env` with your settings:
```env
DATABASE_URL=postgresql://emailpro:your_secure_password@localhost:5432/emailpro
NODE_ENV=production
PORT=5000
```

### 7. Setup Database Schema
```bash
# Run database migrations
npm run db:push
```

### 8. Build Application
```bash
npm run build
```

### 9. Start Application
```bash
# Test run
npm start

# For production with PM2 (recommended)
npm install -g pm2
pm2 start npm --name "emailpro" -- start
pm2 save
pm2 startup
```

### 10. Setup Nginx (Optional but Recommended)
```bash
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/emailpro
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/emailpro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Alternative Installation (CentOS/RHEL)

### 1. Install Node.js 20
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### 2. Install PostgreSQL 15
```bash
sudo dnf install -y postgresql postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Configure PostgreSQL
```bash
# Edit pg_hba.conf for local connections
sudo nano /var/lib/pgsql/data/pg_hba.conf

# Change the following line:
# local   all             all                                     peer
# to:
# local   all             all                                     md5

sudo systemctl restart postgresql
```

Then follow steps 4-10 from Ubuntu installation.

## Security Setup

### 1. Firewall Configuration
```bash
# Ubuntu (UFW)
sudo ufw allow 22          # SSH
sudo ufw allow 80          # HTTP
sudo ufw allow 443         # HTTPS
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. SSL Certificate (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Environment Variables Reference

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/emailpro

# Application
NODE_ENV=production
PORT=5000

# Authentication (if using external auth)
# REPLIT_AUTH_CLIENT_ID=your_client_id
# REPLIT_AUTH_CLIENT_SECRET=your_client_secret

# Email Configuration (optional)
# SMTP_HOST=your-smtp-server.com
# SMTP_PORT=587
# SMTP_USER=your-email@domain.com
# SMTP_PASS=your-password
```

## Maintenance Commands

```bash
# View application logs
pm2 logs emailpro

# Restart application
pm2 restart emailpro

# Update application
cd /opt/emailpro
git pull origin main  # or download new version
npm install
npm run build
pm2 restart emailpro

# Database backup
pg_dump -U emailpro -h localhost emailpro > backup_$(date +%Y%m%d_%H%M%S).sql

# Database restore
psql -U emailpro -h localhost emailpro < backup_file.sql
```

## Troubleshooting

### Common Issues

1. **Port 5000 already in use**
   ```bash
   sudo lsof -i :5000
   # Kill the process or change PORT in .env
   ```

2. **Database connection failed**
   ```bash
   # Test database connection
   psql -U emailpro -h localhost -d emailpro
   ```

3. **Permission denied**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER /opt/emailpro
   chmod +x /opt/emailpro/server/index.js
   ```

4. **Node.js version issues**
   ```bash
   # Check Node.js version
   node --version
   # Should be v20.x.x or higher
   ```

## Performance Optimization

### 1. PM2 Cluster Mode
```bash
pm2 start npm --name "emailpro" -i max -- start
```

### 2. Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_smtp_servers_user_id ON smtp_servers(user_id);
```

### 3. Nginx Caching
Add to your Nginx configuration:
```nginx
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Support

For issues with this installation:
1. Check the application logs: `pm2 logs emailpro`
2. Verify database connectivity
3. Ensure all environment variables are set correctly
4. Check firewall and network settings

Your EmailPro installation should now be running at `http://your-domain.com`!