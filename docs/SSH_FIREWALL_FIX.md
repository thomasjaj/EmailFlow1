# SSH Firewall Fix - Safe Commands

## Current Situation
Your EmailPro server is running fine (web app loads), but SSH/PuTTY connection is blocked. This is likely a firewall issue.

## Safe SSH Firewall Commands

These commands only affect SSH access and won't change anything else:

### Method 1: Allow SSH (Most Common Fix)
```bash
# Allow SSH through firewall (port 22)
sudo ufw allow ssh

# Alternative command (same result):
sudo ufw allow 22/tcp
```

### Method 2: Check Current Firewall Status
```bash
# See what's currently allowed
sudo ufw status numbered

# See if SSH is blocked
sudo ufw status | grep -i ssh
```

### Method 3: Allow SSH from Specific Network Only (More Secure)
```bash
# Allow SSH only from your local network
sudo ufw allow from 192.168.0.0/16 to any port 22

# Or allow from specific IP only
sudo ufw allow from YOUR_CLIENT_IP to any port 22
```

## If SSH Service is Stopped

```bash
# Start SSH service
sudo systemctl start ssh

# Enable SSH to start automatically on boot
sudo systemctl enable ssh

# Check SSH service status
sudo systemctl status ssh
```

## Complete SSH Fix Command (One Line)
```bash
# This single command fixes most SSH issues safely:
sudo systemctl start ssh && sudo systemctl enable ssh && sudo ufw allow ssh
```

## Verify SSH is Working
```bash
# Check if SSH is listening on port 22
sudo netstat -tlnp | grep :22

# Or using ss command:
sudo ss -tlnp | grep :22
```

## How to Access Server to Run These Commands

Since your web app works, you might access the server through:

1. **Physical console** (keyboard/monitor connected to server)
2. **Web console** (if your hosting provider offers one)
3. **Recovery mode** (boot from USB/CD)
4. **IPMI/KVM** interface (if available)

## Safe Rollback (If Something Goes Wrong)

If you need to undo firewall changes:
```bash
# Remove SSH rule
sudo ufw delete allow ssh

# Reset firewall completely (nuclear option)
sudo ufw --force reset
```

## What These Commands Do

- `ufw allow ssh` - Opens port 22 for SSH connections
- `systemctl start ssh` - Starts the SSH service
- `systemctl enable ssh` - Makes SSH start automatically on boot
- **No other services or settings are modified**

These are the safest, most targeted commands to restore SSH access without affecting your EmailPro application or any other server settings.