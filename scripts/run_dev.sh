#!/bin/bash
# Development environment launcher script
# Starts both backend and frontend development servers

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   🚗 Vehicle Detection & Speed Tracking - Dev Launcher     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if infrastructure services are running
check_postgres() {
    if command -v pg_isready &> /dev/null; then
        pg_isready -h localhost -p 5432 &> /dev/null
    else
        # Try docker check
        docker compose -f "$PROJECT_ROOT/docker/docker-compose.yml" ps db 2>/dev/null | grep -q "Up" 2>/dev/null
    fi
}

check_redis() {
    if command -v redis-cli &> /dev/null; then
        redis-cli ping &> /dev/null 2>&1
    else
        docker compose -f "$PROJECT_ROOT/docker/docker-compose.yml" ps redis 2>/dev/null | grep -q "Up" 2>/dev/null
    fi
}

# Start infrastructure if needed
echo -e "${YELLOW}Checking infrastructure services...${NC}"

if ! check_postgres || ! check_redis; then
    echo -e "${YELLOW}Starting PostgreSQL and Redis via Docker...${NC}"
    cd "$PROJECT_ROOT"
    docker compose -f docker/docker-compose.yml up -d db redis 2>/dev/null || {
        echo -e "${RED}Failed to start infrastructure services.${NC}"
        echo -e "Please ensure Docker is running and try again."
        exit 1
    }
    echo -e "  ${GREEN}✓ Infrastructure services started${NC}"
    sleep 3  # Wait for services to be ready
else
    echo -e "  ${GREEN}✓ PostgreSQL and Redis are running${NC}"
fi

# Start backend in background
echo -e "\n${YELLOW}Starting backend server...${NC}"
cd "$PROJECT_ROOT/backend"

if [ ! -d "venv" ]; then
    echo -e "${RED}Virtual environment not found. Run ./scripts/setup.sh first.${NC}"
    exit 1
fi

source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo -e "  ${GREEN}✓ Backend started on http://localhost:8000 (PID: ${BACKEND_PID})${NC}"

# Start frontend in background
echo -e "\n${YELLOW}Starting frontend server...${NC}"
cd "$PROJECT_ROOT/frontend"

npm run dev &
FRONTEND_PID=$!
echo -e "  ${GREEN}✓ Frontend started on http://localhost:3000 (PID: ${FRONTEND_PID})${NC}"

# Wait for Ctrl+C
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗"
echo -e "║              ✅ Development servers running!                ║"
echo -e "╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Frontend:  ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend:   ${BLUE}http://localhost:8000${NC}"
echo -e "  API Docs:  ${BLUE}http://localhost:8000/api/docs${NC}"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all servers"
echo ""

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

trap cleanup INT TERM

# Wait for processes
wait
