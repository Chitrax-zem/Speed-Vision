import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);

interface AppState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  theme: 'dark',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));

interface DetectionState {
  isMonitoring: boolean;
  currentJobId: string | null;
  totalDetections: number;
  currentVehicles: number;
  averageSpeed: number;
  overspeedAlerts: number;
  setMonitoring: (val: boolean) => void;
  setCurrentJob: (id: string | null) => void;
  updateStats: (stats: Partial<DetectionState>) => void;
  reset: () => void;
}

export const useDetectionStore = create<DetectionState>((set) => ({
  isMonitoring: false,
  currentJobId: null,
  totalDetections: 0,
  currentVehicles: 0,
  averageSpeed: 0,
  overspeedAlerts: 0,
  setMonitoring: (val) => set({ isMonitoring: val }),
  setCurrentJob: (id) => set({ currentJobId: id }),
  updateStats: (stats) => set((state) => ({ ...state, ...stats })),
  reset: () => set({
    isMonitoring: false,
    currentJobId: null,
    totalDetections: 0,
    currentVehicles: 0,
    averageSpeed: 0,
    overspeedAlerts: 0,
  }),
}));
