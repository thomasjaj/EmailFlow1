# SSH/PuTTY Access Troubleshooting

## Quick SSH Fixes

Since your EmailPro web application is working (port 3000), your server is running fine. The SSH issue is likely one of these common problems:

### 1. SSH Service Not Running
```bash
# If you have any console access, run:
sudo systemctl status ssh
sudo systemctl start ssh
sudo systemctl enable ssh
```

### 2. Firewall Blocking SSH
```bash
# Allow SSH through firewall:
sudo ufw allow ssh
sudo ufw allow 22/tcp
sudo ufw status
```

### 3. SSH Configuration Issue
```bash
# Check SSH config:
sudo nano /etc/ssh/sshd_config

# Ensure these settings:
Port 22
PermitRootLogin yes  # or no, depending on your preference
PasswordAuthentication yes
PubkeyAuthentication yes

# Restart SSH after changes:
sudo systemctl restart ssh
```

## Alternative Access Methods

### Method 1: Web-based Terminal
If you have a web management panel or console access through your hosting provider.

### Method 2: Different SSH Client
Try a different SSH client:
- **Windows**: Try built-in SSH client
  ```cmd
  ssh username@192.168.100.170
  ```
- **Alternative**: Try MobaXterm or Termius

### Method 3: Different Port
Your SSH might be running on a different port:
```bash
# Try common alternative ports:
ssh -p 2222 username@192.168.100.170
ssh -p 22022 username@192.168.100.170
```

## PuTTY Specific Issues

### Connection Settings
- **Host Name**: 192.168.100.170
- **Port**: 22
- **Connection Type**: SSH

### Common PuTTY Errors:
1. **"Connection refused"** → SSH service not running
2. **"Network error: Connection timed out"** → Firewall blocking
3. **"Server unexpectedly closed connection"** → SSH config issue

## Quick Recovery Commands

If you can get temporary access through any method:

```bash
# Fix SSH in one go:
sudo systemctl enable ssh
sudo systemctl start ssh
sudo ufw allow ssh
sudo systemctl status ssh

# Check if SSH is listening:
sudo netstat -tlnp | grep :22
```