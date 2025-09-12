# EmailPro Server Installation Guide

## What You Need
1. Fresh Ubuntu 24.04 server
2. SSH access (PuTTY)
3. File transfer access (WinSCP)
4. The `emailpro-server.tar.gz` file (download from this project)

## Installation Steps

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

### 3. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Setup Database
```bash
sudo -u postgres psql -c "CREATE DATABASE emailpro;"
sudo -u postgres psql -c "CREATE USER emailpro WITH ENCRYPTED PASSWORD 'EmailPro2025!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE emailpro TO emailpro;"
```

### 5. Install PM2
```bash
sudo npm install -g pm2
```

### 6. Create App Directory
```bash
sudo mkdir -p /opt/emailpro
sudo chown $USER:$USER /opt/emailpro
```

### 7. Upload Files
Use WinSCP to upload `emailpro-server.tar.gz` to `/opt/emailpro/`

### 8. Extract and Install
```bash
cd /opt/emailpro
tar -xzf emailpro-server.tar.gz
npm install
```

### 9. Setup Environment
```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://emailpro:EmailPro2025!@localhost:5432/emailpro
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
SESSION_SECRET=your-super-secret-session-key-here
EOF
```

### 10. Create Database Tables
```bash
PGPASSWORD=EmailPro2025! psql -U emailpro -h localhost -d emailpro -f setup-database.sql
```

### 11. Build and Start
```bash
npm run build
pm2 start npm --name "emailpro" -- start
pm2 save
pm2 startup
```

### 12. Open Firewall
```bash
sudo ufw allow 5000/tcp
sudo ufw enable
```

### 13. Test
```bash
curl http://localhost:5000
```

Access your EmailPro at: `http://YOUR_SERVER_IP:5000`

## Troubleshooting
- Check logs: `pm2 logs emailpro`
- Restart app: `pm2 restart emailpro`
- Check database: `PGPASSWORD=EmailPro2025! psql -U emailpro -h localhost -d emailpro -c "\dt"`