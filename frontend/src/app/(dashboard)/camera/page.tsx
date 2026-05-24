'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
  Camera, Plus, MapPin, Wifi, WifiOff, Settings, Trash2, Edit
} from 'lucide-react';
import { useState } from 'react';

const mockCameras = [
  { id: 'cam-1', name: 'Highway North Cam', location: 'Highway 101 - North', status: 'online', fps: 30, speed_limit: 60, resolution: '1920x1080', ppm: 15 },
  { id: 'cam-2', name: 'Downtown Intersection', location: 'Main St & 5th Ave', status: 'online', fps: 25, speed_limit: 40, resolution: '1920x1080', ppm: 12 },
  { id: 'cam-3', name: 'School Zone Monitor', location: 'Oak Street School', status: 'online', fps: 30, speed_limit: 30, resolution: '1280x720', ppm: 18 },
  { id: 'cam-4', name: 'Bridge Toll Cam', location: 'River Bridge West', status: 'offline', fps: 30, speed_limit: 80, resolution: '1920x1080', ppm: 10 },
  { id: 'cam-5', name: 'Industrial Zone', location: 'Factory Road', status: 'online', fps: 25, speed_limit: 50, resolution: '1920x1080', ppm: 14 },
  { id: 'cam-6', name: 'Residential Area', location: 'Pine Street', status: 'maintenance', fps: 30, speed_limit: 30, resolution: '1280x720', ppm: 16 },
];

export default function CameraPage() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cameras</h1>
          <p className="text-muted-foreground mt-1">Manage camera feeds and stream settings</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger render={<Button className="gradient-primary text-white border-0" />}>
              <Plus className="mr-2 w-4 h-4" />Add Camera
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Camera</DialogTitle>
              <DialogDescription>Configure a new camera feed for monitoring</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Camera Name</Label>
                <Input placeholder="e.g., Highway North Cam" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="e.g., Highway 101 - North Exit" />
              </div>
              <div className="space-y-2">
                <Label>RTSP URL</Label>
                <Input placeholder="rtsp://username:password@ip:port/stream" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Speed Limit (km/h)</Label>
                  <Input type="number" defaultValue={60} />
                </div>
                <div className="space-y-2">
                  <Label>Pixels/Meter</Label>
                  <Input type="number" defaultValue={15} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button className="gradient-primary text-white border-0" onClick={() => setShowAdd(false)}>Add Camera</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCameras.map((camera) => (
          <motion.div
            key={camera.id}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden">
              {/* Camera Preview */}
              <div className="aspect-video bg-slate-900 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {camera.status === 'online' ? (
                    <div className="text-center">
                      <Camera className="w-10 h-10 text-green-500/50 mx-auto mb-2" />
                      <p className="text-xs text-green-500/70">Live Feed</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <WifiOff className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground/50">
                        {camera.status === 'offline' ? 'Offline' : 'Maintenance'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="absolute top-3 left-3">
                  <Badge
                    variant={camera.status === 'online' ? 'default' : camera.status === 'maintenance' ? 'secondary' : 'destructive'}
                    className="text-xs gap-1"
                  >
                    {camera.status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {camera.status}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  {camera.status === 'online' && (
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{camera.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{camera.location}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">FPS</p>
                    <p className="text-sm font-medium">{camera.fps}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Limit</p>
                    <p className="text-sm font-medium">{camera.speed_limit}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">PPM</p>
                    <p className="text-sm font-medium">{camera.ppm}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="mr-1 w-3 h-3" />Config
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
