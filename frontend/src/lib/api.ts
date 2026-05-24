/**
 * API Client for Vehicle Detection & Speed Tracking Platform
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (response.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || 'API request failed');
    }

    if (response.headers.get('content-type')?.includes('application/json')) {
      return response.json();
    }

    return response as unknown as T;
  }

  // Auth
  async login(username: string, password: string) {
    return this.request<{ access_token: string; refresh_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  }

  async register(email: string, username: string, password: string, full_name?: string) {
    return this.request<{ access_token: string; refresh_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: { email, username, password, full_name },
    });
  }

  async getMe() {
    return this.request<User>('/auth/me');
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<DashboardStats>('/analytics/dashboard');
  }

  // Vehicles
  async getVehicles(params?: { page?: number; per_page?: number; vehicle_type?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    if (params?.vehicle_type) query.set('vehicle_type', params.vehicle_type);
    return this.request<VehicleList>(`/vehicles/?${query.toString()}`);
  }

  async getVehicleStats() {
    return this.request<VehicleStats>('/vehicles/stats');
  }

  async getVehicle(id: string) {
    return this.request<Vehicle>(`/vehicles/${id}`);
  }

  async getVehicleSpeedLogs(id: string, limit = 100) {
    return this.request<SpeedLog[]>(`/vehicles/${id}/speed-logs?limit=${limit}`);
  }

  async deleteVehicle(id: string) {
    return this.request<{ message: string }>(`/vehicles/${id}`, { method: 'DELETE' });
  }

  // Cameras
  async getCameras(params?: { page?: number; per_page?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    return this.request<CameraList>(`/cameras/?${query.toString()}`);
  }

  async createCamera(data: CameraCreate) {
    return this.request<{ id: string; name: string; status: string }>('/cameras/', {
      method: 'POST',
      body: data,
    });
  }

  async updateCamera(id: string, data: Partial<CameraCreate>) {
    return this.request<{ message: string }>(`/cameras/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async deleteCamera(id: string) {
    return this.request<{ message: string }>(`/cameras/${id}`, { method: 'DELETE' });
  }

  // Video Processing
  async uploadVideo(file: File, options?: { pixels_per_meter?: number; speed_limit_kmh?: number; detection_backend?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.pixels_per_meter) formData.append('pixels_per_meter', String(options.pixels_per_meter));
    if (options?.speed_limit_kmh) formData.append('speed_limit_kmh', String(options.speed_limit_kmh));
    if (options?.detection_backend) formData.append('detection_backend', options.detection_backend);

    const response = await fetch(`${this.baseUrl}/video/upload`, {
      method: 'POST',
      headers: {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  }

  async getJobStatus(jobId: string) {
    return this.request<JobStatus>(`/video/jobs/${jobId}`);
  }

  async getJobs() {
    return this.request<{ jobs: JobStatus[] }>('/video/jobs');
  }

  // Analytics
  async getSpeedTrend(hours = 24) {
    return this.request<SpeedTrend>(`/analytics/speed-trend?hours=${hours}`);
  }

  async getHourlyDistribution() {
    return this.request<HourlyDistribution>('/analytics/hourly-distribution');
  }

  async getOverspeedEvents(limit = 50) {
    return this.request<{ events: OverspeedEvent[] }>(`/analytics/overspeed-events?limit=${limit}`);
  }

  async getVehicleTypeStats() {
    return this.request<VehicleTypeStats>('/analytics/vehicle-type-stats');
  }

  async getHeatmap(cameraId?: string) {
    const query = cameraId ? `?camera_id=${cameraId}` : '';
    return this.request<HeatmapData>(`/analytics/heatmap${query}`);
  }

  // Reports
  async downloadVehiclesCsv() {
    return `${this.baseUrl}/reports/vehicles/csv`;
  }

  async downloadSpeedLogsCsv() {
    return `${this.baseUrl}/reports/speed-logs/csv`;
  }

  async downloadSummaryPdf() {
    return `${this.baseUrl}/reports/summary/pdf`;
  }
}

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export interface DashboardStats {
  total_vehicles_detected: number;
  average_speed_kmh: number;
  max_speed_kmh: number;
  overspeed_alerts: number;
  total_cameras: number;
  active_cameras: number;
  recent_detections_24h: number;
  vehicle_type_distribution: Record<string, number>;
}

export interface Vehicle {
  id: string;
  tracking_id: string;
  vehicle_type: string;
  confidence: number;
  avg_speed: number;
  max_speed: number;
  direction?: string;
  lane?: number;
  first_seen?: string;
  last_seen?: string;
  camera_id?: string;
}

export interface VehicleList {
  vehicles: Vehicle[];
  total: number;
  page: number;
  per_page: number;
}

export interface VehicleStats {
  total_vehicles: number;
  average_speed: number;
  max_speed: number;
  vehicle_type_distribution: Record<string, number>;
}

export interface SpeedLog {
  id: string;
  speed_kmh: number;
  speed_mps: number;
  is_overspeed: boolean;
  position_x?: number;
  position_y?: number;
  frame_number?: number;
  timestamp?: string;
}

export interface CameraCreate {
  name: string;
  location?: string;
  rtsp_url?: string;
  latitude?: number;
  longitude?: number;
  resolution_width?: number;
  resolution_height?: number;
  fps?: number;
  pixels_per_meter?: number;
  speed_limit_kmh?: number;
}

export interface CameraList {
  cameras: Camera[];
  total: number;
  page: number;
  per_page: number;
}

export interface Camera {
  id: string;
  name: string;
  location?: string;
  rtsp_url?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  is_active: boolean;
  resolution_width: number;
  resolution_height: number;
  fps: number;
  pixels_per_meter: number;
  speed_limit_kmh: number;
  created_at?: string;
}

export interface JobStatus {
  job_id: string;
  status: string;
  progress: number;
  results?: Record<string, unknown>;
}

export interface SpeedTrend {
  trend: {
    hour: string;
    avg_speed: number;
    max_speed: number;
    vehicle_count: number;
  }[];
}

export interface HourlyDistribution {
  distribution: Record<number, number>;
}

export interface OverspeedEvent {
  id: string;
  vehicle_id: string;
  speed_kmh: number;
  speed_mps: number;
  position_x?: number;
  position_y?: number;
  timestamp?: string;
}

export interface VehicleTypeStats {
  types: {
    type: string;
    count: number;
    avg_speed: number;
    max_speed: number;
  }[];
}

export interface HeatmapData {
  heatmap: number[][];
  grid_size: number;
}

export const api = new ApiClient(API_BASE);
