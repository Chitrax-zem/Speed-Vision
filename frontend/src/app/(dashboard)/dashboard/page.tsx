'use client';

import { motion } from 'framer-motion';
import {
  Car, Gauge, AlertTriangle, Camera, TrendingUp, Activity,
  ArrowUpRight, ArrowDownRight, Eye, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboardStats } from '@/lib/hooks';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const statCards = [
  { key: 'total_vehicles_detected', label: 'Total Vehicles', icon: Car, color: 'from-blue-500 to-cyan-500', suffix: '' },
  { key: 'average_speed_kmh', label: 'Avg Speed', icon: Gauge, color: 'from-violet-500 to-purple-500', suffix: ' km/h' },
  { key: 'overspeed_alerts', label: 'Overspeed Alerts', icon: AlertTriangle, color: 'from-red-500 to-orange-500', suffix: '' },
  { key: 'active_cameras', label: 'Active Cameras', icon: Camera, color: 'from-green-500 to-emerald-500', suffix: '' },
];

const mockSpeedTrend = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  avg_speed: 20 + Math.random() * 40,
  count: Math.floor(Math.random() * 50) + 10,
}));

const mockVehicleTypes = [
  { name: 'Car', value: 45, color: '#3b82f6' },
  { name: 'Truck', value: 20, color: '#8b5cf6' },
  { name: 'Motorcycle', value: 15, color: '#f59e0b' },
  { name: 'Bus', value: 12, color: '#10b981' },
  { name: 'Van', value: 8, color: '#ef4444' },
];

const mockHourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  vehicles: Math.floor(Math.random() * 80) + 10,
}));

const recentDetections = [
  { id: 'V-1042', type: 'Car', speed: 67.3, time: '2 min ago', overspeed: true },
  { id: 'V-1041', type: 'Truck', speed: 45.2, time: '4 min ago', overspeed: false },
  { id: 'V-1040', type: 'Motorcycle', speed: 72.1, time: '6 min ago', overspeed: true },
  { id: 'V-1039', type: 'Car', speed: 38.7, time: '8 min ago', overspeed: false },
  { id: 'V-1038', type: 'Bus', speed: 52.4, time: '12 min ago', overspeed: false },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  const dashboardStats = stats || {
    total_vehicles_detected: 12847,
    average_speed_kmh: 42.6,
    overspeed_alerts: 234,
    active_cameras: 8,
    total_cameras: 12,
    recent_detections_24h: 892,
    vehicle_type_distribution: { car: 45, truck: 20, motorcycle: 15, bus: 12, van: 8 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time traffic monitoring overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 py-1.5">
            <Activity className="w-3 h-3 text-green-500" />
            <span className="text-green-500">Live</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1.5">
            <Clock className="w-3 h-3" />
            Updated just now
          </Badge>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const value = dashboardStats[card.key as keyof typeof dashboardStats];
          const isUp = i % 2 === 0;
          return (
            <motion.div key={card.key} variants={itemVariants}>
              <Card className="relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className={`flex items-center text-xs font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                      {isUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                      {isUp ? '+12.5%' : '-3.2%'}
                    </div>
                  </div>
                  <p className="text-2xl font-bold">
                    {typeof value === 'number' ? value.toLocaleString() : typeof value === 'string' ? value : ''}
                    {card.suffix}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
                </CardContent>
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Speed Trend Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Speed Trend (24h)</CardTitle>
              <Badge variant="secondary" className="text-xs">Real-time</Badge>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockSpeedTrend}>
                  <defs>
                    <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.3)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.3)" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(12px)',
                    }}
                  />
                  <Area type="monotone" dataKey="avg_speed" stroke="#3b82f6" fill="url(#speedGradient)" strokeWidth={2} name="Avg Speed (km/h)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vehicle Type Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Vehicle Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={mockVehicleTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mockVehicleTypes.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {mockVehicleTypes.map((type) => (
                  <div key={type.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: type.color }} />
                    <span className="text-muted-foreground">{type.name}</span>
                    <span className="font-medium ml-auto">{type.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Traffic */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Hourly Traffic Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={mockHourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.3)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.3)" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="vehicles" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Detections */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Recent Detections</CardTitle>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {recentDetections.map((det) => (
                <div key={det.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${det.overspeed ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="text-sm font-medium">{det.id}</p>
                      <p className="text-xs text-muted-foreground">{det.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${det.overspeed ? 'text-red-500' : ''}`}>
                      {det.speed} km/h
                    </p>
                    <p className="text-xs text-muted-foreground">{det.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50 bg-gradient-to-r from-blue-600/5 via-violet-600/5 to-purple-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <p className="text-sm text-muted-foreground mt-1">Start monitoring or upload a video to begin analysis</p>
              </div>
              <div className="flex gap-3">
                <a href="/monitor"><Button className="gradient-primary text-white border-0"><Activity className="mr-2 w-4 h-4" />Start Monitoring</Button></a>
                <a href="/upload"><Button variant="outline"><TrendingUp className="mr-2 w-4 h-4" />Upload Video</Button></a>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
