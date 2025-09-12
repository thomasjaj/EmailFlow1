#!/bin/bash

# EmailPro Production Deployment Script
# Run this script on your server to install EmailPro

set -e

echo "🚀 EmailPro Production Deployment Script"
echo "======================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ Don't run this script as root. Run as a regular user with sudo privileges."
   exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
fi

echo "📋 Detected OS: $OS $VERSION"

# Install Node.js 20
echo "📦 Installing Node.js 20..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "✅ Node.js installed: $NODE_VERSION"

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
    sudo dnf install -y postgresql postgresql-server postgresql-contrib
    sudo postgresql-setup --initdb
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

echo "✅ PostgreSQL installed and started"

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/emailpro
sudo chown $USER:$USER /opt/emailpro

# Extract application files (assuming they're in the same directory)
echo "📦 Extracting EmailPro files..."
if [ -f "emailpro-deployment.tar.gz" ]; then
    tar -xzf emailpro-deployment.tar.gz -C /opt/emailpro
    cd /opt/emailpro
else
    echo "❌ emailpro-deployment.tar.gz not found in current directory"
    echo "Please download the deployment package first"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup database
echo "🗄️  Setting up database..."
DB_PASSWORD=$(openssl rand -base64 32)
echo "Generated database password: $DB_PASSWORD"

sudo -u postgres psql <<EOF
CREATE DATABASE emailpro;
CREATE USER emailpro WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE emailpro TO emailpro;
\q
EOF

# Create environment file
echo "⚙️  Creating environment configuration..."
cat > .env <<EOF
DATABASE_URL=postgresql://emailpro:$DB_PASSWORD@localhost:5432/emailpro
NODE_ENV=production
PORT=5000
EOF

# Build application
echo "🔨 Building application..."
npm run build

# Install PM2 globally
echo "📦 Installing PM2 process manager..."
sudo npm install -g pm2

# Start application with PM2
echo "🚀 Starting EmailPro..."
pm2 start npm --name "emailpro" -- start
pm2 save
pm2 startup

echo ""
echo "🎉 EmailPro installation completed successfully!"
echo ""
echo "📋 Important Information:"
echo "========================"
echo "Database Password: $DB_PASSWORD"
echo "Application URL: http://$(hostname -I | awk '{print $1}'):5000"
echo ""
echo "📝 Useful Commands:"
echo "==================="
echo "View logs:     pm2 logs emailpro"
echo "Restart app:   pm2 restart emailpro"
echo "Stop app:      pm2 stop emailpro"
echo "App status:    pm2 status"
echo ""
echo "🔒 Security Recommendations:"
echo "============================"
echo "1. Setup firewall (ufw enable)"
echo "2. Install SSL certificate"
echo "3. Configure Nginx reverse proxy"
echo "4. Change default database password"
echo ""
echo "📖 For detailed setup instructions, see PRODUCTION_INSTALL.md"
echo ""

# Save important info to file
cat > /opt/emailpro/DEPLOYMENT_INFO.txt <<EOF
EmailPro Deployment Information
==============================

Installation Date: $(date)
Database Password: $DB_PASSWORD
Application URL: http://$(hostname -I | awk '{print $1}'):5000

Useful Commands:
- View logs: pm2 logs emailpro
- Restart: pm2 restart emailpro  
- Stop: pm2 stop emailpro
- Status: pm2 status

Next Steps:
1. Setup firewall and SSL
2. Configure domain name
3. Setup email SMTP servers in the application
4. Create your first email campaign

For support, refer to PRODUCTION_INSTALL.md
EOF

echo "💾 Deployment information saved to /opt/emailpro/DEPLOYMENT_INFO.txt"