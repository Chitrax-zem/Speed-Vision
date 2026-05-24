'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Settings, User, Bell, Palette, Shield, Database, Globe, Key
} from 'lucide-react';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and application preferences</p>
      </div>

      {/* Profile */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="John Doe" defaultValue="Admin User" />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input placeholder="johndoe" defaultValue="admin" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="you@example.com" defaultValue="admin@speedvision.io" />
          </div>
          <Button onClick={() => toast.success('Profile updated!')}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="w-5 h-5" />Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Theme</p>
              <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
            </div>
            <Select value={theme} onValueChange={(value) => setTheme(value ?? 'system')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Animations</p>
              <p className="text-xs text-muted-foreground">Enable smooth UI animations</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Compact Mode</p>
              <p className="text-xs text-muted-foreground">Reduce spacing and padding</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />Notifications
          </CardTitle>
          <CardDescription>Configure alert preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Overspeed Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified when vehicles exceed speed limit</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Camera Status</p>
              <p className="text-xs text-muted-foreground">Alert when cameras go offline</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Processing Complete</p>
              <p className="text-xs text-muted-foreground">Notify when video processing finishes</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive email for critical alerts</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Detection Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />Detection Settings
          </CardTitle>
          <CardDescription>Configure AI detection parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Detection Model</Label>
            <Select defaultValue="haar">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="haar">Haar Cascade (Fast)</SelectItem>
                <SelectItem value="yolov8">YOLOv8 (Accurate)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Confidence Threshold</Label>
              <Input type="number" defaultValue={0.5} step={0.05} min={0} max={1} />
            </div>
            <div className="space-y-2">
              <Label>Speed Limit (km/h)</Label>
              <Input type="number" defaultValue={60} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pixels Per Meter</Label>
              <Input type="number" defaultValue={15} />
            </div>
            <div className="space-y-2">
              <Label>Process Every N Frames</Label>
              <Input type="number" defaultValue={1} min={1} max={10} />
            </div>
          </div>
          <Button onClick={() => toast.success('Detection settings saved!')}>Save Detection Settings</Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/30 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-lg text-red-500 flex items-center gap-2">
            <Key className="w-5 h-5" />Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Reset API Key</p>
              <p className="text-xs text-muted-foreground">Generate a new API key (invalidates current)</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => toast.success('API key regenerated')}>Reset Key</Button>
          </div>
          <Separator className="bg-red-500/20" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Delete All Data</p>
              <p className="text-xs text-muted-foreground">Permanently delete all detection data and logs</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => toast.error('This action is disabled in demo mode')}>Delete All</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
