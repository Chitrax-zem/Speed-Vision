# Environment Setup Guide

This guide walks you through setting up a local development environment for the Vehicle Detection & Speed Tracking Platform. It covers all the prerequisites, installation steps, and configuration needed to run the platform on your machine.

---

## Table of Contents

- [System Requirements](#system-requirements)
- [Quick Setup Script](#quick-setup-script)
- [Manual Setup](#manual-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Database Setup](#database-setup)
- [Redis Setup](#redis-setup)
- [AI Engine Dependencies](#ai-engine-dependencies)
- [Verifying the Installation](#verifying-the-installation)
- [Common Issues](#common-issues)

---

## System Requirements

### Operating System

The platform is developed and tested on Linux (Ubuntu 22.04+). It also works on macOS (13+) and Windows with WSL2 (Windows Subsystem for Linux). Windows users should use WSL2 for the best compatibility, especially for the AI engine components that depend on dlib and OpenCV.

### Hardware

| Component | Minimum | Recommended |
|---|---|---|
| CPU | 2 cores | 4+ cores |
| RAM | 8 GB | 16 GB |
| Storage | 10 GB free | 50 GB free (for video samples) |
| GPU | None | NVIDIA GPU with CUDA support |

### Software Prerequisites

- **Git** 2.40+
- **Docker** 24.0+ and Docker Compose 2.20+ (for containerized setup)
- **Python** 3.11+ with pip
- **Node.js** 20+ with npm 10+
- **PostgreSQL** 16+ (if not using Docker)
- **Redis** 7+ (if not using Docker)

---

## Quick Setup Script

For a quick start on Linux or macOS, use the automated setup script:

```bash
# Clone the repository
git clone https://github.com/your-org/vehicle-speed-tracking.git
cd vehicle-speed-tracking

# Run the setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The setup script will:
1. Create Python virtual environment and install backend dependencies
2. Install frontend npm dependencies
3. Create necessary directories (uploads, backups)
4. Copy environment configuration templates
5. Start PostgreSQL and Redis via Docker (optional)
6. Initialize the database with tables
7. Seed the database with sample data (optional)

After the script completes, you can start the development servers:

```bash
# Terminal 1: Start the backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Start the frontend
cd frontend
npm run dev
```

---

## Manual Setup

If you prefer to set up each component manually, follow the steps below.

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/vehicle-speed-tracking.git
cd vehicle-speed-tracking
```

### Step 2: Set Up Infrastructure Services

You can run PostgreSQL and Redis either via Docker or install them natively.

#### Option A: Docker (Recommended for Development)

```bash
# Start only the infrastructure services
docker compose -f docker/docker-compose.yml up -d db redis

# Verify they're running
docker compose -f docker/docker-compose.yml ps
```

#### Option B: Native Installation

**PostgreSQL on Ubuntu:**

```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create the database and user
sudo -u postgres psql
CREATE USER vstrack WITH PASSWORD 'vstrack123';
CREATE DATABASE vstrack_db OWNER vstrack;
GRANT ALL PRIVILEGES ON DATABASE vstrack_db TO vstrack;
\q
```

**PostgreSQL on macOS:**

```bash
brew install postgresql@16
brew services start postgresql@16
createdb vstrack_db
```

**Redis on Ubuntu:**

```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Redis on macOS:**

```bash
brew install redis
brew services start redis
```

---

## Backend Setup

### Step 1: Create a Virtual Environment

```bash
cd backend
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows WSL2
```

### Step 2: Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

The `requirements.txt` includes all necessary packages:

- **Web Framework**: fastapi, uvicorn[standard], python-multipart
- **Database**: sqlalchemy[asyncio], asyncpg, alembic
- **Authentication**: python-jose[cryptography], bcrypt, pydantic[email]
- **Computer Vision**: opencv-python-headless, dlib, ultralytics, numpy
- **Caching**: redis
- **Reporting**: reportlab, csv (stdlib)
- **Validation**: pydantic, pydantic-settings
- **Server**: uvicorn

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

At minimum, update these values for your local setup:

```env
DATABASE_URL=postgresql+asyncpg://vstrack:vstrack123@localhost:5432/vstrack_db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=dev-secret-change-in-production
CORS_ORIGINS=["http://localhost:3000"]
```

### Step 4: Initialize the Database

```bash
# Create all tables
python -c "from app.db.session import init_db; import asyncio; asyncio.run(init_db())"

# (Optional) Seed with sample data
python scripts/seed_db.py
```

### Step 5: Start the Backend Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using the run script
./scripts/run_dev.sh
```

The backend will be available at:
- API: http://localhost:8000/api/v1
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
- Health check: http://localhost:8000/api/v1/health

---

## Frontend Setup

### Step 1: Install Node.js Dependencies

```bash
cd frontend
npm install
```

This installs all dependencies including Next.js, React, Tailwind CSS, ShadCN UI components, Framer Motion, Zustand, TanStack Query, Recharts, and more.

### Step 2: Configure Environment Variables

```bash
# Create .env.local for local development
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
EOF
```

### Step 3: Start the Development Server

```bash
npm run dev
```

The frontend will be available at http://localhost:3000 with hot module replacement for instant feedback during development.

### Frontend Project Structure

The frontend is built with Next.js 14 using the App Router. Key directories:

- `src/app/` — Pages and layouts using the App Router convention
- `src/app/(dashboard)/` — Protected routes behind authentication
- `src/components/ui/` — ShadCN UI components (Button, Card, Dialog, etc.)
- `src/components/layout/` — Custom layout components (Sidebar, Navbar)
- `src/components/providers/` — Context providers (Theme, Query, Toast)
- `src/lib/` — Shared utilities, API client, hooks, and stores

---

## Database Setup

### Schema Overview

The database uses five main tables:

**users** — Stores user accounts with role-based access control. Roles are admin, operator, and viewer. Passwords are hashed with bcrypt.

**cameras** — Registered CCTV cameras with RTSP URLs, GPS coordinates, and per-camera calibration settings (pixels_per_meter, speed_limit_kmh). Status tracking (online, offline, maintenance).

**vehicles** — Tracked vehicle instances with unique tracking IDs, vehicle type classification, speed statistics (avg, min, max), lane assignment, and camera association.

**detections** — Individual detection events with bounding box coordinates, confidence scores, vehicle type, and frame metadata stored as JSON.

**speed_logs** — Timestamped speed readings for each vehicle with position data, frame numbers, and overspeed flags.

### Migrations with Alembic

```bash
cd backend

# Create a migration after modifying models
alembic revision --autogenerate -m "add vehicle color field"

# Apply all pending migrations
alembic upgrade head

# Check current migration state
alembic current

# Rollback the last migration
alembic downgrade -1

# View migration history
alembic history
```

---

## Redis Setup

Redis serves three purposes in the platform:

1. **API Response Caching** — Frequently accessed analytics data is cached with TTL to reduce database load
2. **WebSocket Connection State** — Active WebSocket connections and channel subscriptions are tracked in Redis
3. **Job Queue** — Video processing jobs are enqueued in Redis for background worker consumption

### Verifying Redis Connection

```bash
# Connect to Redis CLI
redis-cli

# Test the connection
127.0.0.1:6379> PING
PONG

# Check memory usage
127.0.0.1:6379> INFO memory

# List all keys
127.0.0.1:6379> KEYS *
```

---

## AI Engine Dependencies

The AI engine has specific system-level dependencies that must be installed before the Python packages will work correctly.

### OpenCV System Dependencies

```bash
# Ubuntu/Debian
sudo apt install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev

# macOS (via Homebrew)
brew install opencv
```

### dlib Dependencies

dlib requires CMake and a C++ compiler for building from source:

```bash
# Ubuntu/Debian
sudo apt install -y cmake build-essential

# macOS
brew install cmake
xcode-select --install
```

Building dlib can take 5-10 minutes. If you encounter build errors:
- Ensure CMake 3.15+ is installed
- Ensure a C++17 compatible compiler is available
- On systems with limited RAM, try: `pip install dlib --no-build-isolation`

### YOLOv8 (Ultralytics)

The YOLOv8 model weights are automatically downloaded on first use. The nano model (`yolov8n.pt`) is approximately 6MB. Larger models (small, medium, large, extra-large) range from 22MB to 685MB.

To pre-download the model:

```bash
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### GPU Acceleration (Optional)

For NVIDIA GPU support:

```bash
# Install CUDA Toolkit
# Follow NVIDIA's installation guide for your OS

# Install PyTorch with CUDA support
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# Verify GPU detection
python -c "import torch; print(torch.cuda.is_available())"
```

---

## Verifying the Installation

After completing all setup steps, verify that everything is working correctly:

### Backend Verification

```bash
# Check the health endpoint
curl http://localhost:8000/api/v1/health

# Expected: {"status": "healthy", "version": "1.0.0"}

# Check Swagger UI is accessible
curl -s http://localhost:8000/api/docs | head -5

# Register a test user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"test123"}'

# Login and get a token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Frontend Verification

```bash
# Check the frontend is serving
curl -s http://localhost:3000 | head -10

# Open in browser
# http://localhost:3000
```

### AI Engine Verification

```bash
cd backend
python -c "
from ai_engine import VehicleDetector, VehicleTracker, SpeedEstimator
print('AI Engine imports: OK')

detector = VehicleDetector(model_name='yolov8n')
print(f'Detector initialized: {detector.__class__.__name__}')

tracker = VehicleTracker()
print(f'Tracker initialized: {tracker.__class__.__name__}')

estimator = SpeedEstimator(pixels_per_meter=10.0)
print(f'Speed estimator initialized: {estimator.__class__.__name__}')

print('All AI engine components verified!')
"
```

---

## Common Issues

### dlib Build Failure

**Symptom**: `pip install dlib` fails with CMake or compilation errors.

**Solution**:
```bash
# Install build dependencies
sudo apt install cmake build-essential

# If still failing, try with verbose output
pip install dlib --verbose

# On macOS with Apple Silicon
CMAKE_ARGS="-DCMAKE_OSX_ARCHITECTURES=arm64" pip install dlib
```

### OpenCV Import Error

**Symptom**: `ImportError: libGL.so.1: cannot open shared object file`

**Solution**: Install the headless version of OpenCV:
```bash
pip uninstall opencv-python
pip install opencv-python-headless
```

### PostgreSQL Connection Refused

**Symptom**: `psycopg.OperationalError: connection refused`

**Solution**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check the connection string in .env
# Ensure host, port, user, password, and database name are correct

# Test the connection directly
psql -h localhost -U vstrack -d vstrack_db
```

### Redis Connection Refused

**Symptom**: `redis.exceptions.ConnectionError: Error connecting to Redis`

**Solution**:
```bash
# Check Redis is running
redis-cli ping

# If not running, start it
sudo systemctl start redis-server

# Check the REDIS_URL in .env
```

### Node.js Version Issues

**Symptom**: npm install fails or Next.js build errors.

**Solution**:
```bash
# Ensure Node.js 20+ is installed
node --version

# Use nvm to manage Node.js versions
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### YOLOv8 Model Download Issues

**Symptom**: Model download fails due to network issues or proxy.

**Solution**:
```bash
# Manually download the model weights
wget https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8n.pt -P ~/.cache/ultralytics/

# Or set a custom model path
export YOLOV8_MODEL_PATH=/path/to/yolov8n.pt
```

### Port Already in Use

**Symptom**: `Address already in use` error when starting a service.

**Solution**:
```bash
# Find the process using the port
lsof -i :8000  # Backend
lsof -i :3000  # Frontend

# Kill the process
kill -9 <PID>

# Or use a different port
uvicorn app.main:app --port 8001
npm run dev -- --port 3001
```
