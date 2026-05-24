'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Users, Camera, Car, AlertTriangle, Activity,
  Settings, Database, BarChart3, Lock
} from 'lucide-react';

const systemStats = [
  { label: 'Total Users', value: 24, icon: Users, color: 'text-blue-500' },
  { label: 'Active Cameras', value: 8, icon: Camera, color: 'text-green-500' },
  { label: 'Vehicles Today', value: 1284, icon: Car, color: 'text-violet-500' },
  { label: 'Overspeed Alerts', value: 47, icon: AlertTriangle, color: 'text-red-500' },
];

const users = [
  { name: 'Admin User', email: 'admin@speedvision.io', role: 'admin', status: 'active', lastLogin: '2 min ago' },
  { name: 'John Operator', email: 'john@speedvision.io', role: 'operator', status: 'active', lastLogin: '1 hour ago' },
  { name: 'Jane Viewer', email: 'jane@speedvision.io', role: 'viewer', status: 'active', lastLogin: '3 hours ago' },
  { name: 'Bob Operator', email: 'bob@speedvision.io', role: 'operator', status: 'inactive', lastLogin: '2 days ago' },
];

const systemLogs = [
  { time: '14:32:05', level: 'info', message: 'Camera cam-1 reconnected successfully' },
  { time: '14:30:12', level: 'warning', message: 'High overspeed rate detected on Highway 101' },
  { time: '14:28:45', level: 'info', message: 'Video processing job job-8a3f completed' },
  { time: '14:25:33', level: 'error', message: 'Camera cam-4 connection lost' },
  { time: '14:22:10', level: 'info', message: 'New vehicle V-1042 tracked and logged' },
  { time: '14:20:01', level: 'info', message: 'Daily report generated successfully' },
];

export default function AdminPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />Admin Panel
        </h1>
        <p className="text-muted-foreground mt-1">System administration and management</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {systemStats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`p-3 rounded-xl bg-muted/50`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />User Management
            </CardTitle>
            <Badge variant="secondary">{users.length} users</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.map((user) => (
              <div key={user.email} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                    {user.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={user.role === 'admin' ? 'default' : user.role === 'operator' ? 'secondary' : 'outline'}
                    className="text-xs capitalize"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    {user.role}
                  </Badge>
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {user.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Logs */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />System Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {systemLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30">
                <span className="text-xs text-muted-foreground font-mono whitespace-nowrap mt-0.5">{log.time}</span>
                <Badge
                  variant={log.level === 'error' ? 'destructive' : log.level === 'warning' ? 'secondary' : 'outline'}
                  className="text-[10px] h-5"
                >
                  {log.level}
                </Badge>
                <p className="text-sm">{log.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'CPU Usage', value: 34, icon: Activity, color: '#3b82f6' },
          { label: 'Memory', value: 62, icon: Database, color: '#8b5cf6' },
          { label: 'GPU', value: 78, icon: Settings, color: '#10b981' },
        ].map((resource) => (
          <Card key={resource.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <resource.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{resource.label}</span>
                </div>
                <span className="text-lg font-bold">{resource.value}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${resource.value}%`, background: resource.color }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Endpoints */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />API Endpoints Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { endpoint: '/api/v1/auth/login', method: 'POST', status: 'active' },
              { endpoint: '/api/v1/vehicles/', method: 'GET', status: 'active' },
              { endpoint: '/api/v1/video/upload', method: 'POST', status: 'active' },
              { endpoint: '/api/v1/analytics/dashboard', method: 'GET', status: 'active' },
              { endpoint: '/api/v1/cameras/', method: 'GET', status: 'active' },
              { endpoint: '/ws/{client_id}', method: 'WS', status: 'active' },
            ].map((api) => (
              <div key={api.endpoint} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={api.method === 'GET' ? 'default' : api.method === 'POST' ? 'secondary' : 'outline'}
                    className="text-xs font-mono"
                  >
                    {api.method}
                  </Badge>
                  <code className="text-xs font-mono">{api.endpoint}</code>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
