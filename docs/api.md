# API Reference Documentation

## Base URL

```
Production: https://your-domain.com/api/v1
Development: http://localhost:8000/api/v1
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via the `/auth/login` endpoint and expire after 30 minutes (configurable). Use the `/auth/refresh` endpoint with a refresh token to obtain a new access token without re-authentication.

### Role-Based Access

The API enforces role-based access control with three roles:

- **Admin**: Full access to all endpoints including user management, camera configuration, and system settings
- **Operator**: Can upload videos, manage cameras, and view all analytics data
- **Viewer**: Read-only access to dashboards, analytics, and vehicle data

---

## Authentication Endpoints

### POST /auth/register

Register a new user account. Requires admin role to assign roles other than viewer.

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123",
  "role": "viewer"
}
```

**Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "johndoe",
  "role": "viewer",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- 400 Bad Request — Email or username already registered
- 422 Unprocessable Entity — Validation error in request body

### POST /auth/login

Authenticate with email and password to receive JWT tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Error Responses:**
- 401 Unauthorized — Invalid email or password

### POST /auth/refresh

Exchange a valid refresh token for a new access token.

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### GET /auth/me

Get the profile of the currently authenticated user.

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "johndoe",
  "role": "admin",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## Vehicle Endpoints

### GET /vehicles/

List all tracked vehicles with optional filtering and pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| skip | integer | 0 | Number of records to skip |
| limit | integer | 50 | Maximum records to return (max 100) |
| vehicle_type | string | null | Filter by type: car, truck, bus, motorcycle, bicycle, van, unknown |
| camera_id | string | null | Filter by camera UUID |
| min_speed | float | null | Minimum average speed filter (km/h) |
| max_speed | float | null | Maximum average speed filter (km/h) |
| is_overspeed | boolean | null | Filter vehicles that exceeded speed limit |
| start_date | datetime | null | Filter detections after this timestamp |
| end_date | datetime | null | Filter detections before this timestamp |

**Response (200 OK):**

```json
{
  "items": [
    {
      "id": "uuid",
      "tracking_id": 42,
      "vehicle_type": "car",
      "avg_speed_kmh": 45.2,
      "max_speed_kmh": 62.1,
      "min_speed_kmh": 12.3,
      "is_overspeed": false,
      "lane": 2,
      "camera_id": "camera-uuid",
      "first_detected": "2024-01-15T10:30:00Z",
      "last_seen": "2024-01-15T10:30:15Z",
      "detection_count": 45
    }
  ],
  "total": 1247,
  "skip": 0,
  "limit": 50
}
```

### GET /vehicles/{vehicle_id}

Get detailed information about a specific vehicle.

**Path Parameters:**
- `vehicle_id` (UUID) — The vehicle's unique identifier

**Response (200 OK):**

```json
{
  "id": "uuid",
  "tracking_id": 42,
  "vehicle_type": "car",
  "avg_speed_kmh": 45.2,
  "max_speed_kmh": 62.1,
  "min_speed_kmh": 12.3,
  "is_overspeed": false,
  "lane": 2,
  "camera_id": "camera-uuid",
  "first_detected": "2024-01-15T10:30:00Z",
  "last_seen": "2024-01-15T10:30:15Z",
  "detection_count": 45,
  "speed_logs": [
    {
      "id": "log-uuid",
      "speed_kmh": 48.3,
      "speed_mps": 13.42,
      "is_overspeed": false,
      "position": {"x": 450, "y": 320},
      "frame_number": 1234,
      "timestamp": "2024-01-15T10:30:08Z"
    }
  ]
}
```

### GET /vehicles/{vehicle_id}/speed-logs

Get the speed history for a specific vehicle with pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| skip | integer | 0 | Number of records to skip |
| limit | integer | 100 | Maximum records to return |
| overspeed_only | boolean | false | Return only overspeed readings |

**Response (200 OK):**

```json
{
  "items": [
    {
      "id": "log-uuid",
      "vehicle_id": "vehicle-uuid",
      "speed_kmh": 48.3,
      "speed_mps": 13.42,
      "is_overspeed": false,
      "position": {"x": 450, "y": 320},
      "frame_number": 1234,
      "timestamp": "2024-01-15T10:30:08Z"
    }
  ],
  "total": 45,
  "skip": 0,
  "limit": 100
}
```

### GET /vehicles/stats/summary

Get aggregated vehicle statistics.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| camera_id | string | null | Filter by camera |
| start_date | datetime | null | Start of time range |
| end_date | datetime | null | End of time range |

**Response (200 OK):**

```json
{
  "total_vehicles": 1247,
  "vehicles_by_type": {
    "car": 856,
    "truck": 142,
    "bus": 89,
    "motorcycle": 98,
    "van": 62
  },
  "avg_speed_kmh": 42.7,
  "max_speed_kmh": 127.3,
  "overspeed_count": 89,
  "overspeed_percentage": 7.1
}
```

---

## Camera Endpoints

### GET /cameras/

List all registered cameras.

**Response (200 OK):**

```json
{
  "items": [
    {
      "id": "camera-uuid",
      "name": "Highway 101 - North",
      "location": "Mile Marker 42",
      "rtsp_url": "rtsp://192.168.1.100:554/stream1",
      "status": "online",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "pixels_per_meter": 12.5,
      "speed_limit_kmh": 65.0,
      "last_active": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /cameras/

Register a new camera. Requires admin role.

**Request Body:**

```json
{
  "name": "Highway 101 - North",
  "location": "Mile Marker 42",
  "rtsp_url": "rtsp://192.168.1.100:554/stream1",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "pixels_per_meter": 12.5,
  "speed_limit_kmh": 65.0
}
```

**Response (201 Created):**

```json
{
  "id": "camera-uuid",
  "name": "Highway 101 - North",
  "location": "Mile Marker 42",
  "rtsp_url": "rtsp://192.168.1.100:554/stream1",
  "status": "online",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "pixels_per_meter": 12.5,
  "speed_limit_kmh": 65.0,
  "last_active": null,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### PUT /cameras/{camera_id}

Update camera configuration. Requires admin role.

**Request Body:** Same fields as POST, all optional.

### DELETE /cameras/{camera_id}

Remove a camera. Requires admin role.

**Response (204 No Content)**

---

## Video Processing Endpoints

### POST /video/upload

Upload a video file for vehicle detection processing. The file is processed asynchronously in the background.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| file | File | Yes | Video file (MP4, AVI, MOV, MKV) |
| camera_id | string | No | Associate with a camera for PPM/speed limit |
| pixels_per_meter | float | No | Override PPM calibration |
| speed_limit_kmh | float | No | Override speed limit for overspeed detection |
| detection_model | string | No | `yolov8n` (default) or `haar_cascade` |
| confidence_threshold | float | No | Minimum detection confidence (0.0-1.0, default 0.5) |

**Response (202 Accepted):**

```json
{
  "job_id": "job-uuid",
  "status": "queued",
  "filename": "highway_footage.mp4",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### POST /video/stream

Start processing a live RTSP stream.

**Request Body:**

```json
{
  "rtsp_url": "rtsp://192.168.1.100:554/stream1",
  "camera_id": "camera-uuid",
  "pixels_per_meter": 12.5,
  "speed_limit_kmh": 65.0,
  "detection_model": "yolov8n",
  "confidence_threshold": 0.5
}
```

**Response (202 Accepted):**

```json
{
  "job_id": "job-uuid",
  "status": "running",
  "rtsp_url": "rtsp://192.168.1.100:554/stream1",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### GET /video/status/{job_id}

Check the status of a processing job.

**Response (200 OK):**

```json
{
  "job_id": "job-uuid",
  "status": "processing",
  "progress": 0.65,
  "frames_processed": 1950,
  "total_frames": 3000,
  "vehicles_detected": 47,
  "overspeed_count": 3,
  "started_at": "2024-01-15T10:30:00Z",
  "estimated_completion": "2024-01-15T10:32:30Z"
}
```

**Status Values:** `queued`, `processing`, `completed`, `failed`, `cancelled`

---

## Analytics Endpoints

### GET /analytics/dashboard

Get the main dashboard summary statistics.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| camera_id | string | null | Filter by camera |
| period | string | 24h | Time period: 1h, 6h, 24h, 7d, 30d |

**Response (200 OK):**

```json
{
  "total_detections": 15420,
  "total_vehicles": 3420,
  "avg_speed_kmh": 42.7,
  "overspeed_count": 287,
  "overspeed_percentage": 8.4,
  "active_cameras": 5,
  "peak_hour": 8,
  "vehicle_type_distribution": {
    "car": 65,
    "truck": 12,
    "bus": 5,
    "motorcycle": 10,
    "van": 8
  }
}
```

### GET /analytics/speed-trend

Get speed trend data over time for line/area chart visualization.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| camera_id | string | null | Filter by camera |
| interval | string | 1h | Aggregation interval: 5m, 15m, 1h, 6h, 1d |
| start_date | datetime | null | Start of time range |
| end_date | datetime | null | End of time range |

**Response (200 OK):**

```json
{
  "data": [
    {
      "timestamp": "2024-01-15T08:00:00Z",
      "avg_speed": 45.2,
      "max_speed": 87.3,
      "min_speed": 12.1,
      "vehicle_count": 142
    }
  ]
}
```

### GET /analytics/hourly-distribution

Get the distribution of vehicle traffic by hour of the day.

**Response (200 OK):**

```json
{
  "data": [
    {
      "hour": 0,
      "vehicle_count": 45,
      "avg_speed": 55.2,
      "overspeed_count": 2
    }
  ]
}
```

### GET /analytics/overspeed-events

Get a paginated list of overspeed violation events.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| skip | integer | 0 | Pagination offset |
| limit | integer | 50 | Records per page |
| camera_id | string | null | Filter by camera |
| min_speed | float | null | Minimum overspeed threshold |
| start_date | datetime | null | Start of time range |
| end_date | datetime | null | End of time range |

**Response (200 OK):**

```json
{
  "items": [
    {
      "id": "event-uuid",
      "vehicle_id": "vehicle-uuid",
      "tracking_id": 42,
      "speed_kmh": 78.5,
      "speed_limit_kmh": 60.0,
      "vehicle_type": "car",
      "camera_name": "Highway 101 - North",
      "timestamp": "2024-01-15T10:30:08Z"
    }
  ],
  "total": 287
}
```

### GET /analytics/vehicle-type-stats

Get aggregated statistics broken down by vehicle type.

**Response (200 OK):**

```json
{
  "data": [
    {
      "vehicle_type": "car",
      "count": 2214,
      "avg_speed_kmh": 43.5,
      "max_speed_kmh": 127.3,
      "overspeed_count": 156,
      "overspeed_percentage": 7.0
    }
  ]
}
```

### GET /analytics/heatmap

Get detection density data formatted for a day-of-week × hour heatmap visualization.

**Response (200 OK):**

```json
{
  "data": [
    {
      "day_of_week": 0,
      "hour": 8,
      "detection_count": 245,
      "avg_speed": 38.2
    }
  ]
}
```

---

## Reports Endpoints

### GET /reports/csv

Download detection data as a CSV file.

**Query Parameters:** Same filtering options as `/vehicles/` endpoint.

**Response (200 OK):**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename=vehicle_report_20240115.csv`

CSV columns: `tracking_id, vehicle_type, avg_speed_kmh, max_speed_kmh, is_overspeed, lane, camera_name, first_detected, last_seen, detection_count`

### GET /reports/pdf

Download an analytics report as a PDF document.

**Query Parameters:** Same filtering options as `/analytics/dashboard` endpoint.

**Response (200 OK):**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename=analytics_report_20240115.pdf`

The PDF report includes dashboard summary statistics, speed trend charts, vehicle type distribution, and overspeed event listings.

---

## WebSocket API

### Connection

```
ws://host/api/v1/ws/{channel}
```

**Channels:**

| Channel | Description |
|---|---|
| detections | Real-time vehicle detection events |
| alerts | Overspeed and system alerts |
| analytics | Periodic analytics updates |

**Authentication:** Send a JSON message after connecting:

```json
{
  "type": "auth",
  "token": "your-access-token"
}
```

### Detection Events (detections channel)

```json
{
  "type": "detection",
  "data": {
    "tracking_id": 42,
    "vehicle_type": "car",
    "bbox": [120, 80, 280, 220],
    "speed_kmh": 45.2,
    "confidence": 0.92,
    "lane": 2,
    "camera_id": "camera-uuid",
    "timestamp": "2024-01-15T10:30:08Z"
  }
}
```

### Alert Events (alerts channel)

```json
{
  "type": "overspeed_alert",
  "data": {
    "tracking_id": 42,
    "vehicle_type": "car",
    "speed_kmh": 78.5,
    "speed_limit_kmh": 60.0,
    "camera_name": "Highway 101 - North",
    "timestamp": "2024-01-15T10:30:08Z"
  }
}
```

### Analytics Updates (analytics channel)

```json
{
  "type": "analytics_update",
  "data": {
    "total_detections": 15420,
    "total_vehicles": 3420,
    "avg_speed_kmh": 42.7,
    "overspeed_count": 287,
    "period": "24h"
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "detail": "Human-readable error message",
  "status_code": 400,
  "error_type": "VALIDATION_ERROR"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient role/permissions) |
| 404 | Not Found |
| 422 | Unprocessable Entity (request body validation failed) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

### Rate Limiting

The API enforces rate limiting of 100 requests per minute per IP address. Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312200
```

When the rate limit is exceeded, the API returns a 429 status code with a `Retry-After` header.
