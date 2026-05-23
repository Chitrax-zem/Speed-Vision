# Deployment Guide

This guide covers deploying the Vehicle Detection & Speed Tracking Platform to production environments using Docker, Docker Compose, and Nginx.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Docker Production Deployment](#docker-production-deployment)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Redis Configuration](#redis-configuration)
- [Nginx Configuration](#nginx-configuration)
- [Scaling Strategy](#scaling-strategy)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| CPU | 2 cores | 8 cores (for YOLOv8 inference) |
| RAM | 4 GB | 16 GB |
| Storage | 20 GB | 100 GB SSD (for video storage) |
| GPU | None | NVIDIA GPU with CUDA (for YOLOv8 acceleration) |

### Software Requirements

- Docker Engine 24.0+
- Docker Compose 2.20+
- Git 2.40+
- OpenSSL (for SSL certificate generation)

### Network Requirements

- Port 80 (HTTP) and 443 (HTTPS) exposed for web access
- Outbound internet access for Docker image pulls
- RTSP stream accessibility if processing live camera feeds

---

## Docker Production Deployment

### Step 1: Prepare the Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify installations
docker --version
docker compose version
```

### Step 2: Clone and Configure

```bash
# Clone the repository
git clone https://github.com/your-org/vehicle-speed-tracking.git
cd vehicle-speed-tracking

# Copy the environment template
cp backend/.env.example backend/.env

# Generate a secure JWT secret
openssl rand -hex 32
# Paste the output as JWT_SECRET in backend/.env

# Edit the environment file
nano backend/.env
```

### Step 3: Configure Production Environment

Edit `backend/.env` with production values:

```env
# Application
APP_NAME="VSTrack - Vehicle Speed Tracking"
APP_VERSION=1.0.0
DEBUG=false
API_PREFIX=/api/v1

# Server
HOST=0.0.0.0
PORT=8000

# Database - Use strong passwords in production
DATABASE_URL=postgresql+asyncpg://vstrack:STRONG_DB_PASSWORD@db:5432/vstrack_db

# Redis
REDIS_URL=redis://redis:6379/0

# JWT - Use the generated secret
JWT_SECRET=your-generated-secret-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS - Restrict to your domain
CORS_ORIGINS=["https://your-domain.com"]

# Detection
DETECTION_MODEL=yolov8n
DETECTION_CONFIDENCE=0.5
TRACKER_MAX_FRAMES_MISSING=30
SPEED_SMOOTHING_WINDOW=5

# Speed Estimation
DEFAULT_PIXELS_PER_METER=10.0
DEFAULT_SPEED_LIMIT_KMH=60.0
MIN_SPEED_KMH=5.0

# File Storage
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=500
```

### Step 4: Build and Deploy

```bash
# Build all Docker images
docker compose build

# Start all services in detached mode
docker compose up -d

# Verify all containers are running
docker compose ps

# Expected output:
# NAME                STATUS          PORTS
# vstrack-db          Up 2 minutes    5432/tcp
# vstrack-redis       Up 2 minutes    6379/tcp
# vstrack-backend     Up 2 minutes    8000/tcp
# vstrack-frontend    Up 2 minutes    3000/tcp
# vstrack-nginx       Up 2 minutes    0.0.0.0:80->80/tcp

# Initialize the database
docker compose exec backend python -c "from app.db.session import init_db; import asyncio; asyncio.run(init_db())"

# Seed with default admin user (optional)
docker compose exec backend python scripts/seed_db.py
```

### Step 5: Verify Deployment

```bash
# Check backend health
curl http://localhost/api/v1/health

# Expected response:
# {"status": "healthy", "version": "1.0.0"}

# Check the frontend
curl -I http://localhost

# Expected: HTTP/1.1 200 OK

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

---

## SSL/TLS Configuration

### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will automatically modify the Nginx configuration
# Verify auto-renewal is configured
sudo certbot renew --dry-run
```

### Manual SSL Configuration

Edit `nginx/nginx.conf` to enable HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of the location blocks
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

Then update `docker-compose.yml` to mount the certificates:

```yaml
nginx:
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
  ports:
    - "80:80"
    - "443:443"
```

---

## Environment Configuration

### Production Environment Checklist

Before deploying to production, ensure the following:

1. **DEBUG=false** — Disable debug mode to prevent sensitive information leaks
2. **Strong JWT_SECRET** — Use a cryptographically random secret (at least 32 bytes)
3. **Strong database password** — Use a password with at least 16 characters
4. **CORS restricted** — Only allow your production domain origins
5. **Upload size limits** — Configure appropriate `MAX_UPLOAD_SIZE_MB`
6. **Rate limiting** — The built-in rate limiter is enabled by default
7. **HTTPS enforced** — All traffic should go through SSL/TLS

### GPU Acceleration (Optional)

If you have an NVIDIA GPU available, you can accelerate YOLOv8 inference:

1. Install the NVIDIA Container Toolkit on the host:

```bash
# Add NVIDIA package repository
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker
```

2. Update `docker-compose.yml` to enable GPU access:

```yaml
backend:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

3. Install the GPU-enabled PyTorch in the backend Dockerfile:

```dockerfile
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

---

## Database Setup

### PostgreSQL Configuration

For production, tune the PostgreSQL configuration for performance:

```bash
# Connect to the PostgreSQL container
docker compose exec db psql -U vstrack -d vstrack_db

# Recommended settings for a server with 8GB RAM:
# Edit postgresql.conf via environment variables in docker-compose.yml:
```

Update the `db` service in `docker-compose.yml`:

```yaml
db:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: vstrack_db
    POSTGRES_USER: vstrack
    POSTGRES_PASSWORD: STRONG_DB_PASSWORD
  command:
    - "postgres"
    - "-c"
    - "shared_buffers=2GB"
    - "-c"
    - "effective_cache_size=6GB"
    - "-c"
    - "work_mem=50MB"
    - "-c"
    - "maintenance_work_mem=512MB"
    - "-c"
    - "max_connections=100"
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

### Database Migrations

When deploying updates that include model changes:

```bash
# Generate a migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker compose exec backend alembic upgrade head

# Rollback if needed
docker compose exec backend alembic downgrade -1
```

### Database Backups

Use the provided backup script:

```bash
# Manual backup
./scripts/backup_db.sh

# Automated daily backups (add to crontab)
crontab -e
# Add: 0 2 * * * /path/to/vehicle-speed-tracking/scripts/backup_db.sh
```

---

## Redis Configuration

Redis is used for caching API responses, managing WebSocket connection state, and queuing video processing jobs.

### Production Redis Configuration

Update the Redis service in `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
  volumes:
    - redis_data:/data
```

Key settings:
- **appendonly yes** — Enables persistence for job queue durability
- **maxmemory 512mb** — Prevents Redis from consuming too much memory
- **maxmemory-policy allkeys-lru** — Evicts least recently used keys when memory limit is reached

---

## Nginx Configuration

The provided `nginx/nginx.conf` is pre-configured for the platform with:

- Reverse proxy to frontend (port 3000) and backend (port 8000)
- WebSocket support for real-time updates (`/api/v1/ws/`)
- Gzip compression for static assets and API responses
- Client body size limit for video uploads (500MB)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

### Performance Tuning

For high-traffic deployments, increase worker connections:

```nginx
worker_processes auto;          # One worker per CPU core
worker_connections 2048;        # Concurrent connections per worker
client_body_buffer_size 128k;   # Buffer for uploads
proxy_buffer_size 128k;         # Proxy buffer size
proxy_buffers 4 256k;           # Number and size of proxy buffers
```

---

## Scaling Strategy

### Horizontal Scaling

The platform supports horizontal scaling of the backend service:

```yaml
# Scale to 3 backend instances
docker compose up -d --scale backend=3
```

Update the Nginx upstream configuration to load balance:

```nginx
upstream backend {
    least_conn;
    server backend_1:8000;
    server backend_2:8000;
    server backend_3:8000;
}
```

### GPU Worker Separation

For deployments with limited GPU resources, separate the API servers from the AI processing workers:

1. Run API-only backend instances without GPU access for handling HTTP requests
2. Run dedicated worker instances with GPU access for video processing
3. Use Redis as the job queue to distribute work to GPU workers

### Database Scaling

For high-volume deployments:
- Use PostgreSQL read replicas for analytics queries
- Configure connection pooling with PgBouncer
- Consider partitioning the `detections` and `speed_logs` tables by date

---

## Monitoring & Logging

### Container Health Checks

All services include health checks in the Docker Compose configuration. Monitor with:

```bash
# Check health status of all services
docker compose ps

# View real-time logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Export logs for analysis
docker compose logs --no-color > logs_$(date +%Y%m%d).txt
```

### Application Metrics

The backend exposes health and metrics endpoints:

- `GET /api/v1/health` — Service health check
- `GET /api/v1/health/detailed` — Detailed system metrics (admin only)

### External Monitoring (Recommended)

For production monitoring, integrate with:
- **Prometheus + Grafana** — For metrics collection and visualization
- **Sentry** — For error tracking and alerting
- **Uptime Robot** — For availability monitoring
- **Logstash + ELK** — For centralized log management

---

## Backup & Recovery

### Automated Backups

```bash
# Run the backup script
./scripts/backup_db.sh

# Backups are stored in ./backups/ with timestamps
# Example: ./backups/vstrack_db_20240115_020000.sql.gz
```

### Recovery Procedure

```bash
# Stop the backend to prevent writes during recovery
docker compose stop backend

# Restore the database
gunzip -c ./backups/vstrack_db_20240115_020000.sql.gz | \
  docker compose exec -T db psql -U vstrack -d vstrack_db

# Restart services
docker compose start backend
```

---

## Troubleshooting

### Common Issues

**Backend fails to start:**
```bash
# Check logs for specific errors
docker compose logs backend

# Common causes:
# - Database connection refused: ensure db service is healthy
# - Redis connection refused: ensure redis service is healthy
# - Missing .env file: copy from .env.example and configure
```

**Frontend build fails:**
```bash
# Check if node_modules are installed correctly
docker compose exec frontend npm install

# Clear Next.js cache
docker compose exec frontend rm -rf .next
docker compose restart frontend
```

**WebSocket connections fail:**
```bash
# Verify Nginx WebSocket configuration
# Check that the Upgrade headers are set in nginx.conf
# Ensure the backend websocket endpoint is accessible
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" \
  http://localhost/api/v1/ws/detections
```

**Video processing is slow:**
- Use `yolov8n` (nano) model for faster processing on CPU
- Consider GPU acceleration with NVIDIA Container Toolkit
- Reduce `DETECTION_CONFIDENCE` to filter out more detections
- Use Haar Cascade as a lightweight alternative

**Out of memory errors:**
- Increase Docker memory limit in Docker Desktop
- Reduce `--maxmemory` for Redis
- Limit concurrent video processing jobs
- Use smaller YOLOv8 model variants

### Getting Help

If you encounter issues not covered in this guide:
1. Check the GitHub Issues for known problems
2. Review the application logs with `docker compose logs -f`
3. Verify your environment configuration matches the production checklist
4. Ensure all Docker images are up to date with `docker compose pull`
