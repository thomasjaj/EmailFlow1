# EmailPro Deployment Guide

This guide covers deploying EmailPro on production servers with different configurations.

## Ubuntu 24.04 Deployment

### Prerequisites
- Ubuntu 24.04 LTS server
- Node.js 20.x
- PostgreSQL 16
- PM2 process manager
- UFW firewall

### Installation Steps

1. **Update system and install dependencies**
   ```bash
   sudo apt update && sudo apt upgrade -y
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql postgresql-contrib
   ```

2. **Set up PostgreSQL database**
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   
   # Create database and user
   sudo -u postgres psql << EOF
   CREATE USER emailpro WITH PASSWORD 'your_secure_password';
   CREATE DATABASE emailpro OWNER emailpro;
   GRANT ALL PRIVILEGES ON DATABASE emailpro TO emailpro;
   \q
   EOF
   ```

3. **Clone and configure application**
   ```bash
   git clone https://github.com/yourusername/emailpro.git
   cd emailpro
   npm install
   npm run build
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Set up PM2 and start application**
   ```bash
   npm install -g pm2
   pm2 start npm --name "emailpro" -- start
   pm2 startup
   pm2 save
   ```

5. **Configure firewall**
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw allow from 192.168.0.0/16 to any port 3000
   sudo ufw enable
   ```

## PowerMTA Integration

For high-volume email delivery, integrate with PowerMTA:

### PowerMTA Server Setup
1. Install PowerMTA on separate server
2. Configure virtual MTAs and IP addresses
3. Set up DKIM signing
4. Configure bounce and feedback loop handling

### EmailPro Configuration
Update your `.env` file:
```bash
# PowerMTA settings
PMTA_HOST=your-pmta-server-ip
PMTA_PORT=25
PMTA_WEB_MONITOR=http://your-pmta-server-ip:8080
USE_PMTA=true
```

Detailed PowerMTA setup instructions are in `POWERMTA_INTEGRATION.md`.

## SSL/TLS Configuration

For production, set up SSL certificates:

```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure nginx proxy (optional)
sudo apt install nginx
# Configure nginx with SSL termination
```

## Monitoring and Maintenance

### Log Management
```bash
# View application logs
pm2 logs emailpro

# Rotate logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Database Backups
```bash
# Create backup script
#!/bin/bash
pg_dump -h localhost -U emailpro emailpro > /backup/emailpro_$(date +%Y%m%d_%H%M%S).sql
```

### Performance Monitoring
- Monitor memory usage with `pm2 monit`
- Set up alerts for high CPU/memory usage
- Monitor PostgreSQL performance
- Track email delivery rates and bounce rates

## Scaling

### Horizontal Scaling
- Deploy multiple application instances
- Use nginx load balancer
- Separate database server

### Database Scaling
- Set up PostgreSQL replicas
- Use connection pooling
- Optimize queries and indexes

## Security Best Practices

1. **Server Security**
   - Keep system updated
   - Use SSH key authentication
   - Configure fail2ban
   - Regular security audits

2. **Application Security**
   - Use environment variables for secrets
   - Enable HTTPS
   - Implement rate limiting
   - Regular dependency updates

3. **Database Security**
   - Use strong passwords
   - Restrict database access
   - Enable SSL connections
   - Regular backups

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Check PM2 logs: `pm2 logs emailpro`
   - Verify environment variables
   - Check database connectivity

2. **Database connection errors**
   - Verify PostgreSQL is running
   - Check connection string
   - Ensure database user permissions

3. **Email delivery issues**
   - Check SMTP settings
   - Verify PowerMTA configuration
   - Review bounce handling

4. **Performance issues**
   - Monitor resource usage
   - Check database query performance
   - Review application logs

### Log Locations
- Application logs: `~/.pm2/logs/`
- PostgreSQL logs: `/var/log/postgresql/`
- System logs: `/var/log/syslog`

For additional support, check the main project documentation or create an issue in the GitHub repository.