'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVideoUpload, useJobStatus } from '@/lib/hooks';
import { Upload, FileVideo, Settings2, Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [config, setConfig] = useState({
    pixels_per_meter: 15,
    speed_limit_kmh: 60,
    detection_backend: 'haar',
  });

  const uploadMutation = useVideoUpload();
  const { data: jobStatus } = useJobStatus(jobId);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) {
      setFile(f);
      toast.success(`File selected: ${f.name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.avi', '.mov', '.webm'] },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return;
    try {
      const result = await uploadMutation.mutateAsync({ file, options: config });
      setJobId(result.job_id);
      toast.success('Video uploaded and processing started!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Video Upload</h1>
        <p className="text-muted-foreground mt-1">Upload a video file for AI-powered vehicle detection and speed tracking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : file
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/30'
                }`}
              >
                <input {...getInputProps()} />
                <motion.div animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}>
                  {file ? (
                    <>
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold mb-1">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Drop another file to replace</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-semibold mb-1">
                        {isDragActive ? 'Drop your video here' : 'Drag & drop your video'}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        or click to browse • MP4, AVI, MOV, WebM up to 500MB
                      </p>
                      <Button variant="outline" type="button">
                        <FileVideo className="mr-2 w-4 h-4" />Choose File
                      </Button>
                    </>
                  )}
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Status */}
          {jobId && jobStatus && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {jobStatus.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : jobStatus.status === 'failed' ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  Processing Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">{jobStatus.status}</Badge>
                  <span className="text-sm text-muted-foreground">Job: {jobId.slice(0, 8)}...</span>
                </div>
                <Progress value={jobStatus.progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {jobStatus.status === 'processing' && 'Analyzing video frames and detecting vehicles...'}
                  {jobStatus.status === 'completed' && 'Processing complete! View results in the dashboard.'}
                  {jobStatus.status === 'failed' && 'Processing failed. Please try again.'}
                  {jobStatus.status === 'queued' && 'Video queued for processing...'}
                </p>
                {jobStatus.results && typeof jobStatus.results === 'object' && 'statistics' in (jobStatus.results as Record<string, unknown>) ? (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                    {(() => {
                      const stats = (jobStatus.results as Record<string, Record<string, number>>).statistics;
                      if (!stats) return null;
                      return Object.entries(stats)
                        .filter(([k]) => ['total_vehicles_detected', 'total_overspeed_events', 'avg_speed'].includes(k))
                        .map(([key, val]) => (
                          <div key={key} className="text-center">
                            <p className="text-lg font-bold">{typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(1)) : String(val)}</p>
                            <p className="text-xs text-muted-foreground">{key.replace(/_/g, ' ').replace('total ', '')}</p>
                          </div>
                        ));
                    })()}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="w-5 h-5" />Configuration
              </CardTitle>
              <CardDescription>Adjust detection parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Detection Model</Label>
                <Select
                  value={config.detection_backend}
                  onValueChange={(v) => setConfig({ ...config, detection_backend: v ?? 'yolov8n' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haar">Haar Cascade (Fast)</SelectItem>
                    <SelectItem value="yolov8">YOLOv8 (Accurate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pixels Per Meter</Label>
                <Input
                  type="number"
                  value={config.pixels_per_meter}
                  onChange={(e) => setConfig({ ...config, pixels_per_meter: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Calibration value for speed calculation</p>
              </div>

              <div className="space-y-2">
                <Label>Speed Limit (km/h)</Label>
                <Input
                  type="number"
                  value={config.speed_limit_kmh}
                  onChange={(e) => setConfig({ ...config, speed_limit_kmh: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Overspeed alert threshold</p>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || uploadMutation.isPending}
                className="w-full gradient-primary text-white border-0 h-11"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Play className="mr-2 w-4 h-4" />Start Processing</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-border/50 bg-blue-600/5">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">Speed Formula</h4>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm text-center">
                speed = d_meters × fps × 3.6
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Where d_meters = pixel_distance / pixels_per_meter
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
