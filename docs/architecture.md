# Architecture Deep-Dive

This document provides an in-depth look at the architecture, design decisions, and data flow of the Vehicle Detection & Speed Tracking Platform.

---

## System Architecture

The platform follows a microservices-inspired architecture with clear separation of concerns across three primary services: the Next.js frontend, the FastAPI backend, and the AI processing engine. These services communicate through REST APIs and WebSocket connections, with PostgreSQL as the persistent data store and Redis as the caching and messaging layer.

### Service Communication

```
┌──────────┐    HTTP/REST     ┌──────────┐    SQL/Async     ┌──────────┐
│          │ ───────────────► │          │ ───────────────► │          │
│ Frontend │    WebSocket     │ Backend  │                  │PostgreSQL│
│  Next.js │ ◄─────────────  │ FastAPI  │ ◄─────────────── │          │
│          │                  │          │    Query Results  │          │
└──────────┘                  │          │                   └──────────┘
                              │          │
                              │          │    Pub/Sub       ┌──────────┐
                              │          │ ───────────────► │          │
                              │          │                  │  Redis   │
                              │          │ ◄─────────────── │          │
                              │          │    Cache/Jobs    │          │
                              └──────────┘                   └──────────┘
                                    │
                                    │ Python imports
                                    ▼
                              ┌──────────┐
                              │          │
                              │AI Engine │
                              │ OpenCV   │
                              │ YOLOv8   │
                              │ dlib     │
                              └──────────┘
```

### Request Lifecycle

A typical request to process a video follows this path:

1. The user uploads a video through the frontend's drag-and-drop interface
2. The frontend sends a multipart/form-data POST request to `/api/v1/video/upload`
3. The backend validates the file, saves it to disk, and creates a processing job
4. The job is enqueued in Redis and a background task begins processing
5. The AI Engine pipeline processes each frame: detection → tracking → speed → lane
6. Detection events and speed logs are written to PostgreSQL
7. WebSocket messages are broadcast to subscribed frontend clients
8. The frontend dashboard updates in real-time with new data

---

## Backend Architecture

### Application Structure

The FastAPI backend follows a layered architecture pattern:

**API Layer** (`app/api/v1/`) — Handles HTTP request/response serialization, input validation via Pydantic models, and authentication checks. Each router is responsible for a specific domain: auth, vehicles, cameras, video processing, analytics, and reports.

**Business Logic Layer** — Contained within the API route handlers. For more complex applications, this could be extracted into a separate service layer, but the current scope allows the logic to reside alongside the route definitions without excessive coupling.

**Data Access Layer** (`app/db/`, `app/models/`) — SQLAlchemy ORM models define the database schema, and the async session manager provides database connections with automatic session lifecycle management.

**AI Engine Integration** (`ai_engine/`) — The AI processing modules are imported as a Python package and invoked by the video processing background tasks.

### Middleware Stack

The backend applies middleware in the following order (outermost first):

1. **CORS Middleware** — Handles cross-origin requests from the frontend
2. **GZip Middleware** — Compresses response bodies larger than 1KB
3. **Rate Limiting Middleware** — Enforces 100 requests/minute per IP address
4. **Exception Handlers** — Converts unhandled exceptions to consistent JSON error responses

### Authentication Flow

The authentication system uses JSON Web Tokens (JWT) with a dual-token approach:

- **Access Token**: Short-lived (30 minutes), used for API authentication
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens without re-authentication

Both tokens are signed with HMAC-SHA256 using a shared secret. The access token contains the user ID, email, and role claims, enabling role-based access control without additional database lookups on each request.

### WebSocket Architecture

The WebSocket manager supports multiple channels for different event types:

- **detections** — Real-time vehicle detection events with bounding boxes and speed readings
- **alerts** — Overspeed violation alerts and system notifications
- **analytics** — Periodic summary statistics updates

Each client subscribes to one or more channels upon connection. The backend broadcasts messages to all subscribers of a channel when new data becomes available. Redis pub/sub can be used to distribute WebSocket messages across multiple backend instances in a scaled deployment.

---

## AI Engine Architecture

### Processing Pipeline

The AI Engine pipeline processes video frames through four sequential stages:

```
Frame Input → Detection → Tracking → Speed Estimation → Lane Assignment → Output
                  │            │              │                  │
              Vehicle      Unique ID      Speed (km/h)       Lane Number
              BBox +        Position       Overspeed Flag
              Type +        Trail          Statistics
              Confidence
```

### Detection Strategy

The detection module implements a fallback pattern:

1. Attempt to initialize YOLOv8 with the configured model variant
2. If YOLOv8 is available, run inference on the frame
3. If YOLOv8 fails (model not found, CUDA error, etc.), fall back to Haar Cascade
4. If both fail, return an empty detection list with an error log

This ensures the system remains operational even when deep learning dependencies are unavailable, which is critical for production deployments where uptime is essential.

### Tracking Algorithm

The dlib correlation tracker uses a discriminative correlation filter to track objects across frames. The tracking workflow is:

1. For each new frame, update all existing trackers to get predicted positions
2. Run detection on the frame to get new bounding boxes
3. Compute IoU (Intersection over Union) between each tracker prediction and each detection
4. Match detections to trackers using a greedy assignment based on IoU scores
5. For matched pairs, update the tracker with the detection bounding box
6. For unmatched detections, create new trackers with unique IDs
7. For unmatched trackers, increment the missing frame counter
8. Remove trackers that exceed the maximum missing frame threshold (default: 30)

### Speed Estimation Algorithm

Speed is estimated from pixel displacement between consecutive frames using the following formula:

```
speed_kmh = (pixel_distance / pixels_per_meter) × fps × 3.6
```

Where:
- `pixel_distance` is the Euclidean distance between the vehicle's centroid in the current and previous frames
- `pixels_per_meter` is the calibration factor that maps pixel distances to real-world meters
- `fps` is the video frame rate
- `3.6` converts m/s to km/h

To reduce noise, a configurable moving average filter is applied across the last N speed readings (default: 5). A minimum displacement threshold filters out spurious readings when vehicles are nearly stationary.

### Lane Detection Algorithm

Lane detection uses classical computer vision techniques:

1. Convert the frame to grayscale
2. Apply a region of interest (ROI) mask to focus on the road surface
3. Apply Gaussian blur to reduce noise
4. Run Canny edge detection
5. Apply Hough line transform to detect straight lines
6. Filter lines by angle (remove horizontal and near-vertical lines)
7. Cluster remaining lines into lane boundaries
8. Assign each tracked vehicle to the nearest lane based on centroid position

---

## Frontend Architecture

### Next.js App Router

The frontend uses Next.js 14 with the App Router, which provides:

- **File-based routing** — Each directory in `src/app/` maps to a URL path
- **Nested layouts** — The `(dashboard)` route group shares a common layout with the sidebar
- **Server Components** — Initial page loads are server-rendered for fast time-to-first-byte
- **Client Components** — Interactive elements use the `"use client"` directive for browser-side rendering

### State Management

The frontend uses a layered state management approach:

- **Zustand** — Client-side UI state (sidebar open/close, theme preference, monitoring state) that does not require server synchronization
- **TanStack Query** — Server state with automatic caching, refetching, and stale-while-revalidate patterns. All API data is managed through query hooks in `src/lib/hooks.ts`
- **WebSocket** — Real-time data pushed from the server (detection events, alerts) that updates both the Zustand stores and triggers TanStack Query cache invalidation

### Component Architecture

The UI is built with ShadCN UI components, which are accessible, unstyled Radix primitives styled with Tailwind CSS. This provides:

- **Accessibility** — All interactive components follow WAI-ARIA patterns
- **Customizability** — Components are copied into the project (not installed as packages), so they can be modified
- **Consistency** — The Tailwind CSS design system ensures visual consistency

### Theme System

The dark/light theme is implemented using CSS custom properties (variables) defined in `globals.css`. The `next-themes` library manages theme persistence and switching. All color values reference CSS variables, enabling theme changes without JavaScript re-renders.

---

## Database Schema

### Entity Relationships

```
┌──────────┐     1:N      ┌──────────┐
│  Camera  │──────────────│ Vehicle  │
│          │              │          │
│ id (PK)  │              │ id (PK)  │
│ name     │              │ camera_id│──────┐
│ rtsp_url │              │ track_id │      │
│ ppm      │              │ type     │      │
│ spd_lim  │              │ avg_spd  │      │
└──────────┘              │ max_spd  │      │
                          └──────────┘      │
                               │            │
                          1:N  │       1:N  │
                               ▼            ▼
                          ┌──────────┐ ┌──────────┐
                          │Detection │ │SpeedLog  │
                          │          │ │          │
                          │ id (PK)  │ │ id (PK)  │
                          │ veh_id   │ │ veh_id   │
                          │ bbox     │ │ speed    │
                          │ conf     │ │ overspd  │
                          │ type     │ │ position │
                          │ frame    │ │ frame    │
                          └──────────┘ └──────────┘

┌──────────┐
│   User   │
│          │
│ id (PK)  │
│ email    │
│ username │
│ role     │
│ password │
└──────────┘
```

### Indexing Strategy

Key indexes for query performance:

- `vehicles(camera_id, last_seen)` — Dashboard queries filtering by camera and recency
- `speed_logs(vehicle_id, timestamp)` — Speed history lookups ordered by time
- `detections(vehicle_id, frame_number)` — Detection lookups by vehicle and frame
- `speed_logs(is_overspeed, timestamp)` — Overspeed event filtering

### Data Retention

For high-traffic deployments, consider implementing data retention policies:

- Detections older than 30 days can be aggregated into hourly summaries and the raw records deleted
- Speed logs older than 90 days can be archived to cold storage
- Vehicle records with no recent detections can be marked as inactive

---

## Performance Considerations

### Backend Performance

- **Async I/O** — FastAPI with async SQLAlchemy and asyncpg ensures non-blocking database queries
- **Connection Pooling** — SQLAlchemy async engine uses a connection pool (default: 5 min, 20 max connections)
- **Redis Caching** — Analytics endpoints cache results for 60 seconds to reduce database load
- **Background Tasks** — Video processing runs in background tasks to avoid blocking API requests
- **GZip Compression** — Responses over 1KB are automatically compressed

### Frontend Performance

- **Code Splitting** — Next.js automatically splits code by route, loading only what's needed
- **Static Generation** — The landing page is statically generated at build time
- **Image Optimization** — Next.js Image component provides automatic optimization
- **Lazy Loading** — Charts and heavy components are lazy-loaded below the fold
- **Query Caching** — TanStack Query caches API responses with configurable stale times

### AI Engine Performance

- **Model Selection** — YOLOv8n processes ~80 FPS on GPU, ~12 FPS on CPU; YOLOv8x is more accurate but ~10x slower
- **Frame Skipping** — For high-FPS videos, process every Nth frame to reduce computational load
- **Resolution Scaling** — Downscale frames before detection for faster inference with minimal accuracy loss
- **Batch Processing** — Process multiple frames simultaneously on GPU for higher throughput
