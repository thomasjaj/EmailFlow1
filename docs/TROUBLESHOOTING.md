# EmailPro Troubleshooting Guide

## Server Connection Issues

### SSH/PuTTY Connection Problems

**Common Causes:**
1. **Server is down or unreachable**
2. **IP address changed (DHCP reassignment)**
3. **Firewall blocking SSH**
4. **SSH service not running**
5. **Network connectivity issues**

**Troubleshooting Steps:**

1. **Check if server is reachable**
   ```bash
   ping 192.168.100.170
   ```

2. **Try connecting from same network**
   - Ensure you're on the same network as the server
   - Check if other devices can reach the server

3. **Verify SSH service on server (if you have console access)**
   ```bash
   sudo systemctl status ssh
   sudo systemctl start ssh
   sudo systemctl enable ssh
   ```

4. **Check firewall settings**
   ```bash
   sudo ufw status
   sudo ufw allow ssh
   sudo ufw allow 22/tcp
   ```

5. **Verify IP address hasn't changed**
   ```bash
   ip addr show
   hostname -I
   ```

### Web Application Not Loading

**Common Causes:**
1. **PM2 process stopped**
2. **Port 3000 blocked by firewall**
3. **Database connection issues**
4. **Application crashed**

**Troubleshooting Steps:**

1. **Check PM2 process status**
   ```bash
   pm2 status
   pm2 logs emailpro
   ```

2. **Restart EmailPro application**
   ```bash
   pm2 restart emailpro
   # Or if it's stopped:
   pm2 start emailpro
   ```

3. **Check firewall for port 3000**
   ```bash
   sudo ufw status numbered
   sudo ufw allow 3000/tcp
   sudo ufw allow from 192.168.0.0/16 to any port 3000
   ```

4. **Check if port is listening**
   ```bash
   sudo netstat -tlnp | grep :3000
   sudo ss -tlnp | grep :3000
   ```

5. **Test database connection**
   ```bash
   sudo -u postgres psql -c "\l" | grep emailpro
   ```

## Quick Recovery Commands

If you can get console access to your server, run these commands:

```bash
# Check system status
sudo systemctl status ssh
sudo systemctl status postgresql
pm2 status

# Restart services
sudo systemctl restart ssh
sudo systemctl restart postgresql
pm2 restart all

# Check network
ip addr show
ping 8.8.8.8

# Check logs
journalctl -u ssh -f
pm2 logs
tail -f /var/log/syslog
```

## Emergency Access Methods

1. **Physical console access** (if server is local)
2. **IPMI/iLO interface** (if server has it)
3. **VNC/KVM access** (if configured)
4. **Router admin panel** to check DHCP assignments

## Prevention

1. **Set static IP address**
   ```bash
   # Edit netplan configuration
   sudo nano /etc/netplan/00-installer-config.yaml
   ```

2. **Enable automatic startup**
   ```bash
   sudo systemctl enable ssh
   sudo systemctl enable postgresql
   pm2 startup
   pm2 save
   ```

3. **Monitor services**
   ```bash
   # Create monitoring script
   #!/bin/bash
   pm2 ping
   if [ $? -ne 0 ]; then
       pm2 resurrect
   fi
   ```