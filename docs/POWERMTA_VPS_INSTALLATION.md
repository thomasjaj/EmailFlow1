# PowerMTA Installation and Configuration Guide for VPS

This comprehensive guide covers PowerMTA installation and configuration on a VPS for high-volume email delivery with EmailPro integration.

## VPS Requirements

### Minimum Server Specifications
- **OS**: CentOS 7/8, Ubuntu 18.04+, or RHEL 7/8
- **RAM**: 4GB minimum (8GB+ recommended for high volume)
- **CPU**: 2+ cores
- **Storage**: 50GB+ SSD
- **Network**: Dedicated IP addresses (multiple IPs recommended)
- **Bandwidth**: Unmetered or high bandwidth allocation

### Prerequisites
- Root access to VPS
- Valid PowerMTA license from Port25
- Dedicated IP addresses with good reputation
- Domain names for sending
- DNS management access

## Step 1: VPS Initial Setup

### Update System
```bash
# CentOS/RHEL
sudo yum update -y
sudo yum install -y wget curl vim net-tools bind-utils

# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y wget curl vim net-tools dnsutils
```

### Configure Hostname
```bash
# Set hostname (replace with your domain)
sudo hostnamectl set-hostname mail.yourdomain.com

# Add to hosts file
echo "$(curl -s ifconfig.me) mail.yourdomain.com mail" | sudo tee -a /etc/hosts
```

### Firewall Configuration
```bash
# CentOS/RHEL with firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-port=25/tcp
sudo firewall-cmd --permanent --add-port=587/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# Ubuntu with ufw
sudo ufw enable
sudo ufw allow 25/tcp
sudo ufw allow 587/tcp
sudo ufw allow 8080/tcp
sudo ufw allow ssh
```

### System Optimization
```bash
# Increase file limits for PowerMTA
cat << 'EOF' | sudo tee -a /etc/security/limits.conf
pmta soft nofile 65536
pmta hard nofile 65536
pmta soft nproc 32768
pmta hard nproc 32768
EOF

# Kernel parameters for better performance
cat << 'EOF' | sudo tee -a /etc/sysctl.conf
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.ip_local_port_range = 1024 65535
EOF

sudo sysctl -p
```

## Step 2: PowerMTA Installation

### Download PowerMTA
```bash
# Create installation directory
mkdir /tmp/pmta-install
cd /tmp/pmta-install

# Download PowerMTA (you must have a valid license)
# Contact Port25 Solutions for licensed version
# Example URL format (replace with your actual download)
wget "https://download.port25.com/pmta/pmta-4.5r8-linux-x86_64.rpm" \
  --http-user=YOUR_USERNAME \
  --http-password=YOUR_PASSWORD
```

### Install PowerMTA
```bash
# CentOS/RHEL
sudo yum install -y rpm-build
sudo rpm -ivh pmta-4.5r8-linux-x86_64.rpm

# Ubuntu/Debian (convert RPM to DEB first)
sudo apt install -y alien
sudo alien -d pmta-4.5r8-linux-x86_64.rpm
sudo dpkg -i pmta_4.5r8-2_amd64.deb
sudo apt-get install -f
```

### Create PowerMTA User and Directories
```bash
# Create pmta user and group
sudo groupadd pmta
sudo useradd -g pmta -s /bin/false -d /etc/pmta -M pmta

# Create required directories
sudo mkdir -p /var/spool/pmta
sudo mkdir -p /var/log/pmta
sudo mkdir -p /etc/pmta/dkim
sudo mkdir -p /var/spool/pmta/pickup
sudo mkdir -p /var/spool/pmta/badmail

# Set ownership and permissions
sudo chown -R pmta:pmta /var/spool/pmta
sudo chown -R pmta:pmta /var/log/pmta
sudo chown -R pmta:pmta /etc/pmta
sudo chmod 755 /var/spool/pmta
sudo chmod 755 /var/log/pmta
sudo chmod 750 /etc/pmta
```

## Step 3: PowerMTA Configuration

### Main Configuration File
Create `/etc/pmta/config`:

```bash
sudo vim /etc/pmta/config
```

Add the following configuration (replace placeholders):

```
# PowerMTA Configuration for High-Volume Email Delivery
# Replace YOUR_* placeholders with actual values

# Basic settings
postmaster postmaster@yourdomain.com
admin-password SecureAdminPassword123

# System settings
spool /var/spool/pmta
max-msg-size 50M
max-rcpt-per-msg 1000

# SMTP Listeners
<smtp-listener 0.0.0.0:25>
    process-x-virtual-mta yes
    process-x-job yes
    process-x-envid yes
</smtp-listener>

<smtp-listener 0.0.0.0:587>
    require-starttls yes
    process-x-virtual-mta yes
    process-x-job yes
    process-x-envid yes
</smtp-listener>

# Web Management Interface
<http-mgmt-listener 0.0.0.0:8080>
    admin-commands true
</http-mgmt-listener>

# Virtual MTAs (replace with your actual IPs)
<virtual-mta mta1>
    smtp-source-host YOUR_PRIMARY_IP
    host-name mail.yourdomain.com
    domain-key default,/etc/pmta/dkim/yourdomain.com.private
</virtual-mta>

<virtual-mta mta2>
    smtp-source-host YOUR_SECONDARY_IP  
    host-name mail2.yourdomain.com
    domain-key default,/etc/pmta/dkim/yourdomain.com.private
</virtual-mta>

# Source definitions (allow EmailPro server to relay)
<source YOUR_EMAILPRO_SERVER_IP>
    always-allow-relaying yes
    smtp-service yes
    process-x-envid yes
    process-x-job yes
    process-x-virtual-mta yes
    add-received-header no
    hide-message-source yes
</source>

<source 0/0>
    always-allow-relaying no
    smtp-service yes
    require-starttls-if-available yes
</source>

# Domain-specific rules
<domain *>
    max-smtp-out 50
    max-msg-per-connection 100
    max-errors-per-connection 10
    retry-upon-5xx true
    bounce-upon-no-mx true
    connect-timeout 60
    command-timeout 300
    data-send-timeout 600
    backoff-mode normal
    backoff-retry-after 10m
    bounce-after 4d
</domain>

# ISP-specific configurations
<domain gmail.com>
    max-smtp-out 10
    max-msg-per-connection 50
    max-msg-rate 100/h
    backoff-retry-after 15m
    smtp-pattern-list gmail-patterns
</domain>

<domain outlook.com>
    max-smtp-out 5
    max-msg-per-connection 25
    max-msg-rate 50/h
    backoff-retry-after 20m
</domain>

<domain yahoo.com>
    max-smtp-out 5
    max-msg-per-connection 25
    max-msg-rate 50/h
    backoff-retry-after 20m
</domain>

<domain hotmail.com>
    max-smtp-out 5
    max-msg-per-connection 25
    max-msg-rate 50/h
    backoff-retry-after 20m
</domain>

# Pattern lists for better deliverability
<pattern-list gmail-patterns>
    reply "421 4.7.0 Try again later" mode=defer
    reply "421 4.7.28 Gmail" mode=defer
    reply "550 5.7.1 Our system has detected" mode=discard
    reply "550 5.7.26 This message does not have authentication" mode=defer
</pattern-list>

# Logging configuration
<acct-file /var/log/pmta/acct.csv>
    records d,b,t,r
    move-to /var/log/pmta/done/
    move-interval 1h
    max-size 100M
    delete-after 7d
    record-fields d timeLogged,timeQueued,orig,dsnAction,dsnStatus,dsnDiag,dsnMta,bounceCat,srcType,srcMta,dlvType,dlvSourceIp,dlvDestinationIp,dlvEsmtpAvailable,dlvSize,vmta,jobId,envId
    record-fields b timeLogged,timeQueued,orig,rcpt,orcpt,dsnAction,dsnStatus,dsnDiag,dsnMta,bounceCat,srcType,srcMta,dlvType,dlvSourceIp,dlvDestinationIp,dlvEsmtpAvailable,dlvSize,vmta,jobId,envId
</acct-file>

# Bounce processing
<bounce-processor>
    deliver-unmatched-to postmaster@yourdomain.com
</bounce-processor>

# Local domains
relay-domain yourdomain.com
```

### Set Configuration Permissions
```bash
sudo chown pmta:pmta /etc/pmta/config
sudo chmod 640 /etc/pmta/config
```

## Step 4: DKIM Configuration

### Generate DKIM Keys
```bash
# Generate DKIM private key
sudo openssl genrsa -out /etc/pmta/dkim/yourdomain.com.private 1024

# Generate public key
sudo openssl rsa -in /etc/pmta/dkim/yourdomain.com.private \
    -pubout -out /etc/pmta/dkim/yourdomain.com.public

# Set permissions
sudo chown pmta:pmta /etc/pmta/dkim/yourdomain.com.*
sudo chmod 600 /etc/pmta/dkim/yourdomain.com.private
sudo chmod 644 /etc/pmta/dkim/yourdomain.com.public
```

### Extract Public Key for DNS
```bash
# Get public key for DNS record (remove headers and newlines)
sudo openssl rsa -in /etc/pmta/dkim/yourdomain.com.private \
    -pubout -outform DER | openssl base64 -A

echo ""
echo "Add this to your DNS as a TXT record:"
echo "default._domainkey.yourdomain.com"
echo "v=DKIM1; k=rsa; p=$(sudo openssl rsa -in /etc/pmta/dkim/yourdomain.com.private -pubout -outform DER | openssl base64 -A)"
```

## Step 5: DNS Configuration

Configure these DNS records for your domain:

### Required DNS Records
```
# MX Record
yourdomain.com.          IN MX 10 mail.yourdomain.com.

# A Records
mail.yourdomain.com.     IN A    YOUR_PRIMARY_IP
mail2.yourdomain.com.    IN A    YOUR_SECONDARY_IP

# SPF Record (include all your sending IPs)
yourdomain.com.          IN TXT  "v=spf1 ip4:YOUR_PRIMARY_IP ip4:YOUR_SECONDARY_IP ~all"

# DKIM Record (use public key generated above)
default._domainkey.yourdomain.com.  IN TXT  "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"

# DMARC Record
_dmarc.yourdomain.com.   IN TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100"

# Reverse DNS (PTR) - Contact your VPS provider to set these
YOUR_PRIMARY_IP.in-addr.arpa.    IN PTR mail.yourdomain.com.
YOUR_SECONDARY_IP.in-addr.arpa.  IN PTR mail2.yourdomain.com.
```

## Step 6: Service Management

### Create SystemD Service
```bash
# PowerMTA usually installs its own service, but if needed:
sudo systemctl enable pmta
sudo systemctl start pmta

# Check status
sudo systemctl status pmta

# View logs
sudo journalctl -u pmta -f
```

### PowerMTA Management Commands
```bash
# Check PowerMTA status
sudo pmta show status

# View message queues
sudo pmta show queues

# Show delivery statistics
sudo pmta show summary

# Reload configuration
sudo pmta reload

# Show specific domain queue
sudo pmta show queue gmail.com

# Pause/resume delivery for domain
sudo pmta pause queue gmail.com
sudo pmta resume queue gmail.com
```

## Step 7: Testing PowerMTA

### Basic SMTP Test
```bash
# Test SMTP connectivity
telnet YOUR_PRIMARY_IP 25

# In telnet session:
EHLO test.com
MAIL FROM: test@yourdomain.com
RCPT TO: yourtest@gmail.com
DATA
Subject: PowerMTA Test

This is a test email from PowerMTA.
.
QUIT
```

### Advanced Testing
```bash
# Test with authentication if required
openssl s_client -connect YOUR_PRIMARY_IP:587 -starttls smtp

# Send test email via command line
echo "Test email body" | mail -s "PowerMTA Test" test@gmail.com
```

## Step 8: EmailPro Integration

### Update EmailPro Environment
Add to your EmailPro `.env` file:

```bash
# PowerMTA Configuration
PMTA_ENABLED=true
PMTA_HOST=YOUR_PRIMARY_IP
PMTA_PORT=25
PMTA_SECURE=false
PMTA_POOL=true
PMTA_MAX_CONNECTIONS=20
PMTA_MAX_MESSAGES=100
PMTA_WEB_MONITOR=http://YOUR_PRIMARY_IP:8080

# Multiple PowerMTA IPs for load balancing
PMTA_SERVERS=YOUR_PRIMARY_IP:25,YOUR_SECONDARY_IP:25
```

### Test EmailPro Integration
```bash
# Test from EmailPro server
curl -X POST http://your-emailpro-server:3000/api/test-smtp \
  -H "Content-Type: application/json" \
  -d '{
    "host": "YOUR_PRIMARY_IP",
    "port": 25,
    "to": "test@gmail.com",
    "subject": "EmailPro PowerMTA Test"
  }'
```

## Step 9: Monitoring and Maintenance

### Log Monitoring
```bash
# Real-time PowerMTA logs
sudo tail -f /var/log/pmta/pmta.log

# Accounting logs
sudo tail -f /var/log/pmta/acct.csv

# Search for specific domain issues
sudo grep "gmail.com" /var/log/pmta/pmta.log | tail -20
```

### Performance Monitoring
```bash
# Monitor queue sizes
watch -n 5 'sudo pmta show queues'

# Check system resources
htop
iostat -x 1
```

### Automated Log Rotation
```bash
# Create logrotate configuration
sudo vim /etc/logrotate.d/pmta

# Add configuration:
/var/log/pmta/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 pmta pmta
    postrotate
        /usr/bin/killall -SIGUSR1 pmta 2>/dev/null || true
    endscript
}

/var/log/pmta/*.csv {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 pmta pmta
}
```

## Step 10: Security and Optimization

### Security Hardening
```bash
# Restrict web interface access
sudo iptables -A INPUT -p tcp --dport 8080 -s YOUR_ADMIN_IP -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8080 -j DROP

# Limit SMTP access to authorized sources
sudo iptables -A INPUT -p tcp --dport 25 -s YOUR_EMAILPRO_SERVER_IP -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 25 -j DROP

# Save iptables rules
sudo iptables-save > /etc/iptables/rules.v4
```

### Performance Tuning
Monitor and adjust these PowerMTA settings:

- **max-smtp-out**: Start with 10-20 per domain
- **max-msg-per-connection**: 50-100 for most ISPs
- **max-msg-rate**: Vary by ISP (Gmail: 100/h, Yahoo: 50/h)
- **retry-after**: 10-30 minutes for temporary failures
- **bounce-after**: 4-7 days for permanent failures

### Backup Configuration
```bash
# Create backup script
sudo vim /etc/pmta/backup.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/pmta"
mkdir -p $BACKUP_DIR

# Backup configuration and DKIM keys
tar -czf $BACKUP_DIR/pmta_config_$DATE.tar.gz \
    /etc/pmta/config \
    /etc/pmta/dkim/ \
    /var/log/pmta/acct.csv

# Keep only last 30 days
find $BACKUP_DIR -name "pmta_config_*.tar.gz" -mtime +30 -delete

# Make executable and add to cron
sudo chmod +x /etc/pmta/backup.sh
sudo crontab -e
# Add: 0 2 * * * /etc/pmta/backup.sh
```

## Troubleshooting Common Issues

### Connection Issues
```bash
# Check if PowerMTA is listening
sudo netstat -tlnp | grep pmta
sudo ss -tlnp | grep pmta

# Test DNS resolution
nslookup yourdomain.com
dig yourdomain.com MX
```

### Delivery Issues
```bash
# Check domain-specific problems
sudo pmta show queue gmail.com --verbose

# View recent bounces
sudo grep "bounce" /var/log/pmta/acct.csv | tail -10

# Check DKIM signing
sudo pmta test dkim yourdomain.com
```

### Performance Issues
```bash
# Monitor system resources
top
iotop
netstat -i

# Check PowerMTA performance
sudo pmta show summary --repeat=10
```

This guide provides a complete PowerMTA installation and configuration for professional email delivery. Start with small test volumes and gradually scale up to production levels while monitoring deliverability and performance metrics.