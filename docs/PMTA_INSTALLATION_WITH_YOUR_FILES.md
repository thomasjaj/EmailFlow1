# PowerMTA Installation Guide - Using Your Licensed Files

You have a complete PowerMTA 4.0r6 package with valid license. This guide shows how to deploy it on your new VPS for EmailPro integration.

## Your PowerMTA Package Contents

- **PowerMTA RPM**: PowerMTA-4.0r6-201204021809.x86_64.rpm (Licensed version)
- **License File**: Valid unlimited license (expires: never)
- **Configuration Files**: Two working configs (config and config_pmta)
- **Installation Scripts**: Automated setup scripts (script.sh and yassin.sh)

## Step 1: VPS Preparation

### Initial Server Setup
```bash
# Update system
sudo yum update -y
# Or for Ubuntu: sudo apt update && sudo apt upgrade -y

# Install required packages
sudo yum install -y httpd perl nmap telnet wget curl vim net-tools
# Or for Ubuntu: sudo apt install -y apache2 perl nmap telnet wget curl vim net-tools

# Configure firewall
sudo firewall-cmd --permanent --add-port=25/tcp
sudo firewall-cmd --permanent --add-port=587/tcp
sudo firewall-cmd --permanent --add-port=8081/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload

# Or for Ubuntu:
# sudo ufw allow 25/tcp && sudo ufw allow 587/tcp && sudo ufw allow 8081/tcp && sudo ufw allow 80/tcp
```

### Set Hostname
```bash
# Set your domain as hostname
sudo hostnamectl set-hostname mail.yourdomain.com
echo "$(curl -s ifconfig.me) mail.yourdomain.com" | sudo tee -a /etc/hosts
```

## Step 2: Upload Your PowerMTA Files

### Create Installation Directory
```bash
mkdir -p ~/pmta-install
cd ~/pmta-install
```

### Upload Files to VPS
Upload your PowerMTA files to the VPS using SCP or SFTP:

```bash
# From your local machine, upload all files:
scp PowerMTA-4.0r6-201204021809.x86_64.rpm root@YOUR_VPS_IP:~/pmta-install/
scp license root@YOUR_VPS_IP:~/pmta-install/
scp config root@YOUR_VPS_IP:~/pmta-install/
scp script.sh root@YOUR_VPS_IP:~/pmta-install/
scp yassin.sh root@YOUR_VPS_IP:~/pmta-install/
```

## Step 3: PowerMTA Installation

### Install PowerMTA Using Your Files
```bash
cd ~/pmta-install

# Make scripts executable
chmod +x script.sh yassin.sh

# Install PowerMTA RPM
sudo rpm -ivh PowerMTA-4.0r6-201204021809.x86_64.rpm

# Copy license file
sudo cp license /etc/pmta/

# Set permissions
sudo chown pmta:pmta /etc/pmta/license
sudo chmod 640 /etc/pmta/license
```

### Run Directory Setup Script
```bash
# Run the yassin.sh script to create all required directories
sudo ./yassin.sh
```

This script creates:
- `/var/spool/pmtaPickup/` directories
- `/var/spool/pmtaIncoming/` directory  
- `/var/log/pmta/` and reporting directories
- Proper permissions for all PowerMTA directories

## Step 4: Configuration for EmailPro Integration

### Create EmailPro-Optimized Configuration

Choose one of your existing configs as a base and modify it for EmailPro:

```bash
# Copy your config as template
sudo cp config /etc/pmta/config

# Edit for your EmailPro setup
sudo vim /etc/pmta/config
```

**Key modifications needed in your config:**

1. **Update IP addresses** (replace the old IPs):
   ```
   # OLD: smtp-listener 159.89.180.248:25
   # NEW: 
   smtp-listener YOUR_NEW_VPS_IP:25
   smtp-listener YOUR_NEW_VPS_IP:587
   ```

2. **Update source IP** (allow your EmailPro server):
   ```
   # OLD: <source 192.81.210.117>
   # NEW:
   <source YOUR_EMAILPRO_SERVER_IP>
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
   ```

3. **Update domain and postmaster**:
   ```
   # OLD: postmaster servers@globalmediajob.com
   # NEW:
   postmaster postmaster@yourdomain.com
   
   # OLD: relay-domain fedelethome.club
   # NEW:
   relay-domain yourdomain.com
   ```

4. **Update HTTP management access**:
   ```
   # OLD: http-access 138.197.117.22 admin
   # NEW:
   http-access YOUR_ADMIN_IP admin
   http-access YOUR_EMAILPRO_SERVER_IP admin
   ```

### Optimized EmailPro Configuration
```bash
sudo tee /etc/pmta/config << 'EOF'
#########################Global configuration#####################
Pickup /var/spool/pmtaPickup/Pickup /var/spool/pmtaPickup/BadMail

postmaster postmaster@yourdomain.com

log-file /var/log/pmta/log
log-file-world-readable false

spool /var/spool/pmta

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
http-access YOUR_ADMIN_IP admin
http-access YOUR_EMAILPRO_SERVER_IP admin

# Relay domain
relay-domain yourdomain.com

# SMTP listeners
smtp-listener YOUR_VPS_IP:25
smtp-listener YOUR_VPS_IP:587

# EmailPro source (allow your EmailPro server to relay)
<source YOUR_EMAILPRO_SERVER_IP>
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

<source 0/0>
   always-allow-relaying no
   smtp-service yes
   log-connections yes
   log-data no
   log-commands no
</source>

# Virtual MTAs for EmailPro campaigns
<virtual-mta emailpro-campaigns>
    smtp-source-host YOUR_VPS_IP
    host-name mail.yourdomain.com
</virtual-mta>

<virtual-mta emailpro-transactional>
    smtp-source-host YOUR_VPS_IP
    host-name mail.yourdomain.com
</virtual-mta>

# Domain configurations (conservative settings for good deliverability)
<domain gmail.com>
    dk-sign no
    dkim-sign yes
    retry-after 15m
    bounce-after 24h
    log-transfer-failures yes
    log-connections yes
    log-commands no
    log-data no
    max-smtp-out 5
    max-msg-per-connection 50
</domain>

<domain outlook.com>
    dk-sign no
    dkim-sign yes
    retry-after 15m
    bounce-after 24h
    log-transfer-failures yes
    log-connections yes
    log-commands no
    log-data no
    max-smtp-out 3
    max-msg-per-connection 25
</domain>

<domain yahoo.com>
    dk-sign no
    dkim-sign yes
    retry-after 15m
    bounce-after 24h
    log-transfer-failures yes
    log-connections yes
    log-commands no
    log-data no
    max-smtp-out 3
    max-msg-per-connection 25
</domain>

<domain *>
    dk-sign no
    dkim-sign yes
    retry-after 10m
    bounce-after 4d
    log-transfer-failures yes
    log-connections yes
    log-commands no
    log-data no
    max-smtp-out 10
    max-msg-per-connection 100
</domain>
EOF
```

### Set Configuration Permissions
```bash
sudo chown pmta:pmta /etc/pmta/config
sudo chmod 640 /etc/pmta/config
```

## Step 5: Start PowerMTA Services

```bash
# Start HTTP service first
sudo systemctl enable httpd
sudo systemctl start httpd

# Start PowerMTA
sudo systemctl enable pmta
sudo systemctl start pmta

# Start PowerMTA HTTP management
sudo systemctl enable pmtahttp
sudo systemctl start pmtahttp

# Check all services are running
sudo systemctl status pmta
sudo systemctl status pmtahttp
sudo systemctl status httpd
```

### Verify Installation
```bash
# Check if PowerMTA is listening on ports
sudo netstat -tlnp | grep :25
sudo netstat -tlnp | grep :8081

# Test PowerMTA status
sudo pmta show status
sudo pmta show queues

# View logs
sudo tail -f /var/log/pmta/log
```

## Step 6: DKIM Configuration (Optional but Recommended)

### Generate DKIM Keys for Better Deliverability
```bash
# Create DKIM directory
sudo mkdir -p /etc/pmta/dkim

# Generate DKIM key
sudo openssl genrsa -out /etc/pmta/dkim/yourdomain.com.private 1024
sudo openssl rsa -in /etc/pmta/dkim/yourdomain.com.private -pubout -out /etc/pmta/dkim/yourdomain.com.public

# Set permissions
sudo chown pmta:pmta /etc/pmta/dkim/yourdomain.com.*
sudo chmod 600 /etc/pmta/dkim/yourdomain.com.private
sudo chmod 644 /etc/pmta/dkim/yourdomain.com.public

# Get public key for DNS
echo "Add this DKIM record to your DNS:"
echo "default._domainkey.yourdomain.com TXT"
echo "v=DKIM1; k=rsa; p=$(sudo openssl rsa -in /etc/pmta/dkim/yourdomain.com.private -pubout -outform DER | openssl base64 -A)"
```

### Update Config for DKIM
```bash
# Add DKIM signing to virtual MTAs
sudo sed -i '/host-name mail.yourdomain.com/a\    domain-key default,/etc/pmta/dkim/yourdomain.com.private' /etc/pmta/config

# Restart PowerMTA to apply DKIM
sudo systemctl restart pmta
```

## Step 7: DNS Configuration

Set up these DNS records for your domain:

```
# A Record
mail.yourdomain.com.     IN A    YOUR_VPS_IP

# MX Record
yourdomain.com.          IN MX 10 mail.yourdomain.com.

# SPF Record
yourdomain.com.          IN TXT  "v=spf1 ip4:YOUR_VPS_IP ~all"

# DKIM Record (if you set up DKIM in step 6)
default._domainkey.yourdomain.com.  IN TXT  "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"

# DMARC Record
_dmarc.yourdomain.com.   IN TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

**Important**: Contact your VPS provider to set reverse DNS (PTR record):
```
YOUR_VPS_IP.in-addr.arpa. IN PTR mail.yourdomain.com.
```

## Step 8: Test PowerMTA

### Basic SMTP Test
```bash
# Test SMTP connectivity
telnet YOUR_VPS_IP 25

# Should show PowerMTA banner
# Type: EHLO test.com
# Should show capabilities including STARTTLS
```

### Web Management Interface
Access PowerMTA web interface at: `http://YOUR_VPS_IP:8081`

### Send Test Email
```bash
# Send test email
echo "Test message from PowerMTA" | mail -s "PowerMTA Test" test@gmail.com

# Monitor in PowerMTA
sudo pmta show queues
sudo tail -f /var/log/pmta/acct
```

## Step 9: EmailPro Integration

### Update EmailPro Environment Variables
Add to your EmailPro `.env` file:

```bash
# PowerMTA Configuration
PMTA_ENABLED=true
PMTA_HOST=YOUR_VPS_IP
PMTA_PORT=25
PMTA_SECURE=false
PMTA_WEB_MONITOR=http://YOUR_VPS_IP:8081
PMTA_DEFAULT_VTA=emailpro-campaigns
```

### Configure SMTP Server in EmailPro
In your EmailPro admin dashboard:

1. **Add New SMTP Server**:
   - **Name**: PowerMTA Production
   - **Host**: YOUR_VPS_IP
   - **Port**: 25
   - **Security**: None
   - **Authentication**: None (whitelisted by IP)
   - **Pool**: Enabled
   - **Max Connections**: 10

2. **Test Connection** from EmailPro interface

### Test Integration
```bash
# From EmailPro server, test SMTP connection
telnet YOUR_VPS_IP 25

# Send test campaign through EmailPro
# Monitor delivery in PowerMTA web interface
```

## Step 10: Monitoring and Optimization

### Daily Monitoring Commands
```bash
# Check PowerMTA status
sudo pmta show status

# Monitor queues by domain
sudo pmta show queues

# View recent delivery statistics
sudo pmta show summary

# Check for any issues
sudo tail -f /var/log/pmta/log | grep -i error
```

### Performance Optimization Tips

**Start Conservative** (your config has high limits - reduce them initially):
- Begin with `max-smtp-out 3-5` per domain
- Monitor bounces and deferrals carefully
- Gradually increase limits based on delivery success
- Watch for blacklist issues

**Key Settings to Monitor**:
- Gmail: Start with 3-5 connections, 25-50 msgs/connection
- Outlook: Start with 2-3 connections, 15-25 msgs/connection  
- Yahoo: Start with 2-3 connections, 15-25 msgs/connection

### Log Analysis
```bash
# Monitor delivery rates by domain
grep "gmail.com" /var/log/pmta/acct | tail -20

# Check for bounces
grep "bounce" /var/log/pmta/acct | tail -10

# Monitor connection issues
grep "connect" /var/log/pmta/log | tail -10
```

## Troubleshooting

### Common Issues

**PowerMTA won't start**:
```bash
# Check configuration syntax
sudo pmta config test

# Check logs for errors
sudo journalctl -u pmta -f
```

**Web interface not accessible**:
```bash
# Check if pmtahttp is running
sudo systemctl status pmtahttp

# Check firewall
sudo firewall-cmd --list-ports
```

**EmailPro can't connect**:
```bash
# Verify your EmailPro IP is allowed in config
grep -A5 "source YOUR_EMAILPRO_SERVER_IP" /etc/pmta/config

# Test from EmailPro server
telnet YOUR_VPS_IP 25
```

This installation uses your licensed PowerMTA 4.0r6 files and is optimized for EmailPro integration. Start with conservative delivery settings and scale up gradually as you build sender reputation.