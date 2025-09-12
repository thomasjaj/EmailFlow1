# PowerMTA Deployment Guide - Using Your Licensed Files

Since you already have PowerMTA files with license, this guide shows how to deploy them on your VPS.

## Step 1: Prepare Your VPS

### Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y
# Or for CentOS: sudo yum update -y

# Install required packages
sudo apt install -y wget curl vim net-tools dnsutils
# Or for CentOS: sudo yum install -y wget curl vim net-tools bind-utils

# Set hostname
sudo hostnamectl set-hostname mail.yourdomain.com
echo "$(curl -s ifconfig.me) mail.yourdomain.com" | sudo tee -a /etc/hosts
```

### Configure Firewall
```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 25/tcp    # SMTP
sudo ufw allow 587/tcp   # SMTP with STARTTLS
sudo ufw allow 8080/tcp  # PowerMTA Web Interface

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=25/tcp
sudo firewall-cmd --permanent --add-port=587/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

## Step 2: Upload and Install Your PowerMTA Files

### Upload Your Files to VPS
```bash
# Create installation directory
mkdir -p ~/pmta-install
cd ~/pmta-install

# Upload your PowerMTA files using SCP/SFTP
# From your local machine:
# scp your-powermta-files.tar.gz user@your-vps-ip:~/pmta-install/
# scp PowerMTA-*.rpm user@your-vps-ip:~/pmta-install/
```

### Extract and Install
```bash
# If you have a tar.gz package
tar -xzf your-powermta-package.tar.gz

# Install PowerMTA RPM (CentOS/RHEL)
sudo rpm -ivh PowerMTA-*.rpm

# For Ubuntu/Debian, convert RPM first
sudo apt install -y alien
sudo alien -d PowerMTA-*.rpm
sudo dpkg -i powermta_*.deb
sudo apt-get install -f
```

### Create PowerMTA User and Directories
```bash
# Create pmta user
sudo groupadd pmta
sudo useradd -g pmta -s /bin/false -d /etc/pmta -M pmta

# Create required directories
sudo mkdir -p /var/spool/pmta/{pickup,badmail,queue}
sudo mkdir -p /var/log/pmta/done
sudo mkdir -p /etc/pmta/dkim

# Set ownership
sudo chown -R pmta:pmta /var/spool/pmta
sudo chown -R pmta:pmta /var/log/pmta
sudo chown -R pmta:pmta /etc/pmta
```

## Step 3: Configuration for Your Setup

### Basic PowerMTA Configuration
Create `/etc/pmta/config`:

```bash
sudo vim /etc/pmta/config
```

**Use this configuration (replace YOUR_* with actual values):**

```
# PowerMTA Configuration for EmailPro Integration
# Admin settings
postmaster postmaster@yourdomain.com
admin-password YourSecurePassword123

# System settings
spool /var/spool/pmta
max-msg-size 50M

# SMTP Listeners
<smtp-listener 0.0.0.0:25>
    process-x-virtual-mta yes
    process-x-job yes
</smtp-listener>

<smtp-listener 0.0.0.0:587>
    require-starttls yes
    process-x-virtual-mta yes
    process-x-job yes
</smtp-listener>

# Web Management
<http-mgmt-listener 0.0.0.0:8080>
    admin-commands true
</http-mgmt-listener>

# Allow EmailPro server to relay
<source YOUR_EMAILPRO_SERVER_IP>
    always-allow-relaying yes
    smtp-service yes
    process-x-virtual-mta yes
    process-x-job yes
    add-received-header no
</source>

# Default source (restrict others)
<source 0/0>
    always-allow-relaying no
    smtp-service yes
</source>

# Virtual MTAs (replace with your actual IPs)
<virtual-mta emailpro-main>
    smtp-source-host YOUR_VPS_IP
    host-name mail.yourdomain.com
    domain-key default,/etc/pmta/dkim/yourdomain.com.private
</virtual-mta>

# Domain rules
<domain *>
    max-smtp-out 20
    max-msg-per-connection 100
    retry-upon-5xx true
    bounce-upon-no-mx true
    backoff-retry-after 10m
    bounce-after 4d
</domain>

# Gmail specific
<domain gmail.com>
    max-smtp-out 5
    max-msg-per-connection 50
    max-msg-rate 50/h
</domain>

# Yahoo/Outlook specific
<domain yahoo.com>
    max-smtp-out 3
    max-msg-per-connection 25
    max-msg-rate 25/h
</domain>

<domain outlook.com>
    max-smtp-out 3
    max-msg-per-connection 25
    max-msg-rate 25/h
</domain>

# Logging
<acct-file /var/log/pmta/acct.csv>
    records d,b,t
    move-to /var/log/pmta/done/
    move-interval 1h
    max-size 100M
    delete-after 7d
</acct-file>

# Bounce handling
<bounce-processor>
    deliver-unmatched-to postmaster@yourdomain.com
</bounce-processor>

# Local domain
relay-domain yourdomain.com
```

### Set Permissions
```bash
sudo chown pmta:pmta /etc/pmta/config
sudo chmod 640 /etc/pmta/config
```

## Step 4: DKIM Setup

### Generate DKIM Keys
```bash
# Generate DKIM key pair
sudo openssl genrsa -out /etc/pmta/dkim/yourdomain.com.private 1024
sudo openssl rsa -in /etc/pmta/dkim/yourdomain.com.private -pubout -out /etc/pmta/dkim/yourdomain.com.public

# Set permissions
sudo chown pmta:pmta /etc/pmta/dkim/yourdomain.com.*
sudo chmod 600 /etc/pmta/dkim/yourdomain.com.private
sudo chmod 644 /etc/pmta/dkim/yourdomain.com.public

# Get public key for DNS
echo "Add this TXT record to your DNS:"
echo "default._domainkey.yourdomain.com"
echo "v=DKIM1; k=rsa; p=$(sudo openssl rsa -in /etc/pmta/dkim/yourdomain.com.private -pubout -outform DER | openssl base64 -A)"
```

## Step 5: DNS Configuration

Add these records to your domain DNS:

```
# A Record
mail.yourdomain.com.     IN A    YOUR_VPS_IP

# MX Record  
yourdomain.com.          IN MX 10 mail.yourdomain.com.

# SPF Record
yourdomain.com.          IN TXT  "v=spf1 ip4:YOUR_VPS_IP ~all"

# DKIM Record (use output from step 4)
default._domainkey.yourdomain.com.  IN TXT  "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"

# DMARC Record
_dmarc.yourdomain.com.   IN TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

**Important:** Contact your VPS provider to set reverse DNS (PTR record):
```
YOUR_VPS_IP.in-addr.arpa. IN PTR mail.yourdomain.com.
```

## Step 6: Start PowerMTA

### Enable and Start Services
```bash
# Start PowerMTA
sudo systemctl enable pmta
sudo systemctl start pmta

# Check status
sudo systemctl status pmta

# View logs
sudo tail -f /var/log/pmta/pmta.log
```

### Verify Installation
```bash
# Check if PowerMTA is listening
sudo netstat -tlnp | grep :25
sudo netstat -tlnp | grep :8080

# Test basic functionality
sudo pmta show status
sudo pmta show queues
```

## Step 7: Test PowerMTA

### Basic SMTP Test
```bash
# Test SMTP connectivity
telnet YOUR_VPS_IP 25

# Send test email
echo "Test message body" | mail -s "PowerMTA Test" test@gmail.com
```

### Web Interface
Access PowerMTA web interface at: `http://YOUR_VPS_IP:8080`
- Username: admin
- Password: (the one you set in config)

## Step 8: Integrate with EmailPro

### Update EmailPro Environment
Add to your EmailPro `.env` file:

```bash
# PowerMTA Configuration
PMTA_ENABLED=true
PMTA_HOST=YOUR_VPS_IP
PMTA_PORT=25
PMTA_SECURE=false
PMTA_WEB_MONITOR=http://YOUR_VPS_IP:8080
```

### Update EmailPro SMTP Settings
In your EmailPro admin panel:
- **Server Name**: PowerMTA Production  
- **Host**: YOUR_VPS_IP
- **Port**: 25
- **Security**: None
- **Authentication**: None (since your EmailPro IP is whitelisted)

### Test Integration
```bash
# From your EmailPro server, test connectivity
telnet YOUR_VPS_IP 25

# Send test campaign through EmailPro interface
# Monitor on PowerMTA: sudo pmta show queues
```

## Step 9: Monitoring and Maintenance

### Daily Monitoring Commands
```bash
# Check PowerMTA status
sudo pmta show status

# Monitor queues
sudo pmta show queues

# View delivery stats
sudo pmta show summary

# Check logs
sudo tail -f /var/log/pmta/acct.csv
```

### Performance Optimization
Start with conservative settings and gradually increase:
- Begin with `max-smtp-out 3-5` per domain
- Monitor bounces and deferrals
- Increase limits based on delivery success
- Watch for IP reputation issues

## Troubleshooting

### Common Issues and Solutions

**PowerMTA won't start:**
```bash
# Check configuration syntax
sudo pmta config test

# Check logs for errors
sudo journalctl -u pmta -f
```

**EmailPro can't connect:**
```bash
# Verify firewall allows EmailPro IP
sudo ufw status numbered

# Check PowerMTA source configuration
grep -A5 "source YOUR_EMAILPRO_SERVER_IP" /etc/pmta/config
```

**Emails not delivering:**
```bash
# Check specific domain queue
sudo pmta show queue gmail.com

# View recent delivery attempts
sudo grep "gmail.com" /var/log/pmta/pmta.log | tail -10
```

This deployment approach uses your existing licensed PowerMTA files and integrates perfectly with your EmailPro platform. Start with small test volumes and gradually scale up as you optimize the configuration.