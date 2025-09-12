# EmailPro Installation Guide for CentOS 10

This guide will walk you through installing the complete EmailPro email marketing platform on your CentOS 10 system.

## System Requirements

- CentOS 10 (freshly installed)
- Minimum 2GB RAM (4GB recommended)
- 20GB available disk space
- Internet connection
- Root access

## Step 1: Update System and Install Dependencies

```bash
# Update system packages
sudo dnf update -y

# Install development tools
sudo dnf groupinstall "Development Tools" -y

# Install required packages
sudo dnf install -y curl wget git nano vim nginx postgresql postgresql-server postgresql-contrib
```

## Step 2: Install Node.js 20

```bash
# Add NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# Install Node.js
sudo dnf install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 3: Setup PostgreSQL Database

### Install PostgreSQL

```bash
# Install PostgreSQL packages
sudo yum install -y postgresql postgresql-server postgresql-contrib

# Initialize PostgreSQL database (CentOS 7)
sudo postgresql-setup initdb

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Create Database and User

```bash
# Switch to postgres user and create database
sudo -u postgres psql -c "CREATE DATABASE emailpro;"
sudo -u postgres psql -c "CREATE USER emailpro WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE emailpro TO emailpro;"

# Exit PostgreSQL
sudo -u postgres psql -c "\q"
```

### Configure PostgreSQL Authentication

```bash
# Configure PostgreSQL for password authentication
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /var/lib/pgsql/data/postgresql.conf

# Configure authentication method
sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" /var/lib/pgsql/data/pg_hba.conf
sudo sed -i "s/host    all             all             127.0.0.1\/32            ident/host    all             all             127.0.0.1\/32            md5/" /var/lib/pgsql/data/pg_hba.conf

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql
```

### Test Database Connection

```bash
# Test connection with the new user
psql -h localhost -U emailpro -d emailpro
# Enter password when prompted: your_secure_password
# Type \q to exit
```

## Step 4: Clone and Setup EmailPro Application

```bash
# Create application directory
sudo mkdir -p /var/www/emailpro
cd /var/www/emailpro

# Download the application files (you'll need to upload your files here)
# For now, create the basic structure:
sudo mkdir -p server client shared
sudo chown -R $USER:$USER /var/www/emailpro

# Set up environment variables
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://emailpro:your_secure_password@localhost:5432/emailpro
SESSION_SECRET=$(openssl rand -base64 32)
REPLIT_DOMAINS=your-domain.com
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id
EOF
```

## Step 5: Upload Your Application Files

You need to transfer your application files to the server. You can do this via:

### Option A: Using SCP (from your development machine)
```bash
# From your development machine, upload the files:
scp -r /path/to/your/emailpro/* user@your-centos-server:/var/www/emailpro/
```

### Option B: Using Git (if you have a repository)
```bash
cd /var/www/emailpro
git clone https://github.com/your-username/emailpro.git .
```

### Option C: Manual file transfer
Create the following key files manually:

**package.json** (in /var/www/emailpro):
```json
{
  "name": "emailpro",
  "version": "1.0.0",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build client",
    "build:server": "esbuild server/index.ts --bundle --platform=node --outfile=dist/server.js --external:pg-native",
    "start": "node dist/server.js",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "express": "^4.18.0",
    "drizzle-orm": "^0.29.0",
    "@neondatabase/serverless": "^0.9.0",
    "express-session": "^1.17.3",
    "connect-pg-simple": "^9.0.1",
    "passport": "^0.7.0",
    "openid-client": "^5.6.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "vite": "^5.0.0",
    "drizzle-kit": "^0.20.0",
    "esbuild": "^0.19.0"
  }
}
```

## Step 6: Install Application Dependencies

```bash
cd /var/www/emailpro

# Install dependencies
npm install

# Build the application
npm run build

# Set up database schema
npm run db:push
```

## Step 7: Create Systemd Service

```bash
# Create service file
sudo tee /etc/systemd/system/emailpro.service > /dev/null << EOF
[Unit]
Description=EmailPro Email Marketing Platform
After=network.target postgresql.service

[Service]
Type=simple
User=nobody
WorkingDirectory=/var/www/emailpro
Environment=NODE_ENV=production
EnvironmentFile=/var/www/emailpro/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable emailpro
sudo systemctl start emailpro

# Check service status
sudo systemctl status emailpro
```

## Step 8: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo tee /etc/nginx/conf.d/emailpro.conf > /dev/null << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Test Nginx configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 9: Configure Firewall

```bash
# Configure firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## Step 10: SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo systemctl enable --now certbot-renew.timer
```

## Step 11: Final Verification

```bash
# Check all services are running
sudo systemctl status emailpro
sudo systemctl status nginx
sudo systemctl status postgresql

# Check application logs
sudo journalctl -u emailpro -f

# Test database connection
sudo -u postgres psql -d emailpro -c "SELECT version();"
```

## Step 12: Access Your Application

1. Open your browser and go to: `http://your-server-ip` or `http://your-domain.com`
2. You should see the EmailPro login page
3. Click "Login" to authenticate via Replit

## Troubleshooting

### Check Application Logs
```bash
sudo journalctl -u emailpro -f
```

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check PostgreSQL Connection
```bash
sudo -u postgres psql -d emailpro
```

### Restart Services
```bash
sudo systemctl restart emailpro
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

## Security Recommendations

1. **Change default passwords**: Update all default passwords
2. **Enable firewall**: Keep firewall active and properly configured
3. **Regular updates**: Keep system and packages updated
4. **SSL certificate**: Always use HTTPS in production
5. **Backup database**: Set up regular database backups
6. **Monitor logs**: Regularly check application and system logs

## Backup and Maintenance

### Database Backup
```bash
# Create backup script
sudo tee /usr/local/bin/backup-emailpro.sh > /dev/null << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/emailpro"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump emailpro > "$BACKUP_DIR/emailpro_$DATE.sql"
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

sudo chmod +x /usr/local/bin/backup-emailpro.sh

# Add to crontab (daily backup at 2 AM)
echo "0 2 * * * /usr/local/bin/backup-emailpro.sh" | sudo crontab -
```

Your EmailPro installation is now complete! The platform should be accessible via your domain/IP address.