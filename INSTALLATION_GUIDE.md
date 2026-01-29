# EmailPro - Automated Installation Guide

## Quick Installation on CentOS 10

This guide provides a one-command installation for EmailPro on a minimal CentOS 10 server.

### Prerequisites

- Fresh CentOS 10 minimal installation
- Root access
- Internet connection

### One-Command Installation

```bash
curl -fsSL https://raw.githubusercontent.com/thomasjaj/EmailFlow1/main/install-centos10.sh | sudo bash
```

Or download and run manually:

```bash
wget https://raw.githubusercontent.com/thomasjaj/EmailFlow1/main/install-centos10.sh
chmod +x install-centos10.sh
sudo ./install-centos10.sh
```

### What the Script Does

The installation script automatically:

1. ✅ Updates system packages
2. ✅ Installs Node.js 20.x
3. ✅ Installs and configures PostgreSQL 15
4. ✅ Creates database and user
5. ✅ Clones the EmailPro repository
6. ✅ Installs all dependencies
7. ✅ Configures environment variables
8. ✅ Initializes database schema
9. ✅ Builds the application
10. ✅ Creates and starts systemd service
11. ✅ Configures firewall rules

### Installation Process

During installation, you'll be prompted for:

- **Domain/IP**: The domain or IP address for your installation (default: localhost)
- **Port**: The port to run EmailPro on (default: 5000)
- **Database Name**: PostgreSQL database name (default: emailpro)
- **Database User**: PostgreSQL username (default: emailpro)
- **Database Password**: PostgreSQL password (auto-generated if left empty)
- **Session Secret**: Session encryption key (auto-generated if left empty)

### Post-Installation

After successful installation:

1. **Access the Application**:
   ```
   http://your-server-ip:5000
   ```

2. **View Logs**:
   ```bash
   journalctl -u emailpro -f
   ```

3. **Service Management**:
   ```bash
   systemctl status emailpro   # Check status
   systemctl restart emailpro  # Restart service
   systemctl stop emailpro     # Stop service
   systemctl start emailpro    # Start service
   ```

4. **Database Access**:
   ```bash
   psql -U emailpro -d emailpro
   ```

### Configuration Files

- **Application**: `/var/www/emailpro`
- **Environment**: `/var/www/emailpro/.env`
- **Service**: `/etc/systemd/system/emailpro.service`
- **Logs**: `journalctl -u emailpro`

### Firewall Configuration

The script automatically configures firewalld. If you're using a different firewall:

```bash
# For iptables
iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
iptables-save > /etc/sysconfig/iptables

# For UFW
ufw allow 5000/tcp
```

### SSL/HTTPS Setup (Optional)

To add SSL/HTTPS, install nginx as a reverse proxy:

```bash
dnf install -y nginx certbot python3-certbot-nginx

# Configure nginx
cat > /etc/nginx/conf.d/emailpro.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

systemctl enable nginx
systemctl start nginx

# Get SSL certificate
certbot --nginx -d your-domain.com
```

### Troubleshooting

#### Service won't start
```bash
journalctl -u emailpro -n 100 --no-pager
systemctl status emailpro
```

#### Database connection issues
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test database connection
psql -U emailpro -d emailpro -h localhost

# Check pg_hba.conf
cat /var/lib/pgsql/data/pg_hba.conf
```

#### Port already in use
```bash
# Find process using port 5000
lsof -i :5000

# Change port in .env file
nano /var/www/emailpro/.env
systemctl restart emailpro
```

#### Build fails
```bash
cd /var/www/emailpro
npm install
npm run build
```

### Manual Installation

If you prefer manual installation, see [MANUAL_INSTALLATION.md](MANUAL_INSTALLATION.md)

### Updating EmailPro

To update to the latest version:

```bash
cd /var/www/emailpro
systemctl stop emailpro
git pull origin main
npm install
npm run build
systemctl start emailpro
```

### Backup and Restore

#### Backup Database
```bash
pg_dump -U emailpro emailpro > emailpro_backup_$(date +%Y%m%d).sql
```

#### Restore Database
```bash
psql -U emailpro -d emailpro < emailpro_backup_20260129.sql
```

#### Backup Application Files
```bash
tar -czf emailpro_files_$(date +%Y%m%d).tar.gz /var/www/emailpro
```

### Uninstallation

To completely remove EmailPro:

```bash
systemctl stop emailpro
systemctl disable emailpro
rm /etc/systemd/system/emailpro.service
systemctl daemon-reload
rm -rf /var/www/emailpro
sudo -u postgres psql -c "DROP DATABASE emailpro;"
sudo -u postgres psql -c "DROP USER emailpro;"
```

### Support

- **GitHub Issues**: https://github.com/thomasjaj/EmailFlow1/issues
- **Documentation**: Check the `/docs` folder in the repository

### Security Recommendations

1. ✅ Change default passwords immediately
2. ✅ Use strong session secrets
3. ✅ Keep the system updated: `dnf update -y`
4. ✅ Configure firewall properly
5. ✅ Use SSL/HTTPS in production
6. ✅ Regular database backups
7. ✅ Restrict PostgreSQL access to localhost
8. ✅ Run as non-root user (recommended)

### Performance Tuning

For high-volume installations:

1. **PostgreSQL**:
   ```bash
   # Edit /var/lib/pgsql/data/postgresql.conf
   shared_buffers = 256MB
   effective_cache_size = 1GB
   work_mem = 4MB
   ```

2. **Node.js**:
   ```bash
   # Increase Node.js memory limit in service file
   Environment=NODE_OPTIONS=--max-old-space-size=4096
   ```

3. **Use PM2** (alternative to systemd):
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name emailpro
   pm2 startup
   pm2 save
   ```

---

**License**: See [LICENSE](LICENSE) file
**Version**: 1.0.0 Production Ready
