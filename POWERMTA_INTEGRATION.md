# PowerMTA Integration Guide

This guide explains how to integrate EmailPro with PowerMTA for enterprise-grade email delivery with your own PowerMTA server configuration.

## What is PowerMTA?

PowerMTA is a high-performance Mail Transfer Agent (MTA) designed for high-volume email delivery. It provides:

- High-throughput email delivery (millions per hour)
- Advanced queue management and throttling
- ISP-specific delivery optimization
- Real-time delivery tracking and analytics
- Comprehensive bounce and feedback loop handling
- IP reputation management and warming

## Prerequisites

- PowerMTA license and installation files
- Dedicated server or VPS for PowerMTA
- Multiple IP addresses (recommended for high volume)
- Domain with proper DNS configuration
- EmailPro application server

## PowerMTA Server Setup

### 1. Install PowerMTA

Install PowerMTA using your license and installation files:

```bash
# For RPM-based systems (CentOS/RHEL)
sudo rpm -ivh PowerMTA-4.x.x.x86_64.rpm

# For DEB-based systems (Ubuntu/Debian)
sudo dpkg -i powermta_4.x.x_amd64.deb
sudo apt-get install -f
```

### 2. PowerMTA Configuration Template

Create or update `/etc/pmta/config` with your server-specific settings:

```
#########################Global configuration#####################
# Pickup directories
Pickup /var/spool/pmtaPickup/Pickup /var/spool/pmtaPickup/BadMail

# Postmaster email
postmaster admin@yourdomain.com

# Logging configuration
log-file /var/log/pmta/log
log-file-world-readable false

# Spool directories
spool /var/spool/pmta

# Accounting files
<acct-file /var/log/pmta/acct>
    move-to /var/log/pmtaAccRep/
    move-interval 1d
    records d,b
    world-readable yes
    record-fields d timeLogged,timeQueued,timeImprinted,orig,dsnAction,dsnStatus,dsnDiag,dsnMta,bounceCat,srcType,srcMta,dlvType,dlvSourceIp,dlvDestinationIp,dlvEsmtpAvailable,dlvSize,vmta,jobId
    record-fields b timeLogged,timeQueued,timeImprinted,orig,rcpt,orcpt,dsnAction,dsnStatus,dsnDiag,dsnMta,bounceCat,srcType,srcMta,dlvType,dlvSourceIp,dlvDestinationIp,dlvEsmtpAvailable,dlvSize,vmta,jobId
</acct-file>

# HTTP management interface
http-mgmt-port 8080
http-access YOUR_ADMIN_IP admin
http-access YOUR_EMAILPRO_SERVER_IP admin

# Relay domain
relay-domain yourdomain.com

# SMTP listeners (update with your server IPs)
smtp-listener YOUR_PRIMARY_IP:25
smtp-listener YOUR_SECONDARY_IP:25

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

# Default source for other connections
<source 0/0>
   always-allow-relaying no
   smtp-service yes
   log-connections yes
   log-data no
   log-commands no
</source>

###################Domain-specific delivery rules#####################
<domain gmail.com>
    dk-sign no
    dkim-sign yes
    retry-after 10m
    bounce-after 24h
    log-transfer-failures yes
    log-connections yes
    log-commands no
    log-data no
    max-smtp-out 10
    max-msg-per-connection 50
</domain>

<domain outlook.com>
    dk-sign no
    dkim-sign yes
    retry-after 10m
    bounce-after 24h
    log-transfer-failures yes
    log-connections yes
    log-commands no
    log-data no
    max-smtp-out 10
    max-msg-per-connection 50
</domain>

<domain yahoo.com>
    dk-sign no
    dkim-sign yes
    retry-after 10m
    bounce-after 24h
    log-transfer-failures yes
    log-connections yes
    log-commands no
    log-data no
    max-smtp-out 10
    max-msg-per-connection 50
</domain>

# Catch-all domain configuration
<domain *>
    dk-sign no
    dkim-sign yes
    log-transfer-failures yes
    retry-after 10m
    bounce-after 24h
    log-connections yes
    log-commands no
    log-data no
    max-smtp-out 20
</domain>

###################Virtual MTAs configuration#####################
# EmailPro Campaign MTA
<virtual-mta emailpro-campaigns> 
    smtp-source-ip YOUR_PRIMARY_IP
    host-name mail.yourdomain.com
    domain-key signing-domain=yourdomain.com,selector=emailpro,key-file=/etc/pmta/dkim/yourdomain.com.pem
</virtual-mta>

# EmailPro Transactional MTA
<virtual-mta emailpro-transactional>
    smtp-source-ip YOUR_SECONDARY_IP
    host-name transactional.yourdomain.com
    domain-key signing-domain=yourdomain.com,selector=transactional,key-file=/etc/pmta/dkim/yourdomain.com.pem
</virtual-mta>

# Additional MTAs (add your own IP addresses)
<virtual-mta emailpro-newsletters>
    smtp-source-ip YOUR_THIRD_IP
    host-name newsletters.yourdomain.com
    domain-key signing-domain=yourdomain.com,selector=newsletters,key-file=/etc/pmta/dkim/yourdomain.com.pem
</virtual-mta>
```

### 3. Setup Directories and Permissions

Use the setup script from your PowerMTA package or create directories manually:

```bash
#!/bin/bash
# Create required directories
sudo mkdir -p /var/spool/pmtaPickup/Pickup
sudo mkdir -p /var/spool/pmtaPickup/BadMail
sudo mkdir -p /var/spool/pmtaIncoming
sudo mkdir -p /var/log/pmta
sudo mkdir -p /var/log/pmtaAccRep

# Set permissions
sudo chown pmta:pmta /var/spool/pmtaPickup/Pickup
sudo chown pmta:pmta /var/spool/pmtaPickup/BadMail
sudo chown pmta:pmta /var/spool/pmtaIncoming
sudo chown pmta:pmta /var/log/pmta
sudo chown pmta:pmta /var/log/pmtaAccRep
sudo chmod 755 /var/spool/pmtaIncoming
sudo chmod 755 /var/log/pmta
sudo chmod 755 /var/log/pmtaAccRep

# Set config file permissions
sudo chown pmta:pmta /etc/pmta/config
sudo chmod 640 /etc/pmta/config
```

### 4. DKIM Configuration

Set up DKIM signing for better deliverability:

```bash
# Create DKIM directory
sudo mkdir -p /etc/pmta/dkim

# Generate DKIM keys for your domain
sudo /opt/pmta/bin/pmta-keygen yourdomain.com /etc/pmta/dkim/yourdomain.com.pem

# Set proper permissions
sudo chown pmta:pmta /etc/pmta/dkim/yourdomain.com.pem
sudo chmod 600 /etc/pmta/dkim/yourdomain.com.pem

# Display public key for DNS setup
echo "Add this TXT record to your DNS:"
echo "emailpro._domainkey.yourdomain.com"
sudo /opt/pmta/bin/pmta show keys yourdomain.com
```

### 5. Start PowerMTA Services

```bash
# Start PowerMTA
sudo systemctl enable pmta
sudo systemctl start pmta

# Start PowerMTA HTTP service
sudo systemctl enable pmtahttp
sudo systemctl start pmtahttp

# Check status
sudo systemctl status pmta
sudo systemctl status pmtahttp
```

### 6. Configure Firewall

```bash
# Allow SMTP and HTTP management ports
sudo firewall-cmd --permanent --add-port=25/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-source=YOUR_EMAILPRO_SERVER_IP
sudo firewall-cmd --reload

# Or using iptables
sudo iptables -I INPUT -p tcp --dport 25 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -I INPUT -s YOUR_EMAILPRO_SERVER_IP -j ACCEPT
```

## EmailPro Integration

### 1. Update EmailPro Configuration

Update your EmailPro server's `.env` file:

```bash
# PowerMTA Integration Settings
PMTA_HOST=YOUR_PMTA_SERVER_IP
PMTA_PORT=25
PMTA_WEB_MONITOR=http://YOUR_PMTA_SERVER_IP:8080
USE_PMTA=true
PMTA_FROM_DOMAIN=yourdomain.com

# Multiple PowerMTA IPs (comma separated)
PMTA_IPS=YOUR_PRIMARY_IP,YOUR_SECONDARY_IP,YOUR_THIRD_IP
```

### 2. Test PowerMTA Integration

```bash
# Test SMTP connectivity from EmailPro server
telnet YOUR_PMTA_SERVER_IP 25

# Test EmailPro to PowerMTA integration
curl -X POST http://your-emailpro-server:3000/api/send-pmta-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@yourdomain.com",
    "subject": "PowerMTA Integration Test",
    "html": "<h1>Test Email via PowerMTA</h1><p>This email was sent through PowerMTA from EmailPro.</p>",
    "campaignType": "campaigns"
  }'

# Check PowerMTA status through EmailPro
curl http://your-emailpro-server:3000/api/pmta/status
```

## DNS Configuration

### 1. SPF Record

Add SPF record to your domain's DNS:

```
yourdomain.com    TXT    "v=spf1 ip4:YOUR_PRIMARY_IP ip4:YOUR_SECONDARY_IP include:_spf.google.com ~all"
```

### 2. DKIM Record

Add the DKIM public key generated earlier:

```
emailpro._domainkey.yourdomain.com    TXT    "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"
```

### 3. DMARC Record

Set up DMARC policy:

```
_dmarc.yourdomain.com    TXT    "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

### 4. Reverse DNS (PTR Records)

Ensure your IPs have proper reverse DNS:

```
YOUR_PRIMARY_IP    PTR    mail.yourdomain.com
YOUR_SECONDARY_IP    PTR    transactional.yourdomain.com
```

## Monitoring and Maintenance

### 1. PowerMTA Commands

```bash
# View queue status
/opt/pmta/bin/pmta show queues

# Show delivery statistics
/opt/pmta/bin/pmta show summary

# View specific domain queue
/opt/pmta/bin/pmta show queue gmail.com

# Pause/resume domain delivery
/opt/pmta/bin/pmta pause queue gmail.com
/opt/pmta/bin/pmta resume queue gmail.com
```

### 2. Log Monitoring

```bash
# Monitor real-time delivery
sudo tail -f /var/log/pmta/log

# View accounting data
sudo tail -f /var/log/pmta/acct

# Search for specific domains
sudo grep "gmail.com" /var/log/pmta/log | tail -20
```

### 3. Performance Optimization

Monitor and adjust these settings based on your delivery volume:

- `max-smtp-out` - Maximum concurrent connections per domain
- `max-msg-per-connection` - Messages per SMTP connection
- `retry-after` - Retry interval for failed deliveries
- `bounce-after` - When to permanently fail messages

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check PowerMTA service
   sudo systemctl status pmta
   
   # Check firewall
   sudo netstat -tlnp | grep :25
   ```

2. **Relay Access Denied**
   ```bash
   # Verify EmailPro server IP in PowerMTA config
   grep -A 10 "source YOUR_EMAILPRO_SERVER_IP" /etc/pmta/config
   ```

3. **DKIM Issues**
   ```bash
   # Test DKIM key
   /opt/pmta/bin/pmta test dkim yourdomain.com
   ```

### Debug Tools

```bash
# Test PowerMTA configuration
/opt/pmta/bin/pmta config test

# Check DKIM setup
/opt/pmta/bin/pmta show keys

# Monitor specific virtual MTA
/opt/pmta/bin/pmta show vmta emailpro-campaigns
```

This configuration provides a solid foundation for integrating your EmailPro platform with PowerMTA using your own server infrastructure and IP addresses.