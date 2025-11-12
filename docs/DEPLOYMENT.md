# ZenAI Deployment Guide

Complete step-by-step guide for deploying ZenAI to production.

## Prerequisites

- Ubuntu 20.04+ server with public IP
- Docker & Docker Compose installed
- Domain name configured
- OpenAI API key
- Sufficient server resources (4GB RAM minimum for single-instance, 8GB+ recommended)

## 1. Server Setup

### 1.1 Install Dependencies

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo apt-get install -y git curl wget nano htop
```

### 1.2 Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow monitoring ports
sudo ufw allow 9090/tcp  # Prometheus
sudo ufw allow 3001/tcp  # Grafana

# Enable firewall
sudo ufw enable
```

### 1.3 Create Application Directory

```bash
# Create app directory
sudo mkdir -p /opt/zenai
sudo chown $USER:$USER /opt/zenai

# Clone repository
cd /opt/zenai
git clone <repository-url> .
```

## 2. SSL Certificate Setup (Let's Encrypt)

### 2.1 Install Certbot

```bash
sudo apt-get install -y certbot

# For standalone verification
sudo apt-get install -y python3-certbot-nginx
```

### 2.2 Generate Certificates

```bash
# Create SSL directory
mkdir -p /opt/zenai/nginx/ssl

# Generate certificate (standalone mode)
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d api.your-domain.com \
  -d monitoring.your-domain.com \
  --email admin@your-domain.com \
  --agree-tos \
  --non-interactive

# Copy certificates to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/zenai/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/zenai/nginx/ssl/key.pem
sudo chown $USER:$USER /opt/zenai/nginx/ssl/*.pem
```

### 2.3 Auto-Renewal Setup

```bash
# Add to crontab
crontab -e

# Add this line to run renewal daily at 2 AM
0 2 * * * certbot renew --quiet && docker-compose -f /opt/zenai/docker-compose.prod.yml restart nginx
```

## 3. Environment Configuration

### 3.1 Generate Secure Secrets

```bash
cd /opt/zenai

# Generate JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
MONGO_PASSWORD=$(openssl rand -base64 32)

# Display for reference
echo "JWT_SECRET: $JWT_SECRET"
echo "JWT_REFRESH_SECRET: $JWT_REFRESH_SECRET"
echo "REDIS_PASSWORD: $REDIS_PASSWORD"
echo "MONGO_PASSWORD: $MONGO_PASSWORD"
```

### 3.2 Create Environment Files

```bash
# Backend .env.production
cat > zenai-backend/.env.production << EOF
NODE_ENV=production
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://zenai:${MONGO_PASSWORD}@mongodb:27017/zenai?authSource=admin
MONGO_USERNAME=zenai
MONGO_PASSWORD=${MONGO_PASSWORD}

# Cache
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# API Keys
OPENAI_API_KEY=sk-your-openai-key-here
PINECONE_API_KEY=your-pinecone-key-here

# CORS
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info

# Email (optional)
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USER=your-email@your-domain.com
SMTP_PASSWORD=your-email-password

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
EOF

# AI Engine .env
cat > zenai-ai-engine/.env << EOF
NODE_ENV=production
OPENAI_API_KEY=sk-your-openai-key-here
PINECONE_API_KEY=your-pinecone-key-here
PINECONE_INDEX_NAME=zenai-documents

# Model configuration
MODEL_NAME=gpt-4
TEMPERATURE=0.7
MAX_TOKENS=2000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
EOF

# Frontend .env.production
cat > zenai-frontend/.env.production << EOF
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com
VITE_APP_NAME=ZenAI
VITE_APP_VERSION=1.0.0
EOF
```

## 4. Docker Compose Configuration

### 4.1 Update docker-compose.prod.yml

```bash
# Edit the file to match your setup
nano docker-compose.prod.yml

# Key things to update:
# - MongoDB credentials
# - Redis password
# - OPENAI_API_KEY
# - GRAFANA_PASSWORD
# - Domain names
```

### 4.2 Update Nginx Configuration

```bash
# Edit nginx config
nano nginx/nginx.conf

# Update:
# - server_name with your domain
# - SSL certificate paths
# - Upstream backend address
```

## 5. Database Setup

### 5.1 Initialize MongoDB

```bash
# Start only MongoDB
docker-compose -f docker-compose.prod.yml up -d mongodb

# Wait for it to be ready
sleep 10

# Initialize database
docker-compose -f docker-compose.prod.yml exec mongodb mongo \
  --username admin \
  --password ${MONGO_PASSWORD} \
  --authenticationDatabase admin \
  /dev/stdin << EOF
use zenai
db.createCollection("users")
db.createCollection("projects")
db.createCollection("tasks")
db.createCollection("chat_messages")
EOF
```

### 5.2 Create Database Indexes

```bash
# Create indexes for performance
docker-compose -f docker-compose.prod.yml exec mongodb mongo \
  --username admin \
  --password ${MONGO_PASSWORD} \
  --authenticationDatabase admin \
  --eval "
    db.users.createIndex({email: 1}, {unique: true});
    db.users.createIndex({createdAt: 1});
    db.projects.createIndex({owner: 1});
    db.projects.createIndex({createdAt: -1});
    db.tasks.createIndex({project: 1});
    db.tasks.createIndex({status: 1});
    db.chat_messages.createIndex({user: 1, createdAt: -1});
  "
```

## 6. Application Deployment

### 6.1 Build Docker Images

```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# This may take 5-10 minutes
```

### 6.2 Start All Services

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
sleep 30

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### 6.3 Run Database Migrations

```bash
# Apply migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Seed initial data (optional)
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

## 7. Verification & Health Checks

### 7.1 Check Service Health

```bash
# Health check endpoint
curl https://your-domain.com/health

# Expected response:
# {"status":"healthy","timestamp":"...","uptime":...,"environment":"production"}

# Backend health
curl https://api.your-domain.com/health

# Prometheus
curl http://localhost:9090/-/healthy

# Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
# Expected: PONG
```

### 7.2 Verify All Containers

```bash
# List all containers
docker-compose -f docker-compose.prod.yml ps

# Should show all containers as "Up"

# Check specific container
docker-compose -f docker-compose.prod.yml logs backend | tail -20
docker-compose -f docker-compose.prod.yml logs nginx | tail -20
```

## 8. Monitoring Setup

### 8.1 Access Dashboards

```bash
# Grafana
http://your-server-ip:3001
Username: admin
Password: (from GRAFANA_PASSWORD in .env)

# Prometheus
http://your-server-ip:9090

# Backend Health
https://api.your-domain.com/health
```

### 8.2 Configure Alerts (Optional)

```bash
# Edit Prometheus configuration
nano monitoring/prometheus.yml

# Add alert rules for:
# - High error rate (>5%)
# - High latency (>500ms)
# - Database connection issues
# - Low disk space
```

## 9. Backup Configuration

### 9.1 Setup Automated Backups

```bash
# Create backup script
nano /opt/zenai/scripts/backup.sh

# Make executable
chmod +x /opt/zenai/scripts/backup.sh

# Add to crontab for daily backups at 1 AM
crontab -e

# Add:
0 1 * * * /opt/zenai/scripts/backup.sh >> /opt/zenai/logs/backup.log 2>&1
```

### 9.2 Test Backup/Restore

```bash
# Create test backup
bash scripts/backup.sh

# Verify backup created
ls -lh backups/

# Test restore procedure
bash scripts/restore.sh backups/backup_latest.tar.gz
```

## 10. Post-Deployment Tasks

### 10.1 Create Initial Admin User

```bash
# Access backend container
docker-compose -f docker-compose.prod.yml exec backend node

# Run:
const User = require('./src/models/User.model');
const user = await User.create({
  name: 'Admin',
  email: 'admin@your-domain.com',
  password: 'secure-password-change-this',
  role: 'admin'
});
console.log('Admin created:', user._id);
```

### 10.2 Configure Email Notifications (Optional)

```bash
# Update SMTP settings in .env.production
# Test email sending:
docker-compose -f docker-compose.prod.yml exec backend npm test:email
```

### 10.3 Setup Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/zenai

# Add:
/opt/zenai/zenai-backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $(id -u) $(id -g)
    postrotate
        docker-compose -f /opt/zenai/docker-compose.prod.yml exec backend npm run logs:rotate
    endscript
}
```

## 11. Performance Tuning

### 11.1 Optimize MongoDB

```bash
# Connect to MongoDB
docker-compose -f docker-compose.prod.yml exec mongodb mongo

# Run profiling
db.setProfilingLevel(1, { slowms: 100 })

# Check slow queries
db.system.profile.find({ millis: { $gt: 100 } }).limit(10).pretty()
```

### 11.2 Redis Optimization

```bash
# Monitor Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli monitor

# Check memory usage
docker-compose -f docker-compose.prod.yml exec redis redis-cli info memory
```

### 11.3 Nginx Caching

```bash
# Verify caching is working
curl -I https://api.your-domain.com/api/v1/projects
# Look for: X-Cache-Status header

# Check cache hit ratio in Prometheus
```

## 12. Scaling (Optional)

### 12.1 Horizontal Scaling

```bash
# Scale backend to 3 replicas
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Verify
docker-compose -f docker-compose.prod.yml ps | grep backend
```

### 12.2 Database Replication (Production)

```bash
# For high-availability, setup MongoDB replica set
# This requires multiple servers - see MongoDB documentation
```

## 13. Security Hardening

### 13.1 Update Docker Registry Credentials

```bash
# Create Docker registry secret
docker login

# For automated pulls, add to compose file
```

### 13.2 Implement WAF (Optional)

```bash
# Install ModSecurity for Nginx
# Setup CloudFlare or AWS WAF for additional protection
```

### 13.3 Security Audit

```bash
# Run security checks
docker run --rm -v /opt/zenai:/workspace aquasec/trivy fs /workspace

# Fix any vulnerabilities
npm audit fix
```

## 14. Monitoring & Maintenance

### 14.1 Regular Health Checks

```bash
# Create monitoring script
cat > /opt/zenai/scripts/health-check.sh << 'EOF'
#!/bin/bash
curl -f https://your-domain.com/health || exit 1
curl -f https://api.your-domain.com/health || exit 1
echo "All services healthy"
EOF

# Make executable and add to crontab
chmod +x /opt/zenai/scripts/health-check.sh
crontab -e
# Add: */5 * * * * /opt/zenai/scripts/health-check.sh
```

### 14.2 Log Monitoring

```bash
# View logs in real-time
docker-compose -f docker-compose.prod.yml logs -f backend

# Search logs
docker-compose -f docker-compose.prod.yml logs backend | grep ERROR

# Export logs
docker-compose -f docker-compose.prod.yml logs backend > backend-logs.txt
```

## Troubleshooting

### Services not starting
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Full restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### SSL certificate issues
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Renew certificate
sudo certbot renew --force-renewal

# Copy new cert
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
```

### High memory usage
```bash
# Check container memory
docker stats

# Restart service with memory limit
docker-compose -f docker-compose.prod.yml up -d --scale backend=1
```

## Rollback Procedure

```bash
# Save current deployment
docker-compose -f docker-compose.prod.yml up -d

# Keep backups of:
# - Docker images
# - Database backups
# - Configuration files

# To rollback:
# 1. Restore database from backup
bash scripts/restore.sh backups/backup_rollback_point.tar.gz

# 2. Restart services
docker-compose -f docker-compose.prod.yml restart
```

## Production Checklist

Before going live:
- [ ] SSL certificate installed and auto-renewal configured
- [ ] Database backups automated and tested
- [ ] Monitoring dashboards configured
- [ ] Alert notifications setup
- [ ] Log aggregation configured
- [ ] Rate limiting tested
- [ ] Security audit completed
- [ ] Performance baseline established
- [ ] Disaster recovery plan documented
- [ ] Team trained on deployment

## Support & Maintenance

For support:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Review metrics in Prometheus/Grafana
3. Contact development team with error details

---

**Last Updated**: November 12, 2025
**Version**: 1.0.0
