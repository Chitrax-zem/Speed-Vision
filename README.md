<p align="center">
  <img src="https://img.shields.io/badge/AI-Vehicle%20Detection-blue?style=for-the-badge&logo=opencv" alt="AI Vehicle Detection" />
  <img src="https://img.shields.io/badge/Speed-Tracking-green?style=for-the-badge&logo=google-analytics" alt="Speed Tracking" />
  <img src="https://img.shields.io/badge/Real--Time-Monitoring-orange?style=for-the-badge&logo=webrtc" alt="Real-Time Monitoring" />
</p>

<h1 align="center">🚗 Vehicle Detection & Speed Tracking Platform</h1>

<p align="center">
  A production-grade, full-stack AI-powered platform for real-time vehicle detection, tracking, and speed estimation from video streams and CCTV feeds. Built with a modern microservices architecture featuring FastAPI, Next.js, OpenCV, and YOLOv8.
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [API Reference](#api-reference)
- [AI Engine](#ai-engine)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

The Vehicle Detection & Speed Tracking Platform is an enterprise-grade solution designed for traffic monitoring, law enforcement, and smart city infrastructure. It combines state-of-the-art computer vision algorithms with a modern web application stack to deliver real-time vehicle detection, multi-object tracking, and speed estimation capabilities through an intuitive dashboard interface.

The platform processes video from uploaded files or live RTSP/CCTV streams, identifies vehicles using both Haar Cascade classifiers and YOLOv8 deep learning models, tracks each vehicle with unique identifiers using the dlib correlation tracker, and calculates instantaneous and average speeds with configurable pixels-per-meter calibration. All results are displayed through a glassmorphism-themed dashboard with real-time WebSocket updates, interactive charts, and downloadable analytics reports.

### Key Capabilities

The system supports dual detection backends with automatic fallback — YOLOv8 for high-accuracy deep learning inference and Haar Cascade for lightweight, CPU-friendly processing. Vehicle tracking uses dlib's correlation tracker to maintain persistent identities across frames, even through partial occlusions and brief disappearances. Speed estimation employs a multi-frame smoothing algorithm with configurable pixels-per-meter calibration to convert pixel displacements into real-world speed measurements in kilometers per hour. The lane detection module uses Canny edge detection and Hough line transforms to identify road lanes and assign vehicles to specific lanes for per-lane analytics.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (Reverse Proxy)                │
│                   SSL Termination / WebSocket               │
├────────────────────────┬────────────────────────────────────┤
│                        │                                    │
│   ┌────────────────┐   │   ┌────────────────────────────┐   │
│   │   Frontend     │   │   │        Backend             │   │
│   │   Next.js 14   │◄──┼──►│        FastAPI             │   │
│   │   React 18     │   │   │        Python 3.11         │   │
│   │   TypeScript   │   │   │                             │   │
│   │   Tailwind CSS │   │   │   ┌─────────────────────┐  │   │
│   │   ShadCN UI    │   │   │   │    AI Engine        │  │   │
│   └────────────────┘   │   │   │    OpenCV + YOLOv8  │  │   │
│                        │   │   │    dlib Tracker      │  │   │
│                        │   │   │    Speed Estimator   │  │   │
│                        │   │   └─────────────────────┘  │   │
│                        │   │            │                │   │
│                        │   │   ┌────────┴─────────┐     │   │
│                        │   │   │  WebSocket Mgr   │     │   │
│                        │   │   │  Background Tasks│     │   │
│                        │   │   └──────────────────┘     │   │
│                        │   └────────────────────────────┘   │
│                        │            │           │           │
│                   ┌────┴────┐  ┌────┴───┐  ┌────┴────┐    │
│                   │PostgreSQL│  │ Redis  │  │FileSystem│   │
│                   └─────────┘  └────────┘  └─────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. User uploads a video or connects an RTSP stream via the web interface
2. The backend receives the input and enqueues a processing job via Redis
3. The AI Engine pipeline processes each frame: detection → tracking → speed estimation → lane assignment
4. Results are stored in PostgreSQL and broadcast via WebSocket to connected clients
5. The frontend dashboard updates in real-time with bounding boxes, speed readings, and alerts
6. Analytics data is aggregated for charts, heatmaps, and downloadable reports

---

## ✨ Features

### Vehicle Detection
- **Dual Detection Backend**: YOLOv8 (primary) with Haar Cascade fallback for CPU-constrained environments
- **Multi-Class Detection**: Cars, trucks, buses, motorcycles, bicycles, and vans
- **Confidence Filtering**: Configurable confidence threshold to reduce false positives
- **Bounding Box Visualization**: Real-time overlay with color-coded vehicle types

### Vehicle Tracking
- **Persistent Identity**: dlib correlation tracker assigns unique IDs that persist across frames
- **Occlusion Handling**: Tracks survive brief occlusions with configurable missing-frame tolerance
- **Position Trail**: Visual trail of previous positions for trajectory analysis
- **Lost Vehicle Management**: Automatic cleanup of tracks that exceed the missing-frame threshold

### Speed Estimation
- **Real-Time Calculation**: Speed computed from pixel displacement, FPS, and pixels-per-meter calibration
- **Smoothing Algorithm**: Moving average filter to reduce measurement noise
- **Overspeed Detection**: Configurable speed limit with instant flagging of violations
- **Multi-Frame Averaging**: Aggregates speed readings across multiple frames for stability

### Lane Detection
- **Automatic Lane Finding**: Canny edge detection combined with Hough line transforms
- **Region of Interest**: Configurable ROI masking to focus on the road surface
- **Vehicle-to-Lane Assignment**: Each detected vehicle is assigned to the nearest lane
- **Per-Lane Statistics**: Speed and traffic volume broken down by lane

### Dashboard & Analytics
- **Real-Time Monitoring**: Live video feed with overlaid detections and speed readings
- **Interactive Charts**: Speed trends, vehicle type distribution, hourly traffic patterns
- **Detection Heatmap**: Visual density map of detection hotspots by day and hour
- **Overspeed Alerts**: Real-time notifications for speed limit violations
- **Downloadable Reports**: PDF and CSV exports of detection data and analytics

### System Features
- **JWT Authentication**: Secure token-based auth with role-based access control (admin, operator, viewer)
- **WebSocket Updates**: Real-time push notifications for detections, alerts, and analytics
- **Dark/Light Theme**: Glassmorphism UI with smooth theme transitions
- **Responsive Design**: Fully responsive layout optimized for desktop and tablet
- **Multi-Language Ready**: Internationalization infrastructure in place

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14+ | React framework with App Router |
| React | 18+ | UI component library |
| TypeScript | 5+ | Type-safe JavaScript |
| Tailwind CSS | 3.4+ | Utility-first CSS framework |
| ShadCN UI | Latest | Accessible component library (Radix primitives) |
| Framer Motion | 11+ | Animation library |
| Zustand | 4+ | Lightweight state management |
| TanStack Query | 5+ | Server state management |
| Recharts | 2+ | Data visualization charts |
| react-dropzone | 14+ | File upload drag-and-drop |
| next-themes | 0.2+ | Dark/light theme switching |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | 0.109+ | Async web framework |
| Uvicorn | 0.27+ | ASGI server |
| OpenCV | 4.9+ | Computer vision processing |
| dlib | 19.24+ | Correlation tracker |
| Ultralytics | 8.1+ | YOLOv8 inference |
| SQLAlchemy | 2.0+ | Async ORM |
| Alembic | 1.13+ | Database migrations |
| Redis | 5.0+ | Caching and job queues |
| Pydantic | 2.5+ | Data validation |
| python-jose | 3.3+ | JWT token handling |
| bcrypt | 4.1+ | Password hashing |
| ReportLab | 4.0+ | PDF report generation |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse proxy, SSL termination, WebSocket |
| PostgreSQL | Primary database |
| Redis | Cache, session store, job queue |
| GitHub Actions | CI/CD pipeline |

---

## 📁 Project Structure

```
vehicle-speed-tracking/
├── frontend/                    # Next.js 14 application
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── login/           # Authentication
│   │   │   ├── register/        # User registration
│   │   │   └── (dashboard)/     # Protected dashboard routes
│   │   │       ├── layout.tsx   # Dashboard layout with sidebar
│   │   │       ├── dashboard/   # Main analytics dashboard
│   │   │       ├── monitor/     # Live video monitoring
│   │   │       ├── upload/      # Video upload & processing
│   │   │       ├── analytics/   # Detailed analytics
│   │   │       ├── vehicles/    # Vehicle management
│   │   │       ├── camera/      # Camera management
│   │   │       ├── admin/       # Administration panel
│   │   │       └── settings/    # User settings
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Navbar
│   │   │   ├── providers/       # Theme, Query, Toast providers
│   │   │   └── ui/              # ShadCN UI components
│   │   └── lib/
│   │       ├── api.ts           # API client with typed methods
│   │       ├── hooks.ts         # TanStack Query hooks
│   │       ├── store.ts         # Zustand state stores
│   │       └── utils.ts         # Utility functions
│   ├── public/                  # Static assets
│   ├── next.config.ts           # Next.js configuration
│   ├── tailwind.config.ts       # Tailwind configuration
│   ├── tsconfig.json            # TypeScript configuration
│   └── package.json             # Dependencies
│
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── main.py              # FastAPI app with middleware
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic Settings
│   │   │   └── security.py      # JWT, password hashing, RBAC
│   │   ├── db/
│   │   │   └── session.py       # Async SQLAlchemy engine
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── user.py          # User with roles
│   │   │   ├── vehicle.py       # Vehicle with tracking
│   │   │   ├── camera.py        # Camera with RTSP config
│   │   │   ├── speed_log.py     # Speed readings
│   │   │   └── detection.py     # Detection events
│   │   ├── api/v1/              # REST API routes
│   │   │   ├── auth.py          # Register, login, refresh
│   │   │   ├── vehicles.py      # Vehicle CRUD + stats
│   │   │   ├── cameras.py       # Camera CRUD
│   │   │   ├── video.py         # Upload & stream processing
│   │   │   ├── analytics.py     # Dashboard & analytics
│   │   │   ├── reports.py       # CSV/PDF export
│   │   │   └── router.py        # Route aggregation
│   │   └── websocket.py         # WebSocket connection manager
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Environment template
│
├── ai_engine/                   # Computer vision processing
│   ├── __init__.py              # Module exports
│   ├── detector.py              # YOLOv8 + Haar Cascade detectors
│   ├── tracker.py               # dlib correlation tracker
│   ├── speed_estimator.py       # Speed calculation engine
│   ├── lane_detector.py         # Lane detection module
│   └── pipeline.py              # Processing pipeline orchestrator
│
├── docker/                      # Docker configurations
│   ├── Dockerfile.frontend      # Multi-stage Next.js build
│   ├── Dockerfile.backend       # Multi-stage FastAPI build
│   └── docker-compose.yml       # Development compose
│
├── nginx/                       # Reverse proxy configuration
│   └── nginx.conf               # Nginx with WebSocket support
│
├── scripts/                     # Utility scripts
│   ├── setup.sh                 # Initial project setup
│   ├── seed_db.py               # Database seeding
│   ├── run_dev.sh               # Development environment launcher
│   └── backup_db.sh             # Database backup utility
│
├── docs/                        # Documentation
│   ├── api.md                   # API reference documentation
│   ├── deployment.md            # Deployment guide
│   ├── environment-setup.md     # Environment setup guide
│   └── architecture.md          # Architecture deep-dive
│
├── docker-compose.yml           # Production Docker Compose
├── .github/workflows/
│   └── ci-cd.yml                # GitHub Actions CI/CD
└── README.md                    # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker** 24.0+ and Docker Compose 2.20+
- **Node.js** 20+ and npm 10+ (for local frontend development)
- **Python** 3.11+ and pip 23+ (for local backend development)
- **PostgreSQL** 16+ (if running without Docker)
- **Redis** 7+ (if running without Docker)

### Option 1: Docker Compose (Recommended)

The fastest way to get the entire platform running is with Docker Compose. This spins up all services — PostgreSQL, Redis, the FastAPI backend, the Next.js frontend, and the Nginx reverse proxy — with a single command.

```bash
# Clone the repository
git clone https://github.com/your-org/vehicle-speed-tracking.git
cd vehicle-speed-tracking

# Copy environment variables
cp backend/.env.example backend/.env

# Edit the environment file with your configuration
# At minimum, set a secure JWT_SECRET and database credentials
nano backend/.env

# Start all services
docker compose up -d

# Run database migrations (first time only)
docker compose exec backend python -c "from app.db.session import init_db; import asyncio; asyncio.run(init_db())"

# Seed the database with sample data (optional)
docker compose exec backend python scripts/seed_db.py
```

The platform will be available at:
- **Frontend**: http://localhost (port 80 via Nginx)
- **Backend API**: http://localhost/api/v1
- **API Docs (Swagger)**: http://localhost/api/docs
- **API Docs (ReDoc)**: http://localhost/api/redoc

### Option 2: Local Development

For active development, you may want to run the frontend and backend separately for hot-reload support.

#### Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL and Redis connection details

# Start PostgreSQL and Redis (if not using Docker)
# Ensure they're running on the configured ports

# Run database migrations
python -c "from app.db.session import init_db; import asyncio; asyncio.run(init_db())"

# Start the backend server with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure the API base URL (defaults to http://localhost:8000)
# Create .env.local if you need to override:
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the development server
npm run dev
```

The frontend will be available at http://localhost:3000 and the backend at http://localhost:8000.

### Default Login Credentials

After seeding the database, you can log in with these default accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@vstrack.io | admin123 |
| Operator | operator@vstrack.io | operator123 |
| Viewer | viewer@vstrack.io | viewer123 |

> ⚠️ **Security Warning**: Change these default passwords immediately in production. Use the settings page or the API to update user credentials.

---

## ⚙️ Environment Configuration

All configuration is managed through environment variables. The backend uses Pydantic Settings for validated configuration with sensible defaults.

### Backend Environment Variables

Create a `.env` file in the `backend/` directory (see `.env.example` for the full template):

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

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost"]

# Detection Configuration
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

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Key Configuration Details

**Detection Model**: Set `DETECTION_MODEL` to `yolov8n` (nano), `yolov8s` (small), `yolov8m` (medium), `yolov8l` (large), or `yolov8x` (extra-large). The nano model is fastest; the extra-large model is most accurate. If YOLOv8 is unavailable, the system automatically falls back to Haar Cascade detection.

**Pixels Per Meter (PPM)**: This is the critical calibration value for speed estimation. It represents how many pixels in the video frame correspond to one real-world meter. This value varies based on camera height, angle, and resolution. You can configure a global default and override it per-camera through the camera management interface. To calibrate, measure a known distance in the real scene and count the corresponding pixels in the video frame.

**Speed Limit**: The `DEFAULT_SPEED_LIMIT_KMH` sets the threshold for overspeed detection. Vehicles exceeding this speed are flagged in the dashboard and trigger WebSocket alerts. This can also be overridden per-camera.

---

## 📡 API Reference

The backend exposes a RESTful API under `/api/v1/` with full Swagger documentation available at `/api/docs` when the server is running. Below is a summary of the available endpoints.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user account |
| POST | `/api/v1/auth/login` | Authenticate and receive JWT tokens |
| POST | `/api/v1/auth/refresh` | Refresh an expired access token |
| GET | `/api/v1/auth/me` | Get the current authenticated user |

### Vehicles

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/vehicles/` | List vehicles with filtering and pagination |
| GET | `/api/v1/vehicles/{id}` | Get a specific vehicle's details |
| GET | `/api/v1/vehicles/{id}/speed-logs` | Get speed history for a vehicle |
| GET | `/api/v1/vehicles/stats/summary` | Get vehicle statistics summary |

### Cameras

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/cameras/` | List all cameras |
| POST | `/api/v1/cameras/` | Register a new camera (admin only) |
| GET | `/api/v1/cameras/{id}` | Get camera details |
| PUT | `/api/v1/cameras/{id}` | Update camera configuration (admin only) |
| DELETE | `/api/v1/cameras/{id}` | Remove a camera (admin only) |

### Video Processing

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/video/upload` | Upload a video file for processing |
| POST | `/api/v1/video/stream` | Start processing an RTSP stream |
| GET | `/api/v1/video/status/{job_id}` | Check processing job status |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/analytics/dashboard` | Get dashboard summary statistics |
| GET | `/api/v1/analytics/speed-trend` | Get speed trend over time |
| GET | `/api/v1/analytics/hourly-distribution` | Get hourly traffic distribution |
| GET | `/api/v1/analytics/overspeed-events` | Get overspeed violation events |
| GET | `/api/v1/analytics/vehicle-type-stats` | Get vehicle type distribution |
| GET | `/api/v1/analytics/heatmap` | Get detection heatmap data |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/reports/csv` | Download detection data as CSV |
| GET | `/api/v1/reports/pdf` | Download analytics report as PDF |

### WebSocket

| Endpoint | Description |
|---|---|
| `ws://host/api/v1/ws/{channel}` | Real-time updates (channels: `detections`, `alerts`, `analytics`) |

For complete request/response schemas and interactive testing, visit the Swagger UI at `/api/docs`.

---

## 🤖 AI Engine

The AI Engine is the core processing module that handles all computer vision tasks. It is designed as a standalone Python package that can be imported by the FastAPI backend or used independently for batch processing.

### Detection Module (`detector.py`)

The detection module provides two complementary detection strategies:

**HaarCascadeDetector** uses OpenCV's pre-trained cascade classifiers for vehicle detection. It is lightweight, requires no GPU, and works well for frontal and rear views of vehicles. The classifier files are bundled with OpenCV, so no additional model downloads are needed. It is best suited for low-resource environments or as a fallback when YOLOv8 is unavailable.

**YOLOv8Detector** uses the Ultralytics YOLOv8 model for state-of-the-art object detection. It filters results to vehicle-relevant COCO classes: car (2), motorcycle (3), bus (5), and truck (7). The model is automatically downloaded on first use. YOLOv8 provides significantly higher accuracy and better handles varied viewing angles, partial occlusions, and diverse vehicle types. It is the recommended detector for production deployments.

**VehicleDetector** is the unified interface that attempts YOLOv8 detection first and falls back to Haar Cascade if the YOLOv8 model fails to load or encounters an error. This ensures the system remains operational even if deep learning dependencies are unavailable.

### Tracking Module (`tracker.py`)

The tracking module uses dlib's correlation tracker for multi-object tracking. Each new detection is either matched to an existing tracker (if the bounding box overlap exceeds the IoU threshold) or assigned a new unique tracking ID. The tracker maintains a history of positions for each vehicle, enabling trail visualization and displacement calculation.

Key parameters include `max_frames_missing` (default: 30), which determines how many frames a tracker can survive without a matching detection before being removed, and the IoU threshold for matching detections to existing trackers.

### Speed Estimation Module (`speed_estimator.py`)

Speed estimation converts pixel displacements into real-world speed measurements using the formula: **speed (km/h) = d_meters × fps × 3.6**, where `d_meters = pixel_distance / pixels_per_meter`. The module applies a moving average smoothing filter (configurable window size) to reduce noise from frame-to-frame jitter. It also enforces a minimum displacement threshold to avoid spurious speed readings when a vehicle is nearly stationary.

The speed estimator maintains per-vehicle statistics including current speed, average speed, maximum speed, and an overspeed flag that triggers when the configured speed limit is exceeded.

### Lane Detection Module (`lane_detector.py`)

Lane detection uses a classical computer vision pipeline: the frame is converted to grayscale, a region of interest mask is applied to focus on the road surface, Canny edge detection identifies edges, and Hough line transforms extract straight lines corresponding to lane markings. Detected lines are clustered and averaged to produce lane boundaries. Each tracked vehicle is then assigned to the nearest lane based on its centroid position.

### Processing Pipeline (`pipeline.py`)

The pipeline orchestrates the full processing workflow. It accepts a `PipelineConfig` with all configurable parameters and coordinates the detector, tracker, speed estimator, and lane detector. It provides both synchronous and asynchronous processing methods for video files and live streams. Callback hooks (`on_frame`, `on_overspeed`) enable real-time integration with the WebSocket system for pushing updates to connected clients.

The pipeline also generates a HUD overlay on processed frames showing the current frame number, vehicle count, average speed, and any overspeed alerts — useful for monitoring and debugging.

---

## 🐳 Deployment

For comprehensive deployment instructions including Docker production setup, SSL configuration, scaling strategies, and monitoring, see [docs/deployment.md](docs/deployment.md).

For local environment setup and development configuration, see [docs/environment-setup.md](docs/environment-setup.md).

### Quick Production Deployment

```bash
# Build and start all services
docker compose -f docker-compose.yml up -d --build

# Verify all services are running
docker compose ps

# Check logs
docker compose logs -f backend
```

---

## 💻 Development

### Running in Development Mode

```bash
# Use the development Docker Compose configuration
docker compose -f docker/docker-compose.yml up -d

# Or run services individually with hot-reload:
# Terminal 1 - Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Code Style

- **Frontend**: ESLint + Prettier (configured via `eslint.config.mjs`)
- **Backend**: Black formatter + isort + flake8
- **Type Safety**: Strict TypeScript mode enabled

### Database Migrations

```bash
# Create a new migration after model changes
cd backend
alembic revision --autogenerate -m "description of change"

# Apply pending migrations
alembic upgrade head

# Rollback the last migration
alembic downgrade -1
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run e2e tests
npx playwright test
```

---

## 🤝 Contributing

We welcome contributions to the Vehicle Detection & Speed Tracking Platform. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure all tests pass and follow the existing code style conventions.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ using FastAPI, Next.js, OpenCV, and YOLOv8
</p>
#   S p e e d - V i s i o n  
 