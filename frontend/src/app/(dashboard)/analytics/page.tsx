'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const speedTrendData = Array.from({ length: 48 }, (_, i) => ({
  time: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
  avg_speed: 25 + Math.random() * 35,
  max_speed: 50 + Math.random() * 40,
  vehicles: Math.floor(Math.random() * 60) + 10,
}));

const vehicleTypeData = [
  { name: 'Car', count: 5420, avgSpeed: 44.2, color: '#3b82f6' },
  { name: 'Truck', count: 2130, avgSpeed: 38.7, color: '#8b5cf6' },
  { name: 'Bus', count: 890, avgSpeed: 35.1, color: '#10b981' },
  { name: 'Motorcycle', count: 1560, avgSpeed: 52.3, color: '#f59e0b' },
  { name: 'Van', count: 1240, avgSpeed: 41.8, color: '#ef4444' },
];

const overspeedByHour = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  overspeed: Math.floor(Math.random() * 15),
  normal: Math.floor(Math.random() * 40) + 20,
}));

const weeklyTrend = [
  { day: 'Mon', vehicles: 1240, avgSpeed: 42.1 },
  { day: 'Tue', vehicles: 1380, avgSpeed: 44.3 },
  { day: 'Wed', vehicles: 1120, avgSpeed: 39.8 },
  { day: 'Thu', vehicles: 1450, avgSpeed: 43.2 },
  { day: 'Fri', vehicles: 1680, avgSpeed: 46.7 },
  { day: 'Sat', vehicles: 980, avgSpeed: 38.4 },
  { day: 'Sun', vehicles: 760, avgSpeed: 35.1 },
];

const heatmapData = Array.from({ length: 7 }, () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 100))
);

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('24h');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive traffic analytics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value ?? '24h')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 w-4 h-4" />Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Vehicles', value: '12,847', change: '+12.5%', color: 'text-green-500' },
          { label: 'Avg Speed', value: '42.6 km/h', change: '+3.2%', color: 'text-green-500' },
          { label: 'Overspeed Events', value: '234', change: '-8.1%', color: 'text-red-500' },
          { label: 'Detection Rate', value: '99.2%', change: '+0.5%', color: 'text-green-500' },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <span className={`text-xs font-medium ${stat.color}`}>{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Speed Trend */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />Speed Trend Analysis
          </CardTitle>
          <Badge variant="secondary">Real-time</Badge>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={speedTrendData}>
              <defs>
                <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.3)" interval={5} />
              <YAxis tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.3)" />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Legend />
              <Area type="monotone" dataKey="avg_speed" stroke="#3b82f6" fill="url(#avgGrad)" strokeWidth={2} name="Avg Speed" />
              <Area type="monotone" dataKey="max_speed" stroke="#ef4444" fill="url(#maxGrad)" strokeWidth={2} name="Max Speed" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Type Distribution */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieIcon className="w-5 h-5" />Vehicle Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={vehicleTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={55}
                  dataKey="count"
                  label={({ name, percent }: any) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {vehicleTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {vehicleTypeData.map((type) => (
                <div key={type.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: type.color }} />
                    <span className="text-sm">{type.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{type.count.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{type.avgSpeed} km/h avg</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overspeed by Hour */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />Overspeed Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={overspeedByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.3)" />
                <YAxis tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.3)" />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Bar dataKey="normal" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Normal" stackId="a" />
                <Bar dataKey="overspeed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Overspeed" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />Weekly Traffic Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" />
              <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" />
              <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="vehicles" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Vehicles" />
              <Line yAxisId="right" type="monotone" dataKey="avgSpeed" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Avg Speed" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detection Heatmap */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Detection Heatmap (by Day & Hour)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="flex items-center gap-1 mb-2 pl-12">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground">
                    {String(i).padStart(2, '0')}
                  </div>
                ))}
              </div>
              {heatmapData.map((row, dayIdx) => (
                <div key={dayIdx} className="flex items-center gap-1 mb-1">
                  <span className="w-10 text-xs text-muted-foreground text-right pr-2">{days[dayIdx]}</span>
                  {row.map((val, hourIdx) => {
                    const intensity = Math.min(val / 80, 1);
                    return (
                      <div
                        key={hourIdx}
                        className="flex-1 aspect-square rounded-sm cursor-pointer hover:ring-1 hover:ring-white/30 transition-all"
                        style={{
                          background: `rgba(59, 130, 246, ${0.1 + intensity * 0.8})`,
                        }}
                        title={`${days[dayIdx]} ${String(hourIdx).padStart(2, '0')}:00 - ${val} detections`}
                      />
                    );
                  })}
                </div>
              ))}
              <div className="flex items-center gap-2 mt-3 pl-12">
                <span className="text-xs text-muted-foreground">Less</span>
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
                  <div
                    key={opacity}
                    className="w-4 h-4 rounded-sm"
                    style={{ background: `rgba(59, 130, 246, ${opacity})` }}
                  />
                ))}
                <span className="text-xs text-muted-foreground">More</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
