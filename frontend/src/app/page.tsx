'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap, Shield, Camera, BarChart3, Cpu, Eye, Gauge,
  ArrowRight, Play, CheckCircle2, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Eye,
    title: 'Real-Time Detection',
    description: 'Advanced AI detects and classifies vehicles in real-time using Haar Cascade and YOLOv8 models.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Gauge,
    title: 'Speed Estimation',
    description: 'Pixel-based speed calculation with precision calibration. Formula: speed = d_meters × fps × 3.6',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Shield,
    title: 'Overspeed Alerts',
    description: 'Instant notifications when vehicles exceed configured speed limits with configurable thresholds.',
    gradient: 'from-red-500 to-orange-500',
  },
  {
    icon: Camera,
    title: 'Multi-Camera Support',
    description: 'Connect unlimited RTSP/CCTV streams with independent processing pipelines per camera.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Comprehensive dashboards with heatmaps, trend analysis, and downloadable PDF/CSV reports.',
    gradient: 'from-yellow-500 to-amber-500',
  },
  {
    icon: Cpu,
    title: 'AI Processing Pipeline',
    description: 'Full pipeline: Detection → Tracking → Speed Calc → Visualization → Analytics Storage.',
    gradient: 'from-pink-500 to-rose-500',
  },
];

const stats = [
  { value: '99.2%', label: 'Detection Accuracy' },
  { value: '30+', label: 'FPS Processing' },
  { value: '10K+', label: 'Vehicles Tracked' },
  { value: '<100ms', label: 'Alert Latency' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-600/5 rounded-full blur-3xl animate-float" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Traffic Intelligence</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Vehicle Detection &
            <br />
            <span className="gradient-text">Speed Tracking</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Enterprise-grade AI platform for real-time vehicle detection, tracking, and speed monitoring.
            Transform your traffic cameras into intelligent monitoring systems.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <Link href="/register">
              <Button size="lg" className="gradient-primary text-white border-0 px-8 h-12 text-base">
                Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                <Play className="mr-2 w-4 h-4" /> Live Demo
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful <span className="gradient-text">Features</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need for intelligent traffic monitoring, built with cutting-edge AI and computer vision.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Processing <span className="gradient-text">Pipeline</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              From raw video to actionable insights in milliseconds
            </p>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {['Input Video', 'Frame Extraction', 'Vehicle Detection', 'Tracking', 'Speed Calc', 'Visualization', 'Analytics'].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="px-6 py-3 rounded-xl bg-card border border-border/50 font-medium text-sm shadow-sm">
                  {step}
                </div>
                {i < 6 && <ArrowRight className="w-4 h-4 text-muted-foreground hidden md:block" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your <span className="gradient-text">Traffic Monitoring?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of organizations using SpeedVision for intelligent traffic management.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register"><Button size="lg" className="gradient-primary text-white border-0 px-8 h-12">Start Free Trial <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card</span>
              <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> Cloud ready</span>
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-purple-500" /> Enterprise security</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">SpeedVision</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 SpeedVision. AI-Powered Traffic Intelligence Platform.</p>
        </div>
      </footer>
    </div>
  );
}
