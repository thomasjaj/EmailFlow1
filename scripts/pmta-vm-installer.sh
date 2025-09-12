#!/bin/bash
#########################################################################
# PowerMTA VirtualBox VM Auto-Installer
# Complete setup script for PowerMTA with IP provider relay
#########################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

#########################################################################
# Configuration Section - USER INPUT REQUIRED
#########################################################################

echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                 PowerMTA VM Auto-Installer                      ║
║              For EmailPro Integration with IP Relay             ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

# Collect configuration
echo -e "${YELLOW}Please provide the following information:${NC}"
echo

read -p "Your domain name (e.g., yourdomain.com): " DOMAIN
read -p "Your EmailPro server IP (default: 192.168.100.170): " EMAILPRO_IP
EMAILPRO_IP=${EMAILPRO_IP:-192.168.100.170}

read -p "This VM's IP address (default: 192.168.1.100): " VM_IP
VM_IP=${VM_IP:-192.168.1.100}

read -p "Your admin IP for web access: " ADMIN_IP

echo
echo "Choose SMTP Provider:"
echo "1) MailChannels"
echo "2) Amazon SES"
echo "3) SendGrid"
echo "4) Mailgun"
echo "5) Custom provider"
read -p "Enter choice (1-5): " PROVIDER_CHOICE

case $PROVIDER_CHOICE in
    1)
        SMTP_HOST="smtp.mailchannels.net"
        SMTP_PORT="587"
        echo "MailChannels selected"
        ;;
    2)
        read -p "AWS region (e.g., us-east-1): " AWS_REGION
        SMTP_HOST="email-smtp.${AWS_REGION}.amazonaws.com"
        SMTP_PORT="587"
        ;;
    3)
        SMTP_HOST="smtp.sendgrid.net"
        SMTP_PORT="587"
        ;;
    4)
        SMTP_HOST="smtp.mailgun.org"
        SMTP_PORT="587"
        ;;
    5)
        read -p "Custom SMTP host: " SMTP_HOST
        read -p "Custom SMTP port (default: 587): " SMTP_PORT
        SMTP_PORT=${SMTP_PORT:-587}
        ;;
    *)
        error "Invalid choice"
        ;;
esac

read -p "SMTP Username: " SMTP_USER
read -s -p "SMTP Password: " SMTP_PASS
echo

# Confirm configuration
echo
echo -e "${BLUE}Configuration Summary:${NC}"
echo "Domain: $DOMAIN"
echo "EmailPro IP: $EMAILPRO_IP"
echo "VM IP: $VM_IP"
echo "Admin IP: $ADMIN_IP"
echo "SMTP Host: $SMTP_HOST:$SMTP_PORT"
echo "SMTP User: $SMTP_USER"
echo
read -p "Continue with installation? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    error "Installation cancelled"
fi

#########################################################################
# System Preparation
#########################################################################

log "Starting PowerMTA installation on VirtualBox VM..."

# Detect OS
if [ -f /etc/redhat-release ]; then
    OS="centos"
    PKG_MANAGER="yum"
elif [ -f /etc/debian_version ]; then
    OS="ubuntu"
    PKG_MANAGER="apt"
else
    error "Unsupported operating system"
fi

log "Detected OS: $OS"

# Update system
log "Updating system packages..."
if [[ $OS == "centos" ]]; then
    $PKG_MANAGER update -y
    $PKG_MANAGER install -y httpd perl nmap telnet wget curl vim net-tools bind-utils
    systemctl enable httpd
    systemctl start httpd
    
    # Configure firewall
    systemctl enable firewalld
    systemctl start firewalld
    firewall-cmd --permanent --add-port=25/tcp
    firewall-cmd --permanent --add-port=587/tcp
    firewall-cmd --permanent --add-port=8081/tcp
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --reload
    
else
    $PKG_MANAGER update -y
    $PKG_MANAGER upgrade -y
    $PKG_MANAGER install -y apache2 perl nmap telnet wget curl vim net-tools dnsutils
    systemctl enable apache2
    systemctl start apache2
    
    # Configure firewall
    ufw --force enable
    ufw allow 25/tcp
    ufw allow 587/tcp
    ufw allow 8081/tcp
    ufw allow 80/tcp
    ufw allow ssh
fi

#########################################################################
# PowerMTA Installation
#########################################################################

log "Checking for PowerMTA files in current directory..."

# Check for required files
PMTA_RPM=""
LICENSE_FILE=""
CONFIG_FILE=""

for file in *.rpm; do
    if [[ $file == *"PowerMTA"* ]] || [[ $file == *"pmta"* ]]; then
        PMTA_RPM="$file"
        break
    fi
done

for file in license License LICENSE; do
    if [[ -f "$file" ]]; then
        LICENSE_FILE="$file"
        break
    fi
done

for file in config config_pmta; do
    if [[ -f "$file" ]]; then
        CONFIG_FILE="$file"
        break
    fi
done

if [[ -z "$PMTA_RPM" ]]; then
    error "PowerMTA RPM file not found. Please place it in the current directory."
fi

if [[ -z "$LICENSE_FILE" ]]; then
    error "PowerMTA license file not found. Please place it in the current directory."
fi

log "Found PowerMTA files:"
log "  RPM: $PMTA_RPM"
log "  License: $LICENSE_FILE"
[[ -n "$CONFIG_FILE" ]] && log "  Config: $CONFIG_FILE"

# Install PowerMTA
log "Installing PowerMTA..."
if [[ $OS == "centos" ]]; then
    rpm -ivh "$PMTA_RPM"
else
    # Convert RPM to DEB for Ubuntu
    apt install -y alien
    alien -d "$PMTA_RPM"
    DEB_FILE=$(ls powermta*.deb | head -1)
    dpkg -i "$DEB_FILE"
    apt-get install -f -y
fi

# Install license
log "Installing PowerMTA license..."
cp "$LICENSE_FILE" /etc/pmta/license
chown pmta:pmta /etc/pmta/license
chmod 640 /etc/pmta/license

#########################################################################
# Directory Setup
#########################################################################

log "Creating PowerMTA directories and setting permissions..."

# Create all required directories
mkdir -p /var/spool/pmta
mkdir -p /var/spool/pmtaPickup/Pickup
mkdir -p /var/spool/pmtaPickup/BadMail
mkdir -p /var/spool/pmtaIncoming
mkdir -p /var/log/pmta
mkdir -p /var/log/pmtaAccRep
mkdir -p /var/log/pmtaErr
mkdir -p /var/log/pmtaErrRep
mkdir -p /etc/pmta/dkim

# Set ownership and permissions
chown -R pmta:pmta /var/spool/pmta*
chown -R pmta:pmta /var/log/pmta*
chown -R pmta:pmta /etc/pmta

chmod 755 /var/spool/pmta*
chmod 755 /var/log/pmta*
chmod 750 /etc/pmta

#########################################################################
# PowerMTA Configuration
#########################################################################

log "Creating PowerMTA configuration for EmailPro integration..."

cat > /etc/pmta/config << EOF
#########################################################################
# PowerMTA Configuration for EmailPro Integration
# Generated by auto-installer on $(date)
# Domain: $DOMAIN
#########################################################################

#########################Global configuration#####################
Pickup /var/spool/pmtaPickup/Pickup /var/spool/pmtaPickup/BadMail

postmaster postmaster@$DOMAIN

log-file /var/log/pmta/log
log-file-world-readable false

spool /var/spool/pmta

# Accounting file
<acct-file /var/log/pmta/acct>
    move-to /var/log/pmtaAccRep/
    move-interval 1d
    records d,b
    world-readable yes
    record-fields d timeLogged,timeQueued,timeImprinted,orig,dsnAction,dsnStatus,dsnDiag,dsnMta,bounceCat,srcType,srcMta,dlvType,dlvSourceIp,dlvDestinationIp,dlvEsmtpAvailable,dlvSize,vmta,jobId
    record-fields b timeLogged,timeQueued,timeImprinted,orig,rcpt,orcpt,dsnAction,dsnStatus,dsnDiag,dsnMta,bounceCat,srcType,srcMta,dlvType,dlvSourceIp,dlvDestinationIp,dlvEsmtpAvailable,dlvSize,vmta,jobId
</acct-file>

# HTTP management interface
http-mgmt-port 8081
http-access $ADMIN_IP admin
http-access $EMAILPRO_IP admin
http-access 127.0.0.1 admin

# Relay domain
relay-domain $DOMAIN

# SMTP listeners (local only)
smtp-listener 0.0.0.0:25
smtp-listener 0.0.0.0:587

###################Sources configuration#####################

# EmailPro source (allow relay from EmailPro server)
<source $EMAILPRO_IP>
   always-allow-relaying yes
   smtp-service yes
   process-x-envid true
   process-x-job true
   process-x-virtual-mta true
   add-received-header no
   hide-message-source true
   log-connections yes
   log-data no
   log-commands no
</source>

# Local network source
<source 192.168.0.0/16>
   always-allow-relaying yes
   smtp-service yes
   process-x-virtual-mta true
   log-connections yes
   log-data no
   log-commands no
</source>

# Default source (deny relay)
<source 0/0>
   always-allow-relaying no
   smtp-service yes
   log-connections yes
   log-data no
   log-commands no
</source>

###################Virtual MTAs configuration#####################

# EmailPro campaigns MTA
<virtual-mta emailpro-campaigns>
    # Relay through provider - no source IP needed
</virtual-mta>

# EmailPro transactional MTA
<virtual-mta emailpro-transactional>
    # Relay through provider - no source IP needed
</virtual-mta>

###################Domain configuration with SMTP Relay#####################

# All domains relay through SMTP provider
<domain *>
    # SMTP Relay Configuration
    smtp-hosts $SMTP_HOST:$SMTP_PORT
    smtp-auth-username $SMTP_USER
    smtp-auth-password $SMTP_PASS
    require-tls yes
    
    # Delivery settings (conservative)
    retry-after 10m
    bounce-after 4d
    log-transfer-failures yes
    log-connections yes
    log-commands no
    log-data no
    max-smtp-out 5
    max-msg-per-connection 50
</domain>

# Gmail specific settings
<domain gmail.com>
    smtp-hosts $SMTP_HOST:$SMTP_PORT
    smtp-auth-username $SMTP_USER
    smtp-auth-password $SMTP_PASS
    require-tls yes
    retry-after 15m
    bounce-after 24h
    max-smtp-out 3
    max-msg-per-connection 25
</domain>

# Outlook/Hotmail specific settings
<domain outlook.com>
    smtp-hosts $SMTP_HOST:$SMTP_PORT
    smtp-auth-username $SMTP_USER
    smtp-auth-password $SMTP_PASS
    require-tls yes
    retry-after 15m
    bounce-after 24h
    max-smtp-out 3
    max-msg-per-connection 25
</domain>

<domain hotmail.com>
    smtp-hosts $SMTP_HOST:$SMTP_PORT
    smtp-auth-username $SMTP_USER
    smtp-auth-password $SMTP_PASS
    require-tls yes
    retry-after 15m
    bounce-after 24h
    max-smtp-out 3
    max-msg-per-connection 25
</domain>

# Yahoo specific settings
<domain yahoo.com>
    smtp-hosts $SMTP_HOST:$SMTP_PORT
    smtp-auth-username $SMTP_USER
    smtp-auth-password $SMTP_PASS
    require-tls yes
    retry-after 15m
    bounce-after 24h
    max-smtp-out 3
    max-msg-per-connection 25
</domain>

EOF

# Set config permissions
chown pmta:pmta /etc/pmta/config
chmod 640 /etc/pmta/config

#########################################################################
# DKIM Setup (Optional)
#########################################################################

log "Setting up DKIM keys for better deliverability..."

# Generate DKIM keys
openssl genrsa -out /etc/pmta/dkim/$DOMAIN.private 1024
openssl rsa -in /etc/pmta/dkim/$DOMAIN.private -pubout -out /etc/pmta/dkim/$DOMAIN.public

# Set DKIM permissions
chown pmta:pmta /etc/pmta/dkim/$DOMAIN.*
chmod 600 /etc/pmta/dkim/$DOMAIN.private
chmod 644 /etc/pmta/dkim/$DOMAIN.public

# Get public key for DNS
DKIM_PUBLIC=$(openssl rsa -in /etc/pmta/dkim/$DOMAIN.private -pubout -outform DER | openssl base64 -A)

#########################################################################
# Service Configuration
#########################################################################

log "Starting PowerMTA services..."

# Enable and start services
systemctl enable pmta
systemctl start pmta

if systemctl list-units --type=service | grep -q pmtahttp; then
    systemctl enable pmtahttp
    systemctl start pmtahttp
fi

# Wait for services to start
sleep 5

#########################################################################
# System Optimization
#########################################################################

log "Optimizing system for PowerMTA..."

# Set system limits
cat >> /etc/security/limits.conf << EOF
pmta soft nofile 65536
pmta hard nofile 65536
pmta soft nproc 32768
pmta hard nproc 32768
EOF

# Kernel parameters
cat >> /etc/sysctl.conf << EOF
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.ip_local_port_range = 1024 65535
EOF

sysctl -p

#########################################################################
# Create Management Scripts
#########################################################################

log "Creating PowerMTA management scripts..."

# Create status script
cat > /usr/local/bin/pmta-status << 'EOF'
#!/bin/bash
echo "PowerMTA Status:"
pmta show status
echo
echo "Queue Status:"
pmta show queues
echo
echo "Recent Log Entries:"
tail -n 20 /var/log/pmta/log
EOF

chmod +x /usr/local/bin/pmta-status

# Create test script
cat > /usr/local/bin/pmta-test << 'EOF'
#!/bin/bash
EMAIL=${1:-test@gmail.com}
echo "Testing PowerMTA delivery to $EMAIL..."
echo "This is a test email from PowerMTA on $(hostname) at $(date)" | mail -s "PowerMTA Test $(date)" "$EMAIL"
echo "Test email sent. Check 'pmta show queues' for delivery status."
EOF

chmod +x /usr/local/bin/pmta-test

#########################################################################
# Verification and Testing
#########################################################################

log "Verifying PowerMTA installation..."

# Check if PowerMTA is running
if ! systemctl is-active --quiet pmta; then
    error "PowerMTA service is not running"
fi

# Check if listening on ports
if ! netstat -tlnp | grep -q ":25.*pmta"; then
    error "PowerMTA is not listening on port 25"
fi

# Test configuration
if ! pmta config test; then
    error "PowerMTA configuration test failed"
fi

# Test SMTP provider connectivity
log "Testing SMTP provider connectivity..."
if ! timeout 10 bash -c "</dev/tcp/$SMTP_HOST/$SMTP_PORT"; then
    warning "Cannot connect to SMTP provider $SMTP_HOST:$SMTP_PORT"
    warning "Please check your network connectivity and provider settings"
fi

#########################################################################
# Final Output and Instructions
#########################################################################

clear
echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                 PowerMTA Installation Complete!                 ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log "PowerMTA has been successfully installed and configured!"
echo
echo -e "${BLUE}Configuration Summary:${NC}"
echo "• Domain: $DOMAIN"
echo "• VM IP: $VM_IP"
echo "• EmailPro Server: $EMAILPRO_IP"
echo "• SMTP Provider: $SMTP_HOST:$SMTP_PORT"
echo "• Web Interface: http://$VM_IP:8081"
echo
echo -e "${YELLOW}DNS Records to Add:${NC}"
echo "Add these records to your $DOMAIN DNS:"
echo
echo "A     mail.$DOMAIN.           $VM_IP"
echo "MX    $DOMAIN.                10 mail.$DOMAIN."
echo "TXT   $DOMAIN.                \"v=spf1 include:$SMTP_HOST ~all\""
echo "TXT   default._domainkey.$DOMAIN.  \"v=DKIM1; k=rsa; p=$DKIM_PUBLIC\""
echo "TXT   _dmarc.$DOMAIN.         \"v=DMARC1; p=quarantine; rua=mailto:dmarc@$DOMAIN\""
echo
echo -e "${YELLOW}EmailPro Configuration:${NC}"
echo "Add these to your EmailPro .env file:"
echo
echo "PMTA_ENABLED=true"
echo "PMTA_HOST=$VM_IP"
echo "PMTA_PORT=25"
echo "PMTA_SECURE=false"
echo "PMTA_WEB_MONITOR=http://$VM_IP:8081"
echo
echo -e "${YELLOW}Useful Commands:${NC}"
echo "• Check status: pmta-status"
echo "• Send test email: pmta-test your@email.com"
echo "• View queues: pmta show queues"
echo "• View logs: tail -f /var/log/pmta/log"
echo "• Web interface: http://$VM_IP:8081"
echo
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Add the DNS records shown above"
echo "2. Configure EmailPro with the settings above"
echo "3. Test email sending with: pmta-test your@email.com"
echo "4. Monitor delivery in web interface"
echo
log "Installation completed successfully!"