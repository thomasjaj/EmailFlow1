#!/bin/bash

# EmailPro Setup Script
# This script helps set up EmailPro on a fresh Ubuntu server

set -e

echo "🚀 EmailPro Setup Script"
echo "========================"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
fi

# Install PM2
echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Create database
echo "🗄️  Setting up database..."
read -p "Enter database name (default: emailpro): " DB_NAME
DB_NAME=${DB_NAME:-emailpro}

read -p "Enter database user (default: emailpro): " DB_USER
DB_USER=${DB_USER:-emailpro}

read -sp "Enter database password: " DB_PASSWORD
echo

# Create PostgreSQL user and database
sudo -u postgres psql << EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

echo "✅ Database created successfully!"

# Clone repository (if not already cloned)
if [ ! -f "package.json" ]; then
    echo "📥 Cloning EmailPro repository..."
    read -p "Enter GitHub repository URL: " REPO_URL
    git clone $REPO_URL .
fi

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Create environment file
echo "⚙️  Setting up environment configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    
    # Update database URL
    DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" .env
    
    # Generate session secret
    SESSION_SECRET=$(openssl rand -base64 32)
    sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" .env
    
    echo "📝 Please edit .env file to configure your settings:"
    echo "   - ADMIN_EMAIL"
    echo "   - SMTP settings"
    echo "   - PowerMTA settings (if using)"
fi

# Build application
echo "🔨 Building application..."
npm run build

# Set up PM2
echo "⚙️  Setting up PM2 process manager..."
pm2 start npm --name "emailpro" -- start
pm2 startup
pm2 save

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 3000/tcp
sudo ufw allow from 192.168.0.0/16 to any port 3000
sudo ufw --force enable

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "🎉 EmailPro setup completed successfully!"
echo "========================================="
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Set up your domains and DNS records"
echo "3. Configure PowerMTA (if using for high volume)"
echo "4. Access EmailPro at: http://$SERVER_IP:3000"
echo ""
echo "📚 Documentation:"
echo "   - Main README: README.md"
echo "   - PowerMTA Integration: POWERMTA_INTEGRATION.md"
echo "   - API Documentation: docs/API.md"
echo ""
echo "🆘 Need help? Check the documentation or create an issue on GitHub"
echo ""
echo "Happy emailing! 📧"