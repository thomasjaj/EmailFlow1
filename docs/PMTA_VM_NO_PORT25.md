# PowerMTA VirtualBox Setup - No Port 25 Required

This guide shows how to run PowerMTA on VirtualBox using IP providers for sending, without opening port 25 on your local network.

## How It Works Without Port 25

### Method 1: SMTP Relay (Recommended)
```
EmailPro (192.168.100.170) → VirtualBox VM (192.168.1.100:25) → Provider SMTP (587) → Internet
```

**Benefits:**
- No port 25 needed on your router/firewall
- PowerMTA acts as local relay only
- Provider handles all external delivery
- Clean professional IPs from provider

### Method 2: VPN Tunnel
```
EmailPro → VirtualBox VM (PowerMTA + VPN) → Provider's Network → Internet
```

**Benefits:**
- VM gets provider's IP through VPN
- All traffic appears from provider's network
- No port forwarding needed

## PowerMTA Configuration for SMTP Relay

### Basic Relay Configuration
```bash
sudo vim /etc/pmta/config
```

**Configuration that doesn't require port 25:**
```
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

# HTTP management interface (local only)
http-mgmt-port 8081
http-access 192.168.1.0/24 admin
http-access 192.168.100.170 admin  # Your EmailPro server

# Relay domain
relay-domain yourdomain.com

# SMTP listener (local network only)
smtp-listener 0.0.0.0:25

# EmailPro source (allow your EmailPro server)
<source 192.168.100.170>
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

# Allow local network
<source 192.168.1.0/24>
   always-allow-relaying yes
   smtp-service yes
   process-x-virtual-mta true
</source>

<source 0/0>
   always-allow-relaying no
   smtp-service yes
</source>

# Virtual MTA for EmailPro
<virtual-mta emailpro-relay>
    # No smtp-source-host needed - will use relay
</virtual-mta>

# SMTP Relay Configuration - All domains go through provider
<domain *>
    # Relay through provider's SMTP
    smtp-hosts provider-smtp.com:587
    smtp-auth-username YOUR_PROVIDER_USERNAME
    smtp-auth-password YOUR_PROVIDER_PASSWORD
    require-tls yes
    
    # Delivery settings
    retry-after 10m
    bounce-after 4d
    log-transfer-failures yes
    log-connections yes
    max-smtp-out 10
    max-msg-per-connection 100
</domain>

# ISP-specific overrides (if provider supports)
<domain gmail.com>
    smtp-hosts provider-smtp.com:587
    smtp-auth-username YOUR_PROVIDER_USERNAME
    smtp-auth-password YOUR_PROVIDER_PASSWORD
    require-tls yes
    max-smtp-out 5
    max-msg-per-connection 50
</domain>
```

## Provider Examples and Configuration

### Option 1: MailChannels
```
<domain *>
    smtp-hosts smtp.mailchannels.net:587
    smtp-auth-username your-username
    smtp-auth-password your-password
    require-tls yes
</domain>
```

### Option 2: Amazon SES
```
<domain *>
    smtp-hosts email-smtp.us-east-1.amazonaws.com:587
    smtp-auth-username YOUR_SES_USERNAME
    smtp-auth-password YOUR_SES_PASSWORD
    require-tls yes
</domain>
```

### Option 3: Mailgun
```
<domain *>
    smtp-hosts smtp.mailgun.org:587
    smtp-auth-username postmaster@your-domain.mailgun.org
    smtp-auth-password your-api-key
    require-tls yes
</domain>
```

### Option 4: SendGrid
```
<domain *>
    smtp-hosts smtp.sendgrid.net:587
    smtp-auth-username apikey
    smtp-auth-password YOUR_SENDGRID_API_KEY
    require-tls yes
</domain>
```

## VirtualBox VM Setup

### VM Network Configuration
```bash
# Set static IP in VM
sudo vim /etc/sysconfig/network-scripts/ifcfg-enp0s3

# Configuration:
BOOTPROTO=static
IPADDR=192.168.1.100
NETMASK=255.255.255.0
GATEWAY=192.168.1.1
DNS1=8.8.8.8

# Restart network
sudo systemctl restart network
```

### No Port Forwarding Needed
Since PowerMTA only receives from local network and relays outbound, you don't need:
- Port 25 forwarding
- Public IP exposure
- Firewall changes for inbound SMTP

### Optional: Web Interface Access
If you want external access to PowerMTA web interface:
```bash
# Forward port 8081 (optional)
Router: 8081 → 192.168.1.100:8081
```

## EmailPro Integration

### EmailPro Configuration
```bash
# In your EmailPro .env file:
PMTA_ENABLED=true
PMTA_HOST=192.168.1.100  # VM's local IP
PMTA_PORT=25
PMTA_SECURE=false
PMTA_POOL=true
PMTA_MAX_CONNECTIONS=5
```

### Test Connection
```bash
# From EmailPro server (192.168.100.170)
telnet 192.168.1.100 25

# Should connect to PowerMTA on VM
# PowerMTA will relay through provider
```

## Provider Setup Process

### 1. Choose Provider
Research providers that offer:
- SMTP relay services
- Good IP reputation
- PowerMTA compatibility
- Reasonable pricing

### 2. Get Credentials
Provider will give you:
- SMTP hostname (e.g., smtp.provider.com)
- Port (usually 587 or 465)
- Username and password
- TLS/SSL requirements

### 3. Configure DNS
Provider may help with:
- SPF records including their IPs
- DKIM setup through their system
- Domain verification

### 4. Test Setup
```bash
# Test provider connection from VM
telnet provider-smtp.com 587

# Send test email through PowerMTA
echo "Test via relay" | mail -s "Relay Test" test@gmail.com

# Monitor PowerMTA logs
sudo tail -f /var/log/pmta/log
```

## Advantages of This Setup

### No Network Changes Required
✅ No port 25 forwarding needed  
✅ No firewall modifications  
✅ No ISP port 25 blocking issues  
✅ Works behind corporate firewalls  

### Professional Delivery
✅ Clean IP reputation from provider  
✅ Professional SMTP infrastructure  
✅ Built-in bounce handling  
✅ Delivery rate optimization  

### Local Control
✅ Full PowerMTA control and monitoring  
✅ Custom configuration and rules  
✅ Real-time queue management  
✅ Complete logging and analytics  

## Cost Comparison

### Traditional VPS vs VM + Provider
**VPS Approach:**
- VPS: $20-50/month
- Multiple IPs: $3-5/IP/month
- Management: Time-intensive

**VM + Provider Approach:**
- VM: $0 (your hardware)
- Provider relay: $10-30/month
- Management: Simplified

## Troubleshooting

### Common Issues and Solutions

**PowerMTA can't connect to provider:**
```bash
# Test provider connectivity
telnet provider-smtp.com 587

# Check credentials in config
grep smtp-auth /etc/pmta/config
```

**EmailPro can't reach VM:**
```bash
# Test VM connectivity from EmailPro server
telnet 192.168.1.100 25

# Check VM firewall
sudo firewall-cmd --list-ports
```

**Emails stuck in queue:**
```bash
# Check PowerMTA queues
sudo pmta show queues

# Check provider status
sudo tail -f /var/log/pmta/log | grep provider-smtp
```

This setup gives you professional email delivery without requiring port 25 access or complex network configuration!