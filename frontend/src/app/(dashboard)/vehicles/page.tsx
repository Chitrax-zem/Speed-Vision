'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Car, Search, Filter, Download, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';

const mockVehicles = Array.from({ length: 20 }, (_, i) => ({
  id: `V-${1000 + i}`,
  tracking_id: `T-${2000 + i}`,
  type: ['Car', 'Truck', 'Bus', 'Motorcycle', 'Van'][i % 5],
  avg_speed: (25 + Math.random() * 45).toFixed(1),
  max_speed: (40 + Math.random() * 55).toFixed(1),
  confidence: (0.7 + Math.random() * 0.28).toFixed(2),
  first_seen: new Date(Date.now() - Math.random() * 86400000 * 7).toLocaleDateString(),
  status: Math.random() > 0.7 ? 'overspeed' : 'normal',
}));

export default function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = mockVehicles.filter((v) => {
    const matchSearch = v.id.toLowerCase().includes(search.toLowerCase()) ||
      v.type.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || v.type.toLowerCase() === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground mt-1">Vehicle detection records and speed logs</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 w-4 h-4" />Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 w-4 h-4" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="bus">Bus</SelectItem>
                <SelectItem value="motorcycle">Motorcycle</SelectItem>
                <SelectItem value="van">Van</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary">{filtered.length} results</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tracking ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Avg Speed</TableHead>
                <TableHead>Max Speed</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>First Seen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((vehicle) => (
                <TableRow key={vehicle.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono font-medium">{vehicle.id}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{vehicle.tracking_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      {vehicle.type}
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.avg_speed} km/h</TableCell>
                  <TableCell className="font-medium">{vehicle.max_speed} km/h</TableCell>
                  <TableCell>{(parseFloat(vehicle.confidence) * 100).toFixed(0)}%</TableCell>
                  <TableCell className="text-muted-foreground">{vehicle.first_seen}</TableCell>
                  <TableCell>
                    <Badge variant={vehicle.status === 'overspeed' ? 'destructive' : 'secondary'} className="text-xs">
                      {vehicle.status === 'overspeed' ? 'Overspeed' : 'Normal'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">Page {page}</span>
          <Button variant="outline" size="icon" onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
