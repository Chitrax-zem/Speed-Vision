"""
Processing Pipeline
Orchestrates the complete video processing workflow:
Input Video → Frame Extraction → Vehicle Detection → Tracking → Speed Calculation → Visualization → Analytics Storage
"""

import cv2
import numpy as np
import asyncio
import json
import time
import logging
from typing import List, Dict, Any, Optional, Callable, AsyncGenerator
from dataclasses import dataclass, field
from pathlib import Path

from ai_engine.detector import VehicleDetector, Detection
from ai_engine.tracker import VehicleTracker, TrackedVehicle
from ai_engine.speed_estimator import SpeedEstimator, SpeedReading
from ai_engine.lane_detector import LaneDetector

logger = logging.getLogger(__name__)


@dataclass
class PipelineConfig:
    detection_backend: str = "haar"
    tracking_backend: str = "dlib"
    confidence_threshold: float = 0.5
    pixels_per_meter: float = 15.0
    fps: float = 30.0
    speed_limit_kmh: float = 60.0
    yolo_model_path: str = "yolov8n.pt"
    device: str = "cpu"
    detect_lanes: bool = False
    draw_annotations: bool = True
    process_every_n_frames: int = 1
    max_vehicles: int = 100


@dataclass
class FrameResult:
    frame_number: int
    timestamp: float
    vehicles: List[Dict[str, Any]] = field(default_factory=list)
    total_count: int = 0
    overspeed_count: int = 0
    avg_speed: float = 0.0
    annotated_frame: Optional[np.ndarray] = None
    raw_detections: List[Detection] = field(default_factory=list)
    speed_readings: List[SpeedReading] = field(default_factory=list)


class ProcessingPipeline:
    """
    Complete video processing pipeline that integrates detection, tracking,
    speed estimation, and visualization.
    """

    def __init__(self, config: PipelineConfig = None):
        self.config = config or PipelineConfig()

        # Initialize components
        self.detector = VehicleDetector(
            backend=self.config.detection_backend,
            confidence=self.config.confidence_threshold,
            model_path=self.config.yolo_model_path,
            device=self.config.device
        )

        self.tracker = VehicleTracker(
            backend=self.config.tracking_backend
        )

        self.speed_estimator = SpeedEstimator(
            pixels_per_meter=self.config.pixels_per_meter,
            fps=self.config.fps,
            speed_limit_kmh=self.config.speed_limit_kmh
        )

        self.lane_detector = LaneDetector() if self.config.detect_lanes else None

        # Statistics
        self.total_frames_processed = 0
        self.total_vehicles_detected = 0
        self.total_overspeed_events = 0
        self.all_speeds: List[float] = []
        self.vehicle_counts_by_type: Dict[str, int] = {}

        # Callbacks for real-time updates
        self._on_frame_callback: Optional[Callable] = None
        self._on_overspeed_callback: Optional[Callable] = None

    def on_frame(self, callback: Callable):
        """Register callback for each processed frame."""
        self._on_frame_callback = callback

    def on_overspeed(self, callback: Callable):
        """Register callback for overspeed events."""
        self._on_overspeed_callback = callback

    def process_frame(self, frame: np.ndarray, frame_number: int = 0) -> FrameResult:
        """Process a single frame through the complete pipeline."""
        # Step 1: Vehicle Detection
        detections = self.detector.detect(frame)

        # Step 2: Vehicle Tracking
        tracked_vehicles = self.tracker.update(frame, detections)

        # Step 3: Speed Estimation
        speed_readings = []
        for vehicle in tracked_vehicles:
            if len(vehicle.positions) >= 2:
                reading = self.speed_estimator.estimate_speed(
                    vehicle_id=vehicle.tracking_id,
                    positions=vehicle.positions,
                    frame_number=frame_number
                )
                if reading is not None:
                    vehicle.speed_kmh = reading.speed_kmh
                    speed_readings.append(reading)

                    if reading.is_overspeed:
                        self.total_overspeed_events += 1
                        if self._on_overspeed_callback:
                            self._on_overspeed_callback(reading)

        # Step 4: Lane Detection (optional)
        lanes = None
        if self.lane_detector:
            lanes = self.lane_detector.detect_lanes(frame)

        # Step 5: Build result
        vehicle_data = []
        for vehicle in tracked_vehicles:
            vdata = {
                "tracking_id": vehicle.tracking_id,
                "vehicle_type": vehicle.vehicle_type,
                "bbox": list(vehicle.bbox),
                "speed_kmh": vehicle.speed_kmh,
                "confidence": vehicle.confidence,
                "positions_count": len(vehicle.positions),
            }
            vehicle_data.append(vdata)

            # Update statistics
            self.vehicle_counts_by_type[vehicle.vehicle_type] = \
                self.vehicle_counts_by_type.get(vehicle.vehicle_type, 0) + 1

        # Calculate frame statistics
        current_speeds = [r.speed_kmh for r in speed_readings]
        avg_speed = np.mean(current_speeds) if current_speeds else 0.0
        overspeed_count = sum(1 for r in speed_readings if r.is_overspeed)

        self.all_speeds.extend(current_speeds)
        self.total_frames_processed += 1
        self.total_vehicles_detected += len(tracked_vehicles)

        result = FrameResult(
            frame_number=frame_number,
            timestamp=time.time(),
            vehicles=vehicle_data,
            total_count=len(tracked_vehicles),
            overspeed_count=overspeed_count,
            avg_speed=round(avg_speed, 2),
            raw_detections=detections,
            speed_readings=speed_readings
        )

        # Step 6: Visualization
        if self.config.draw_annotations:
            annotated = frame.copy()
            # Draw detections (green boxes)
            annotated = self.detector.draw_detections(annotated, detections, (0, 255, 0), 2)
            # Draw tracking overlays (orange boxes with IDs)
            annotated = self.tracker.draw_tracks(annotated, tracked_vehicles, (255, 165, 0))
            # Draw lanes if detected
            if lanes:
                annotated = self.lane_detector.draw_lanes(annotated, lanes)
            # Draw HUD overlay
            annotated = self._draw_hud(annotated, result)
            result.annotated_frame = annotated

        # Invoke callback
        if self._on_frame_callback:
            self._on_frame_callback(result)

        return result

    def process_video(self, video_path: str, output_path: str = None) -> List[FrameResult]:
        """
        Process a complete video file through the pipeline.
        Yields FrameResult for each processed frame.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        # Update FPS from video metadata
        video_fps = cap.get(cv2.CAP_PROP_FPS)
        if video_fps > 0:
            self.config.fps = video_fps
            self.speed_estimator.fps = video_fps

        writer = None
        if output_path:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            writer = cv2.VideoWriter(output_path, fourcc, video_fps, (width, height))

        results = []
        frame_number = 0

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_number % self.config.process_every_n_frames == 0:
                    result = self.process_frame(frame, frame_number)
                    results.append(result)

                    if writer and result.annotated_frame is not None:
                        writer.write(result.annotated_frame)

                frame_number += 1
        finally:
            cap.release()
            if writer:
                writer.release()

        return results

    async def process_video_async(self, video_path: str,
                                    output_path: str = None) -> AsyncGenerator[FrameResult, None]:
        """Async generator version of video processing for streaming results."""
        loop = asyncio.get_event_loop()

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        video_fps = cap.get(cv2.CAP_PROP_FPS)
        if video_fps > 0:
            self.config.fps = video_fps
            self.speed_estimator.fps = video_fps

        writer = None
        if output_path:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            writer = cv2.VideoWriter(output_path, fourcc, video_fps, (width, height))

        frame_number = 0
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_number % self.config.process_every_n_frames == 0:
                    result = await loop.run_in_executor(
                        None, self.process_frame, frame, frame_number
                    )
                    yield result

                    if writer and result.annotated_frame is not None:
                        writer.write(result.annotated_frame)

                frame_number += 1
        finally:
            cap.release()
            if writer:
                writer.release()

    def process_stream(self, stream_url: str) -> AsyncGenerator[FrameResult, None]:
        """Process an RTSP/CCTV stream (sync generator for compatibility)."""
        cap = cv2.VideoCapture(stream_url)
        if not cap.isOpened():
            raise ValueError(f"Cannot open stream: {stream_url}")

        frame_number = 0
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    logger.warning("Stream read failed, retrying...")
                    time.sleep(0.1)
                    continue

                if frame_number % self.config.process_every_n_frames == 0:
                    result = self.process_frame(frame, frame_number)
                    yield result

                frame_number += 1
        finally:
            cap.release()

    def _draw_hud(self, frame: np.ndarray, result: FrameResult) -> np.ndarray:
        """Draw heads-up display overlay with statistics."""
        h, w = frame.shape[:2]

        # Semi-transparent overlay
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 10), (320, 160), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

        # HUD text
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(frame, f"Vehicles: {result.total_count}", (20, 40), font, 0.7, (0, 255, 0), 2)
        cv2.putText(frame, f"Avg Speed: {result.avg_speed:.1f} km/h", (20, 70), font, 0.7, (0, 255, 255), 2)
        cv2.putText(frame, f"Overspeed: {result.overspeed_count}", (20, 100), font, 0.7, (0, 0, 255), 2)
        cv2.putText(frame, f"Frame: {result.frame_number}", (20, 130), font, 0.6, (200, 200, 200), 1)
        cv2.putText(frame, f"Limit: {self.config.speed_limit_kmh:.0f} km/h", (20, 155), font, 0.5, (150, 150, 150), 1)

        return frame

    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive pipeline statistics."""
        return {
            "total_frames_processed": self.total_frames_processed,
            "total_vehicles_detected": self.total_vehicles_detected,
            "total_overspeed_events": self.total_overspeed_events,
            "avg_speed": round(np.mean(self.all_speeds), 2) if self.all_speeds else 0.0,
            "max_speed": round(np.max(self.all_speeds), 2) if self.all_speeds else 0.0,
            "vehicle_counts_by_type": self.vehicle_counts_by_type,
            "active_vehicles": len(self.tracker.get_active_vehicles()),
        }

    def reset(self):
        """Reset pipeline state."""
        self.tracker.reset()
        self.speed_estimator.reset()
        self.total_frames_processed = 0
        self.total_vehicles_detected = 0
        self.total_overspeed_events = 0
        self.all_speeds.clear()
        self.vehicle_counts_by_type.clear()
