<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.109+-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv8-Ultralytics-FF6F00?style=for-the-badge&logo=opencv&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<h1 align="center">🚗 VSTrack — Vehicle Detection & Speed Tracking Platform</h1>

<p align="center">
  A production-grade, full-stack AI platform for real-time vehicle detection, multi-object tracking, and speed estimation from video files and live CCTV/RTSP streams.
</p>

<p align="center">
  <a href="#-quick-start"><strong>Quick Start →</strong></a> &nbsp;·&nbsp;
  <a href="#-api-reference"><strong>API Docs →</strong></a> &nbsp;·&nbsp;
  <a href="#-ai-engine"><strong>AI Engine →</strong></a> &nbsp;·&nbsp;
  <a href="docs/deployment.md"><strong>Deploy →</strong></a>
</p>

---

## What is VSTrack?

VSTrack is an enterprise-ready traffic monitoring system that combines state-of-the-art computer vision with a modern web stack. Feed it a video file or a live RTSP stream and it will:

- **Detect** vehicles (cars, trucks, buses, motorcycles, bicycles, vans) using YOLOv8 or Haar Cascade
- **Track** each vehicle across frames with a unique persistent ID via dlib's correlation tracker
- **Estimate speeds** in km/h using configurable pixels-per-meter calibration
- **Detect lanes** and assign each vehicle to its lane using Canny + Hough transforms
- **Alert** on speed limit violations in real time over WebSocket
- **Report** via interactive dashboard with charts, heatmaps, and CSV/PDF exports

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Nginx (Reverse Proxy)                     │
│                  SSL Termination · WebSocket Proxy               │
├───────────────────────────┬──────────────────────────────────────┤
│   Frontend                │   Backend                            │
│   Next.js 14 + React 18   │   FastAPI + Python 3.11              │
│   TypeScript · Tailwind   │                                      │
│   ShadCN UI · Recharts    │   ┌─────────────────────────────┐    │
│   Zustand · TanStack Q    │   │  AI Engine                  │    │
│                           │   │  OpenCV · YOLOv8 · dlib     │    │
│   WebSocket client  ◄─────┼───┤  Speed Estimator            │    │
│                           │   │  Lane Detector              │    │
│                           │   └──────────────┬──────────────┘    │
│                           │                  │                   │
│                           │   ┌──────────────▼──────────────┐    │
│                           │   │  WebSocket Manager          │    │
│                           │   │  Background Task Queue      │    │
│                           │   └─────────────────────────────┘    │
└───────────────────────────┴──────┬───────────┬───────────────────┘
                                   │           │
                            ┌──────┴───┐  ┌────┴──────┐  ┌──────────────┐
                            │PostgreSQL│  │  Redis     │  │  Filesystem  │
                            └──────────┘  └────────────┘  └──────────────┘
```

### Request Lifecycle

1. User uploads a video or connects an RTSP stream via the dashboard
2. Backend enqueues a processing job in Redis
3. AI Engine runs per-frame: **detection → tracking → speed estimation → lane assignment**
4. Results are persisted to PostgreSQL and pushed via WebSocket to all connected clients
5. Dashboard updates live with bounding boxes, speed overlays, and violation alerts
6. Analytics are aggregated for charts, heatmaps, and downloadable reports

---

## Features

### 🎯 Detection
- **Dual backend**: YOLOv8 (primary) with automatic Haar Cascade fallback for CPU-only environments
- **6 vehicle classes**: car, truck, bus, motorcycle, bicycle, van
- **Configurable confidence threshold** to suppress false positives
- **Real-time bounding box overlay** color-coded by vehicle type

### 🔁 Tracking
- **Persistent IDs** across frames using dlib's correlation tracker
- **Occlusion tolerance**: tracks survive brief disappearances (configurable missing-frame threshold)
- **Position trails** for trajectory visualization
- **Automatic cleanup** of stale tracks

### ⚡ Speed Estimation
- **Formula**: `speed (km/h) = (pixel_displacement / pixels_per_meter) × fps × 3.6`
- **Moving average smoothing** to reduce frame-to-frame jitter
- **Per-vehicle stats**: current speed, average, maximum, overspeed flag
- **Per-camera calibration** via the camera management interface

### 🛣️ Lane Detection
- **Automatic lane finding**: Canny edges + Hough line transforms
- **Configurable ROI masking** to focus on the road surface
- **Vehicle-to-lane assignment** based on centroid position
- **Per-lane traffic stats**: speed and volume broken down by lane

### 📊 Dashboard & Analytics
- **Live monitoring**: real-time video feed with overlaid detections
- **Speed trend charts**, vehicle type distribution, hourly traffic patterns
- **Detection heatmap**: hotspot density by day and hour
- **Overspeed alerts**: WebSocket-pushed notifications for violations
- **Exports**: PDF analytics reports and CSV data downloads

### 🔐 Security & Access
- **JWT authentication** with access + refresh token flow
- **Role-based access control**: Admin, Operator, Viewer
- **Bcrypt** password hashing

---

## Tech Stack

### Frontend

| Library | Version | Purpose |
|---|---|---|
| Next.js | 14+ | React framework (App Router) |
| React | 18+ | UI |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3.4+ | Styling |
| ShadCN UI | Latest | Accessible components (Radix) |
| Framer Motion | 11+ | Animations |
| Zustand | 4+ | Client state |
| TanStack Query | 5+ | Server state & caching |
| Recharts | 2+ | Charts |
| next-themes | 0.2+ | Dark / light mode |

### Backend

| Library | Version | Purpose |
|---|---|---|
| FastAPI | 0.109+ | Async REST + WebSocket |
| Uvicorn | 0.27+ | ASGI server |
| OpenCV | 4.9+ | Computer vision |
| dlib | 19.24+ | Correlation tracker |
| Ultralytics | 8.1+ | YOLOv8 |
| SQLAlchemy | 2.0+ | Async ORM |
| Alembic | 1.13+ | Database migrations |
| Redis | 5.0+ | Caching + job queue |
| Pydantic | 2.5+ | Config & validation |
| python-jose | 3.3+ | JWT |
| bcrypt | 4.1+ | Password hashing |
| ReportLab | 4.0+ | PDF generation |

### Infrastructure

| Tool | Purpose |
|---|---|
| Docker + Compose | Containerization & orchestration |
| Nginx | Reverse proxy, SSL, WebSocket |
| PostgreSQL 16 | Primary database |
| Redis 7 | Cache, session store, job queue |
| GitHub Actions | CI/CD |

---

## Project Structure

```
vehicle-speed-tracking/
├── frontend/                    # Next.js 14 application
│   └── src/
│       ├── app/                 # App Router
│       │   ├── page.tsx         # Landing page
│       │   ├── login/
│       │   ├── register/
│       │   └── (dashboard)/     # Protected routes
│       │       ├── dashboard/   # Analytics overview
│       │       ├── monitor/     # Live video feed
│       │       ├── upload/      # Video upload & processing
│       │       ├── analytics/   # Detailed analytics
│       │       ├── vehicles/    # Vehicle management
│       │       ├── camera/      # Camera configuration
│       │       ├── admin/       # Admin panel
│       │       └── settings/    # User settings
│       ├── components/
│       │   ├── layout/          # Sidebar, Navbar
│       │   ├── providers/       # Theme, Query, Toast
│       │   └── ui/              # ShadCN components
│       └── lib/
│           ├── api.ts           # Typed API client
│           ├── hooks.ts         # TanStack Query hooks
│           ├── store.ts         # Zustand stores
│           └── utils.ts         # Helpers
│
├── backend/                     # FastAPI application
│   └── app/
│       ├── main.py              # App entry point + middleware
│       ├── core/
│       │   ├── config.py        # Pydantic Settings
│       │   └── security.py      # JWT, hashing, RBAC
│       ├── db/session.py        # Async SQLAlchemy engine
│       ├── models/              # ORM models
│       │   ├── user.py
│       │   ├── vehicle.py
│       │   ├── camera.py
│       │   ├── speed_log.py
│       │   └── detection.py
│       ├── api/v1/              # REST routes
│       │   ├── auth.py
│       │   ├── vehicles.py
│       │   ├── cameras.py
│       │   ├── video.py
│       │   ├── analytics.py
│       │   ├── reports.py
│       │   └── router.py
│       └── websocket.py         # WebSocket manager
│
├── ai_engine/                   # Computer vision core
│   ├── detector.py              # YOLOv8 + Haar Cascade
│   ├── tracker.py               # dlib multi-object tracker
│   ├── speed_estimator.py       # Speed calculation
│   ├── lane_detector.py         # Lane detection
│   └── pipeline.py              # Orchestration
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml       # Development
│
├── nginx/nginx.conf
├── scripts/
│   ├── setup.sh
│   ├── seed_db.py
│   ├── run_dev.sh
│   └── backup_db.sh
├── docs/
│   ├── api.md
│   ├── deployment.md
│   ├── environment-setup.md
│   └── architecture.md
├── docker-compose.yml           # Production
└── .github/workflows/ci-cd.yml
```

---

## Quick Start

### Prerequisites

- Docker 24.0+ and Docker Compose 2.20+
- Node.js 20+ / npm 10+ *(local frontend dev only)*
- Python 3.11+ / pip 23+ *(local backend dev only)*

### Option 1: Docker Compose (Recommended)

Spins up PostgreSQL, Redis, FastAPI, Next.js, and Nginx in one command.

```bash
git clone https://github.com/your-org/vehicle-speed-tracking.git
cd vehicle-speed-tracking

# Configure environment
cp backend/.env.example backend/.env
# At minimum: set JWT_SECRET and database credentials
nano backend/.env

# Start all services
docker compose up -d

# Initialize the database (first run only)
docker compose exec backend python -c \
  "from app.db.session import init_db; import asyncio; asyncio.run(init_db())"

# (Optional) Seed sample data
docker compose exec backend python scripts/seed_db.py
```

| Service | URL |
|---|---|
| Dashboard | http://localhost |
| Backend API | http://localhost/api/v1 |
| Swagger UI | http://localhost/api/docs |
| ReDoc | http://localhost/api/redoc |

### Option 2: Local Development (Hot Reload)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # configure your DB and Redis URLs

# Initialize DB
python -c "from app.db.session import init_db; import asyncio; asyncio.run(init_db())"

# Start with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Frontend → http://localhost:3000 · Backend → http://localhost:8000

### Default Accounts

> ⚠️ **Change these immediately in production** via the settings page or API.

| Role | Email | Password |
|---|---|---|
| Admin | admin@vstrack.io | admin123 |
| Operator | operator@vstrack.io | operator123 |
| Viewer | viewer@vstrack.io | viewer123 |

---

## Environment Configuration

The backend uses Pydantic Settings — all config is driven by environment variables with sensible defaults. Copy `backend/.env.example` to `backend/.env` and adjust as needed.

```env
# Application
APP_NAME="VSTrack - Vehicle Speed Tracking"
APP_VERSION=1.0.0
DEBUG=false
API_PREFIX=/api/v1

# Server
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql+asyncpg://vstrack:vstrack123@localhost:5432/vstrack_db

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost"]

# AI Engine
DETECTION_MODEL=yolov8n          # yolov8n | yolov8s | yolov8m | yolov8l | yolov8x
DETECTION_CONFIDENCE=0.5
TRACKER_MAX_FRAMES_MISSING=30
SPEED_SMOOTHING_WINDOW=5

# Speed Estimation
DEFAULT_PIXELS_PER_METER=10.0   # Calibrate per camera — see note below
DEFAULT_SPEED_LIMIT_KMH=60.0
MIN_SPEED_KMH=5.0

# Storage
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=500
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Calibrating Pixels Per Meter

`DEFAULT_PIXELS_PER_METER` is the most important value for speed accuracy. To calibrate:

1. Find an object of known real-world length in your video frame (e.g. a lane marking, car, road sign)
2. Count the number of pixels it spans in the frame
3. Divide pixel count by real-world meters → that's your PPM value
4. Set it globally here, or override it per-camera in the camera management UI

### Choosing a Detection Model

| Model | Speed | Accuracy | Best For |
|---|---|---|---|
| `yolov8n` | Fastest | Good | Resource-constrained, high-FPS |
| `yolov8s` | Fast | Better | Balanced CPU/GPU |
| `yolov8m` | Moderate | High | Most production setups |
| `yolov8l` | Slow | Very high | Accuracy-critical deployments |
| `yolov8x` | Slowest | Highest | Offline / batch processing |

If YOLOv8 fails to load, the system automatically falls back to Haar Cascade.

---

## API Reference

Full interactive docs at `/api/docs` (Swagger) and `/api/redoc` when the server is running.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | Authenticate and receive JWT tokens |
| `POST` | `/auth/refresh` | Refresh an expired access token |
| `GET` | `/auth/me` | Get the current authenticated user |

### Vehicles

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/vehicles/` | List vehicles (filterable, paginated) |
| `GET` | `/vehicles/{id}` | Get a specific vehicle |
| `GET` | `/vehicles/{id}/speed-logs` | Speed history for a vehicle |
| `GET` | `/vehicles/stats/summary` | Aggregate statistics |

### Cameras

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/cameras/` | List all cameras |
| `POST` | `/cameras/` | Register a camera *(admin)* |
| `GET` | `/cameras/{id}` | Get camera details |
| `PUT` | `/cameras/{id}` | Update configuration *(admin)* |
| `DELETE` | `/cameras/{id}` | Remove a camera *(admin)* |

### Video Processing

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/video/upload` | Upload a video file for processing |
| `POST` | `/video/stream` | Start processing an RTSP stream |
| `GET` | `/video/status/{job_id}` | Poll job status |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/dashboard` | Summary statistics for the dashboard |
| `GET` | `/analytics/speed-trend` | Speed over time |
| `GET` | `/analytics/hourly-distribution` | Hourly traffic breakdown |
| `GET` | `/analytics/overspeed-events` | Speed violation log |
| `GET` | `/analytics/vehicle-type-stats` | Distribution by vehicle type |
| `GET` | `/analytics/heatmap` | Detection density by day and hour |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reports/csv` | Download detection data as CSV |
| `GET` | `/reports/pdf` | Download analytics report as PDF |

### WebSocket

```
ws://<host>/api/v1/ws/{channel}
```

| Channel | Events |
|---|---|
| `detections` | New vehicle detection with bounding box and speed |
| `alerts` | Overspeed violations |
| `analytics` | Aggregated stats updates |

---

## AI Engine

The AI Engine (`ai_engine/`) is a standalone Python package that can be used independently for batch processing or embedded in the FastAPI backend.

### Detector (`detector.py`)

Three classes are provided:

**`HaarCascadeDetector`** — Uses OpenCV's bundled pre-trained cascade classifiers. No GPU required, no model download needed. Best for frontal/rear views and resource-constrained environments.

**`YOLOv8Detector`** — Uses Ultralytics YOLOv8 to detect COCO vehicle classes: car (2), motorcycle (3), bus (5), truck (7). The model downloads automatically on first run. Significantly higher accuracy than Haar Cascade, especially for varied angles and partial occlusions.

**`VehicleDetector`** — Unified interface that tries YOLOv8 first and falls back to Haar Cascade on failure. Use this class in production.

### Tracker (`tracker.py`)

Wraps dlib's correlation tracker for multi-object tracking. New detections are matched to existing tracks by IoU overlap; unmatched detections spawn new tracks with unique IDs. Tracks that exceed `max_frames_missing` (default: 30) are pruned automatically.

### Speed Estimator (`speed_estimator.py`)

```
speed (km/h) = (pixel_displacement / pixels_per_meter) × fps × 3.6
```

A configurable moving average filter (default window: 5 frames) smooths readings. A minimum displacement threshold prevents spurious speeds when a vehicle is stationary. Per-vehicle stats tracked: current speed, average, maximum, and overspeed flag.

### Lane Detector (`lane_detector.py`)

Classical CV pipeline: **grayscale → ROI mask → Canny edges → Hough lines → cluster + average → lane boundaries**. Each tracked vehicle is assigned to the nearest lane by centroid position. Per-lane speed and volume stats flow into the analytics API.

### Pipeline (`pipeline.py`)

Orchestrates all four modules. Accepts a `PipelineConfig` and exposes both sync and async processing methods for video files and live streams. Callback hooks (`on_frame`, `on_overspeed`) integrate with the WebSocket manager for real-time pushes. Generates a HUD overlay on processed frames (frame number, vehicle count, average speed, alerts) for monitoring and debugging.

---

## Deployment

For full production setup — Docker configs, SSL, scaling, and monitoring — see [`docs/deployment.md`](docs/deployment.md).

```bash
# Build and start all services
docker compose -f docker-compose.yml up -d --build

# Check service health
docker compose ps

# Tail backend logs
docker compose logs -f backend
```

---

## Development

### Code Style

- **Frontend**: ESLint + Prettier (`eslint.config.mjs`), strict TypeScript
- **Backend**: Black + isort + flake8

### Database Migrations

```bash
cd backend

# Generate a migration after model changes
alembic revision --autogenerate -m "describe your change"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

---

## Testing

### Backend

```bash
cd backend
pip install pytest pytest-asyncio httpx

pytest                              # Run all tests
pytest --cov=app --cov-report=html  # With coverage report
```

### Frontend

```bash
cd frontend
npm test                 # Unit tests
npx playwright test      # End-to-end tests
```

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

Please ensure all tests pass and code style checks are clean before submitting.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with FastAPI · Next.js · OpenCV · YOLOv8
</p>
