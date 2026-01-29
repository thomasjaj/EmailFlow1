#!/bin/bash

##############################################################################
# EmailPro - Automated Installation Script for CentOS 10 Minimal
# This script installs all dependencies and sets up EmailPro from scratch
##############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root (use sudo)"
    exit 1
fi

log_info "Starting EmailPro installation for CentOS 10..."

# Get configuration from user
read -p "Enter the domain/IP for this installation [localhost]: " DOMAIN
DOMAIN=${DOMAIN:-localhost}

read -p "Enter the port to run EmailPro on [5000]: " PORT
PORT=${PORT:-5000}

read -p "Enter PostgreSQL database name [emailpro]: " DB_NAME
DB_NAME=${DB_NAME:-emailpro}

read -p "Enter PostgreSQL user [emailpro]: " DB_USER
DB_USER=${DB_USER:-emailpro}

read -sp "Enter PostgreSQL password: " DB_PASS
echo
if [ -z "$DB_PASS" ]; then
    DB_PASS=$(openssl rand -base64 24)
    log_warning "Generated random password: $DB_PASS"
fi

read -p "Enter session secret (leave empty to generate): " SESSION_SECRET
if [ -z "$SESSION_SECRET" ]; then
    SESSION_SECRET=$(openssl rand -base64 48)
    log_info "Generated session secret"
fi

log_info "Configuration saved. Starting installation..."

##############################################################################
# Step 1: Update System
##############################################################################
log_info "Updating system packages..."
dnf update -y
dnf install -y curl wget git openssl

##############################################################################
# Step 2: Install Node.js 20.x
##############################################################################
log_info "Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf install -y nodejs
fi

NODE_VERSION=$(node --version)
log_success "Node.js installed: $NODE_VERSION"
NPM_VERSION=$(npm --version)
log_success "npm installed: $NPM_VERSION"

##############################################################################
# Step 3: Install PostgreSQL 15
##############################################################################
log_info "Installing PostgreSQL 15..."
if ! command -v psql &> /dev/null; then
    dnf install -y postgresql-server postgresql-contrib
    postgresql-setup --initdb
    systemctl enable postgresql
    systemctl start postgresql
fi

log_success "PostgreSQL installed"

##############################################################################
# Step 4: Configure PostgreSQL
##############################################################################
log_info "Configuring PostgreSQL..."

# Update pg_hba.conf for local connections
PG_HBA_CONF="/var/lib/pgsql/data/pg_hba.conf"
if [ -f "$PG_HBA_CONF" ]; then
    cp "$PG_HBA_CONF" "${PG_HBA_CONF}.backup"
    # Change peer to md5 for local connections
    sed -i 's/^\(local.*all.*all.*\)peer/\1md5/' "$PG_HBA_CONF"
    sed -i 's/^\(host.*all.*all.*127.0.0.1\/32.*\)ident/\1md5/' "$PG_HBA_CONF"
    sed -i 's/^\(host.*all.*all.*::1\/128.*\)ident/\1md5/' "$PG_HBA_CONF"
fi

systemctl restart postgresql

# Create database and user
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

log_success "PostgreSQL database created: $DB_NAME"

##############################################################################
# Step 5: Install EmailPro
##############################################################################
log_info "Cloning EmailPro repository..."

INSTALL_DIR="/var/www/emailpro"
if [ -d "$INSTALL_DIR" ]; then
    log_warning "Directory $INSTALL_DIR exists. Backing up to ${INSTALL_DIR}.backup"
    mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
fi

mkdir -p /var/www
cd /var/www
git clone https://github.com/thomasjaj/EmailFlow1.git emailpro
cd emailpro

log_success "Repository cloned to $INSTALL_DIR"

##############################################################################
# Step 6: Install Dependencies
##############################################################################
log_info "Installing dependencies..."
npm install

log_success "Dependencies installed"

##############################################################################
# Step 7: Create Environment Configuration
##############################################################################
log_info "Creating environment configuration..."

cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME

# Server Configuration
PORT=$PORT
NODE_ENV=production

# Session Configuration
SESSION_SECRET=$SESSION_SECRET

# Application URLs
VITE_API_URL=http://$DOMAIN:$PORT
REPLIT_DOMAINS=$DOMAIN
EOF

log_success "Environment file created"

##############################################################################
# Step 8: Initialize Database Schema
##############################################################################
log_info "Initializing database schema..."

# Run database migration
npm run db:push

log_success "Database schema initialized"

##############################################################################
# Step 9: Build Application
##############################################################################
log_info "Building application..."
npm run build

log_success "Application built successfully"

##############################################################################
# Step 10: Create Systemd Service
##############################################################################
log_info "Creating systemd service..."

cat > /etc/systemd/system/emailpro.service << EOF
[Unit]
Description=EmailPro Email Marketing Platform
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=emailpro

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable emailpro
systemctl start emailpro

log_success "Systemd service created and started"

##############################################################################
# Step 11: Configure Firewall
##############################################################################
log_info "Configuring firewall..."

if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=$PORT/tcp
    firewall-cmd --reload
    log_success "Firewall configured to allow port $PORT"
else
    log_warning "firewalld not found. Please manually configure your firewall to allow port $PORT"
fi

##############################################################################
# Step 12: Verify Installation
##############################################################################
log_info "Verifying installation..."

sleep 5

if systemctl is-active --quiet emailpro; then
    log_success "EmailPro service is running"
else
    log_error "EmailPro service failed to start. Check logs with: journalctl -u emailpro -n 50"
    exit 1
fi

# Test HTTP endpoint
if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200\|302"; then
    log_success "EmailPro is responding to HTTP requests"
else
    log_warning "EmailPro may not be responding yet. Check logs with: journalctl -u emailpro -n 50"
fi

##############################################################################
# Installation Complete
##############################################################################
echo ""
echo "=========================================================================="
log_success "EmailPro Installation Complete!"
echo "=========================================================================="
echo ""
echo "Configuration Details:"
echo "  - Application Directory: $INSTALL_DIR"
echo "  - Database: $DB_NAME"
echo "  - Database User: $DB_USER"
echo "  - Port: $PORT"
echo "  - Access URL: http://$DOMAIN:$PORT"
echo ""
echo "Useful Commands:"
echo "  - View logs: journalctl -u emailpro -f"
echo "  - Restart service: systemctl restart emailpro"
echo "  - Stop service: systemctl stop emailpro"
echo "  - Check status: systemctl status emailpro"
echo ""
echo "Database Credentials:"
echo "  - Database: $DB_NAME"
echo "  - Username: $DB_USER"
echo "  - Password: $DB_PASS"
echo ""
log_warning "IMPORTANT: Save these credentials securely!"
echo ""
echo "=========================================================================="
