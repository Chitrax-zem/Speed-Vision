'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDetectionStore } from '@/lib/store';
import {
  Monitor, Play, Square, Maximize2, Settings, Volume2,
  AlertTriangle, Car, Gauge, Activity, RefreshCw
} from 'lucide-react';

const mockDetections = [
  { id: 1, type: 'Car', speed: 67.3, bbox: [120, 80, 200, 150], confidence: 0.94 },
  { id: 2, type: 'Truck', speed: 45.2, bbox: [350, 100, 180, 140], confidence: 0.88 },
  { id: 3, type: 'Motorcycle', speed: 72.1, bbox: [550, 120, 100, 80], confidence: 0.91 },
];

export default function MonitorPage() {
  const { isMonitoring, setMonitoring, currentVehicles, averageSpeed, overspeedAlerts, updateStats } = useDetectionStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isMonitoring || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 960;
    canvas.height = 540;

    let frame = 0;
    const vehicles = mockDetections.map((d) => ({
      ...d,
      x: d.bbox[0] + Math.random() * 200,
      y: d.bbox[1] + Math.random() * 100,
      dx: (Math.random() - 0.3) * 3,
      dy: (Math.random() - 0.5) * 0.5,
    }));

    function drawFrame() {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw road
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, canvas.height * 0.3, canvas.width, canvas.height * 0.5);

      // Road lines
      ctx.setLineDash([20, 20]);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.55);
      ctx.lineTo(canvas.width, canvas.height * 0.55);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw vehicles
      vehicles.forEach((v) => {
        v.x += v.dx;
        v.y += v.dy;
        if (v.x > canvas.width + 50) v.x = -100;
        if (v.x < -150) v.x = canvas.width + 50;

        const w = v.type === 'Motorcycle' ? 40 : v.type === 'Truck' ? 80 : 60;
        const h = v.type === 'Motorcycle' ? 30 : v.type === 'Truck' ? 50 : 40;

        // Bounding box
        const isOverspeed = v.speed > 60;
        ctx.strokeStyle = isOverspeed ? '#ef4444' : '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(v.x, v.y, w, h);

        // Fill
        ctx.fillStyle = isOverspeed ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)';
        ctx.fillRect(v.x, v.y, w, h);

        // Label background
        ctx.fillStyle = isOverspeed ? '#ef4444' : '#3b82f6';
        ctx.fillRect(v.x, v.y - 18, 80, 18);

        // Label text
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.fillText(`ID:${v.id} ${v.speed.toFixed(1)}km/h`, v.x + 4, v.y - 5);

        // Trail
        ctx.beginPath();
        ctx.strokeStyle = isOverspeed ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
          const tx = v.x - i * v.dx * 2;
          const ty = v.y - i * v.dy * 2;
          if (i === 0) ctx.moveTo(tx + w / 2, ty + h / 2);
          else ctx.lineTo(tx + w / 2, ty + h / 2);
        }
        ctx.stroke();
      });

      // HUD overlay
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(8, 8, 220, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`🚗 Vehicles: ${vehicles.length}`, 16, 30);
      ctx.fillText(`⚡ Avg Speed: ${(vehicles.reduce((a, b) => a + b.speed, 0) / vehicles.length).toFixed(1)} km/h`, 16, 50);
      ctx.fillText(`⚠️ Overspeed: ${vehicles.filter(v => v.speed > 60).length}`, 16, 70);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText(`Frame: ${frame++} | ${new Date().toLocaleTimeString()}`, 16, 95);

      // Camera info
      ctx.fillStyle = 'rgba(239,68,68,0.8)';
      ctx.beginPath();
      ctx.arc(canvas.width - 25, 25, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.fillText('REC', canvas.width - 60, 30);

      animFrameRef.current = requestAnimationFrame(drawFrame);
    }

    drawFrame();

    // Simulate stats updates
    const interval = setInterval(() => {
      updateStats({
        currentVehicles: vehicles.length,
        averageSpeed: vehicles.reduce((a, b) => a + b.speed, 0) / vehicles.length,
        overspeedAlerts: vehicles.filter(v => v.speed > 60).length,
      });
    }, 1000);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(interval);
    };
  }, [isMonitoring, updateStats]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Monitor</h1>
          <p className="text-muted-foreground mt-1">Real-time vehicle detection and speed tracking</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setMonitoring(!isMonitoring)}
            className={isMonitoring ? 'bg-red-600 hover:bg-red-700' : 'gradient-primary text-white border-0'}
          >
            {isMonitoring ? (
              <><Square className="mr-2 w-4 h-4" />Stop</>
            ) : (
              <><Play className="mr-2 w-4 h-4" />Start Monitoring</>
            )}
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Car, label: 'Active Vehicles', value: currentVehicles || 3, color: 'text-blue-500' },
          { icon: Gauge, label: 'Avg Speed', value: `${(averageSpeed || 61.5).toFixed(1)} km/h`, color: 'text-violet-500' },
          { icon: AlertTriangle, label: 'Overspeed', value: overspeedAlerts || 2, color: 'text-red-500' },
          { icon: Activity, label: 'Status', value: isMonitoring ? 'Active' : 'Idle', color: 'text-green-500' },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video Feed */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0 relative">
          <canvas
            ref={canvasRef}
            className="w-full aspect-video bg-slate-900"
          />
          {!isMonitoring && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
              <div className="text-center">
                <Monitor className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Feed</h3>
                <p className="text-muted-foreground mb-4">Start monitoring to view live detection</p>
                <Button onClick={() => setMonitoring(true)} className="gradient-primary text-white border-0">
                  <Play className="mr-2 w-4 h-4" />Start Monitoring
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detection List */}
      {isMonitoring && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Active Detections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockDetections.map((det) => (
                <div key={det.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${det.speed > 60 ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div>
                      <span className="font-medium">ID: {det.id}</span>
                      <Badge variant="outline" className="ml-2 text-xs">{det.type}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-sm ${det.speed > 60 ? 'text-red-500' : ''}`}>
                      {det.speed} km/h
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {(det.confidence * 100).toFixed(0)}%
                    </Badge>
                    {det.speed > 60 && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertTriangle className="w-3 h-3" /> Overspeed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
