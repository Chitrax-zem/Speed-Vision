#!/bin/bash
# Vehicle Detection & Speed Tracking Platform - Setup Script
# This script sets up the local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   🚗 Vehicle Detection & Speed Tracking Platform Setup     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Detect OS
OS="$(uname -s)"
echo -e "${BLUE}Detected OS: ${OS}${NC}"

# Project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo -e "${GREEN}Project root: ${PROJECT_ROOT}${NC}"

# ─── Step 1: Check Prerequisites ───
echo -e "\n${YELLOW}Step 1: Checking prerequisites...${NC}"

check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "  ${GREEN}✓ $1 is installed${NC}"
        return 0
    else
        echo -e "  ${RED}✗ $1 is NOT installed${NC}"
        return 1
    fi
}

MISSING=0
check_command python3 || MISSING=1
check_command pip3 || MISSING=1
check_command node || MISSING=1
check_command npm || MISSING=1
check_command git || MISSING=1
check_command docker || echo -e "  ${YELLOW}⚠ Docker not found (optional for infrastructure)${NC}"

if [ $MISSING -eq 1 ]; then
    echo -e "\n${RED}Missing required dependencies. Please install them before continuing.${NC}"
    exit 1
fi

# ─── Step 2: Create Directories ───
echo -e "\n${YELLOW}Step 2: Creating project directories...${NC}"

mkdir -p backend/uploads
mkdir -p backend/backups
mkdir -p frontend/public/uploads
mkdir -p logs

echo -e "  ${GREEN}✓ Directories created${NC}"

# ─── Step 3: Backend Setup ───
echo -e "\n${YELLOW}Step 3: Setting up the backend...${NC}"

cd "$PROJECT_ROOT/backend"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo -e "  Creating Python virtual environment..."
    python3 -m venv venv
    echo -e "  ${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "  ${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo -e "  Upgrading pip..."
pip install --upgrade pip -q

# Install dependencies
echo -e "  Installing Python dependencies (this may take a few minutes)..."
pip install -r requirements.txt -q 2>/dev/null || {
    echo -e "  ${YELLOW}⚠ Some dependencies failed to install. Trying without dlib first...${NC}"
    # Install without dlib first, then try dlib separately
    pip install -r requirements.txt --no-deps -q 2>/dev/null || true
    pip install fastapi uvicorn sqlalchemy pydantic python-jose bcrypt redis -q
    echo -e "  ${YELLOW}⚠ Core dependencies installed. Install dlib manually: pip install dlib${NC}"
}

echo -e "  ${GREEN}✓ Backend dependencies installed${NC}"

# Copy environment file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "  ${GREEN}✓ Created .env from .env.example${NC}"
    echo -e "  ${YELLOW}⚠ Please edit backend/.env with your configuration${NC}"
else
    echo -e "  ${GREEN}✓ .env file already exists${NC}"
fi

# Deactivate virtual environment
deactivate

# ─── Step 4: Frontend Setup ───
echo -e "\n${YELLOW}Step 4: Setting up the frontend...${NC}"

cd "$PROJECT_ROOT/frontend"

# Install Node.js dependencies
echo -e "  Installing npm dependencies..."
npm install --silent 2>/dev/null
echo -e "  ${GREEN}✓ Frontend dependencies installed${NC}"

# Create .env.local
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
EOF
    echo -e "  ${GREEN}✓ Created .env.local${NC}"
else
    echo -e "  ${GREEN}✓ .env.local already exists${NC}"
fi

# ─── Step 5: Infrastructure Services ───
echo -e "\n${YELLOW}Step 5: Setting up infrastructure services...${NC}"

if command -v docker &> /dev/null; then
    echo -e "  Starting PostgreSQL and Redis with Docker..."
    cd "$PROJECT_ROOT"
    docker compose -f docker/docker-compose.yml up -d db redis 2>/dev/null || {
        echo -e "  ${YELLOW}⚠ Could not start Docker services. Make sure Docker is running.${NC}"
        echo -e "  ${YELLOW}  You can start them manually: docker compose -f docker/docker-compose.yml up -d db redis${NC}"
    }
    echo -e "  ${GREEN}✓ Infrastructure services started${NC}"
    
    # Wait for services to be ready
    echo -e "  Waiting for services to be ready..."
    sleep 5
else
    echo -e "  ${YELLOW}⚠ Docker not found. Please ensure PostgreSQL and Redis are running.${NC}"
    echo -e "  ${YELLOW}  PostgreSQL: localhost:5432${NC}"
    echo -e "  ${YELLOW}  Redis: localhost:6379${NC}"
fi

# ─── Step 6: Database Initialization ───
echo -e "\n${YELLOW}Step 6: Initializing the database...${NC}"

cd "$PROJECT_ROOT/backend"
source venv/bin/activate

echo -e "  Creating database tables..."
python -c "from app.db.session import init_db; import asyncio; asyncio.run(init_db())" 2>/dev/null && {
    echo -e "  ${GREEN}✓ Database tables created${NC}"
} || {
    echo -e "  ${YELLOW}⚠ Could not initialize database. Ensure PostgreSQL is running and .env is configured.${NC}"
    echo -e "  ${YELLOW}  You can initialize later: python -c \"from app.db.session import init_db; import asyncio; asyncio.run(init_db())\"${NC}"
}

# ─── Step 7: Seed Database (Optional) ───
echo -e "\n${YELLOW}Step 7: Seed database with sample data? (y/n)${NC}"
read -r SEED_RESPONSE
if [[ "$SEED_RESPONSE" =~ ^[Yy]$ ]]; then
    python scripts/seed_db.py 2>/dev/null && {
        echo -e "  ${GREEN}✓ Database seeded with sample data${NC}"
    } || {
        echo -e "  ${YELLOW}⚠ Could not seed database. You can run it manually: python scripts/seed_db.py${NC}"
    }
fi

deactivate

# ─── Complete ───
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗"
echo -e "║              ✅ Setup Complete!                             ║"
echo -e "╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "To start the development servers:"
echo ""
echo -e "  ${BLUE}# Terminal 1 - Backend${NC}"
echo -e "  cd backend && source venv/bin/activate"
echo -e "  uvicorn app.main:app --reload --port 8000"
echo ""
echo -e "  ${BLUE}# Terminal 2 - Frontend${NC}"
echo -e "  cd frontend && npm run dev"
echo ""
echo -e "Or use the quick-start script:"
echo -e "  ${BLUE}./scripts/run_dev.sh${NC}"
echo ""
echo -e "Default login (after seeding):"
echo -e "  Admin: ${GREEN}admin@vstrack.io / admin123${NC}"
echo -e "  Operator: ${GREEN}operator@vstrack.io / operator123${NC}"
echo -e "  Viewer: ${GREEN}viewer@vstrack.io / viewer123${NC}"
