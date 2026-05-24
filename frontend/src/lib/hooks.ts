'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useAuthStore } from './store';
import { useEffect, useRef, useCallback } from 'react';

// Auth hooks
export function useLogin() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.login(username, password),
    onSuccess: (data) => {
      api.setToken(data.access_token);
      setAuth(data.user, data.access_token);
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: ({ email, username, password, full_name }: {
      email: string; username: string; password: string; full_name?: string
    }) => api.register(email, username, password, full_name),
    onSuccess: (data) => {
      api.setToken(data.access_token);
      setAuth(data.user, data.access_token);
    },
  });
}

// Dashboard hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
    refetchInterval: 30000,
  });
}

// Vehicle hooks
export function useVehicles(params?: { page?: number; per_page?: number; vehicle_type?: string }) {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => api.getVehicles(params),
  });
}

export function useVehicleStats() {
  return useQuery({
    queryKey: ['vehicle-stats'],
    queryFn: () => api.getVehicleStats(),
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => api.getVehicle(id),
    enabled: !!id,
  });
}

// Camera hooks
export function useCameras(params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['cameras', params],
    queryFn: () => api.getCameras(params),
  });
}

// Analytics hooks
export function useSpeedTrend(hours = 24) {
  return useQuery({
    queryKey: ['speed-trend', hours],
    queryFn: () => api.getSpeedTrend(hours),
  });
}

export function useHourlyDistribution() {
  return useQuery({
    queryKey: ['hourly-distribution'],
    queryFn: () => api.getHourlyDistribution(),
  });
}

export function useOverspeedEvents(limit = 50) {
  return useQuery({
    queryKey: ['overspeed-events', limit],
    queryFn: () => api.getOverspeedEvents(limit),
  });
}

export function useVehicleTypeStats() {
  return useQuery({
    queryKey: ['vehicle-type-stats'],
    queryFn: () => api.getVehicleTypeStats(),
  });
}

export function useHeatmap(cameraId?: string) {
  return useQuery({
    queryKey: ['heatmap', cameraId],
    queryFn: () => api.getHeatmap(cameraId),
  });
}

// Video upload hook
export function useVideoUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, options }: { file: File; options?: Record<string, unknown> }) =>
      api.uploadVideo(file, options as { pixels_per_meter?: number; speed_limit_kmh?: number; detection_backend?: string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

// Job status polling hook
export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['job-status', jobId],
    queryFn: () => api.getJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'completed' || data?.status === 'failed') return false;
      return 2000;
    },
  });
}

// WebSocket hook
export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = url.replace('http', 'ws').replace('https', 'wss');
    const clientId = `client-${Date.now()}`;
    const ws = new WebSocket(`${wsUrl}/ws/${clientId}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'detections' }));
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'alerts' }));
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'analytics' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const listeners = listenersRef.current.get(message.type);
        if (listeners) {
          listeners.forEach((fn) => fn(message.data));
        }
      } catch (e) {
        console.error('WebSocket message parse error:', e);
      }
    };

    ws.onclose = () => {
      setTimeout(connect, 3000);
    };

    wsRef.current = ws;
  }, [url]);

  const subscribe = useCallback((type: string, callback: (data: unknown) => void) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type)!.add(callback);
    return () => listenersRef.current.get(type)?.delete(callback);
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { subscribe, disconnect };
}
