# PowerMTA VirtualBox Setup with External IP Provider

This guide shows how to install PowerMTA on a VirtualBox VM and route it through external IP providers for professional email delivery.

## Architecture Overview

```
Internet → IP Provider → Router/Firewall → VirtualBox VM (PowerMTA) → EmailPro
```

**Benefits:**
- Local control of PowerMTA server
- Use professional IP providers (clean reputation)
- Cost-effective compared to dedicated servers
- Easy to backup and migrate
- Full control over configuration

## Step 1: VirtualBox VM Setup

### VM Specifications
- **OS**: CentOS 7/8 or Ubuntu Server 18.04+
- **RAM**: 4GB minimum (8GB recommended)
- **CPU**: 2+ cores
- **Storage**: 50GB+ virtual disk
- **Network**: Bridged adapter (to get real IP)

### Create VM
1. **Download ISO**: CentOS 7 or Ubuntu Server
2. **Create VM**:
   - Type: Linux
   - Memory: 4096MB
   - Create virtual hard disk: 50GB
   - Network: Bridged Adapter

3. **Install OS** with minimal/server installation
4. **Configure static IP** on your local network

### Network Configuration
```bash
# Set static IP on VM (example for CentOS)
sudo vim /etc/sysconfig/network-scripts/ifcfg-enp0s3

# Add:
BOOTPROTO=static
IPADDR=192.168.1.100  # Your local IP for VM
NETMASK=255.255.255.0
GATEWAY=192.168.1.1   # Your router IP
DNS1=8.8.8.8
DNS2=1.1.1.1

# Restart network
sudo systemctl restart network
```

## Step 2: IP Provider Integration

### Popular IP Providers for Email
1. **Sendblaster** - Dedicated IPs for PowerMTA
2. **MailChannels** - SMTP relay service
3. **Amazon SES** - Professional sending IPs
4. **Mailgun** - Dedicated IP pools
5. **SparkPost** - Enterprise IP management

### Option A: Dedicated IP Provider (Recommended)
```bash
# Your PowerMTA will use provider's IPs directly
# Provider gives you: IP addresses, SMTP credentials, DNS setup
```

### Option B: VPN/Proxy Provider
```bash
# Route PowerMTA traffic through provider's IPs
# Providers: NordLayer, ExpressVPN Business, etc.
```

### Option C: Cloud Tunnel (Advanced)
```bash
# Use cloud tunneling services
# Examples: ngrok, CloudFlare Tunnel, etc.
```

## Step 3: PowerMTA Installation on VM

### Upload Your PowerMTA Files
```bash
# Copy files to VM (from host machine)
scp PowerMTA-4.0r6-201204021809.x86_64.rpm user@192.168.1.100:~/
scp license user@192.168.1.100:~/
scp config user@192.168.1.100:~/
scp script.sh user@192.168.1.100:~/
scp yassin.sh user@192.168.1.100:~/
```

### Install PowerMTA
```bash
# SSH into VM
ssh user@192.168.1.100

# Install PowerMTA using your files
sudo yum update -y
sudo yum install -y httpd perl nmap telnet

# Install PowerMTA
sudo rpm -ivh PowerMTA-4.0r6-201204021809.x86_64.rpm

# Copy license
sudo cp license /etc/pmta/
sudo chown pmta:pmta /etc/pmta/license

# Run setup script
chmod +x yassin.sh
sudo ./yassin.sh
```

## Step 4: PowerMTA Configuration for External IPs

### Basic Configuration Template
```bash
sudo vim /etc/pmta/config
```

**Configuration for IP Provider:**
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

# HTTP management interface
http-mgmt-port 8081
http-access 192.168.1.0/24 admin  # Allow local network
http-access YOUR_EMAILPRO_SERVER_IP admin

# Relay domain
relay-domain yourdomain.com

# SMTP listeners
smtp-listener 0.0.0.0:25
smtp-listener 0.0.0.0:587

# EmailPro source (allow your EmailPro server)
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

# Allow local network for testing
<source 192.168.1.0/24>
   always-allow-relaying yes
   smtp-service yes
   process-x-virtual-mta true
   log-connections yes
</source>

<source 0/0>
   always-allow-relaying no
   smtp-service yes
   log-connections yes
</source>

# Virtual MTAs using external IPs
<virtual-mta emailpro-main>
    smtp-source-host EXTERNAL_IP_1  # From your IP provider
    host-name mail.yourdomain.com
</virtual-mta>

<virtual-mta emailpro-backup>
    smtp-source-host EXTERNAL_IP_2  # Backup IP
    host-name mail.yourdomain.com
</virtual-mta>

# Conservative domain settings
<domain gmail.com>
    dk-sign no
    dkim-sign yes
    retry-after 15m
    bounce-after 24h
    log-transfer-failures yes
    log-connections yes
    max-smtp-out 3
    max-msg-per-connection 25
</domain>

<domain outlook.com>
    dk-sign no
    dkim-sign yes
    retry-after 15m
    bounce-after 24h
    log-transfer-failures yes
    log-connections yes
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
    max-smtp-out 5
    max-msg-per-connection 50
</domain>
```

### Set Permissions and Start
```bash
sudo chown pmta:pmta /etc/pmta/config
sudo chmod 640 /etc/pmta/config

# Start services
sudo systemctl enable pmta
sudo systemctl start pmta
sudo systemctl enable pmtahttp
sudo systemctl start pmtahttp

# Check status
sudo pmta show status
```

## Step 5: IP Provider Configuration

### Option A: Direct IP Assignment
```bash
# Your IP provider gives you dedicated IPs
# Update PowerMTA config with these IPs:
smtp-source-host PROVIDER_IP_1
smtp-source-host PROVIDER_IP_2
```

### Option B: SMTP Relay Provider
```bash
# Provider gives you SMTP credentials
# Configure PowerMTA to relay through provider:

<domain *>
    smtp-hosts provider-smtp.com:587
    smtp-auth-username your-username
    smtp-auth-password your-password
    require-tls yes
</domain>
```

### Option C: VPN Setup for IP Routing
```bash
# Install VPN client on VM
sudo yum install -y openvpn

# Connect to provider's VPN
sudo openvpn --config provider.ovpn

# Verify external IP
curl ifconfig.me
```

## Step 6: Router/Firewall Configuration

### Port Forwarding (if needed)
Forward these ports from router to VM:
- **25 (SMTP)** → VM:25
- **587 (SMTP-TLS)** → VM:587
- **8081 (Web UI)** → VM:8081

### Firewall on VM
```bash
# Open required ports
sudo firewall-cmd --permanent --add-port=25/tcp
sudo firewall-cmd --permanent --add-port=587/tcp
sudo firewall-cmd --permanent --add-port=8081/tcp
sudo firewall-cmd --reload
```

## Step 7: DNS Configuration

### Provider DNS Setup
Your IP provider will help set up:
```
# A Records (using provider's IPs)
mail.yourdomain.com     A      PROVIDER_IP_1

# MX Record
yourdomain.com          MX 10  mail.yourdomain.com

# SPF Record (include provider IPs)
yourdomain.com          TXT    "v=spf1 ip4:PROVIDER_IP_1 ip4:PROVIDER_IP_2 ~all"

# Reverse DNS (provider sets this)
PROVIDER_IP_1.in-addr.arpa  PTR  mail.yourdomain.com
```

## Step 8: EmailPro Integration

### Update EmailPro Configuration
```bash
# In your EmailPro .env file:
PMTA_ENABLED=true
PMTA_HOST=192.168.1.100  # VM's local IP
PMTA_PORT=25
PMTA_WEB_MONITOR=http://192.168.1.100:8081
```

### Test Connection
```bash
# From EmailPro server, test VM connectivity
telnet 192.168.1.100 25

# Should connect to PowerMTA on VM
```

## Step 9: Testing and Monitoring

### Test Email Sending
```bash
# SSH into VM
ssh user@192.168.1.100

# Send test email
echo "Test from VM PowerMTA" | mail -s "VM Test" test@gmail.com

# Monitor queues
sudo pmta show queues

# Check logs
sudo tail -f /var/log/pmta/log
```

### Web Interface Access
- **Local**: http://192.168.1.100:8081
- **External**: http://YOUR_PUBLIC_IP:8081 (if port forwarded)

## Benefits of VM Setup

### Advantages
✅ **Cost Effective** - No monthly VPS costs  
✅ **Local Control** - Full access to PowerMTA  
✅ **Easy Backup** - VM snapshots  
✅ **Professional IPs** - Through IP providers  
✅ **Scalable** - Add more VMs as needed  

### Considerations
⚠️ **Internet Dependency** - Requires stable connection  
⚠️ **IP Provider Costs** - Monthly fees for professional IPs  
⚠️ **Power Requirements** - VM must stay running  

## Recommended IP Providers

### For PowerMTA Integration
1. **Sendblaster** - PowerMTA specialists
2. **MailChannels** - Enterprise SMTP
3. **Amazon SES** - AWS integration
4. **Mailgun** - Dedicated IPs available

### Getting Started
1. **Contact IP provider** for PowerMTA-compatible service
2. **Get dedicated IPs** and DNS setup assistance
3. **Configure PowerMTA** with provider's specifications
4. **Test thoroughly** before production use

This VM setup gives you the best of both worlds - local PowerMTA control with professional sending infrastructure!