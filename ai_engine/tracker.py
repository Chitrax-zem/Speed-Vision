"""
Vehicle Tracking Module
Uses dlib correlation tracker and optional DeepSORT for multi-object tracking.
"""

import cv2
import numpy as np
import dlib
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
import logging
import time

logger = logging.getLogger(__name__)


@dataclass
class TrackedVehicle:
    tracking_id: int
    bbox: Tuple[float, float, float, float]  # x, y, w, h
    confidence: float = 0.0
    vehicle_type: str = "unknown"
    tracker: Any = None
    frames_since_detection: int = 0
    max_frames_missing: int = 30
    speed_kmh: float = 0.0
    positions: List[Tuple[float, float]] = field(default_factory=list)
    first_seen: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)
    is_active: bool = True


class DlibTracker:
    """
    Multi-object tracker using dlib correlation trackers.
    Assigns unique IDs and maintains tracking state across frames.
    """

    def __init__(self, max_frames_missing: int = 30, iou_threshold: float = 0.3):
        self.max_frames_missing = max_frames_missing
        self.iou_threshold = iou_threshold
        self.next_id = 1
        self.tracked_vehicles: Dict[int, TrackedVehicle] = {}
        self.removed_vehicles: List[TrackedVehicle] = []

    def _compute_iou(self, bbox1: Tuple[float, float, float, float],
                     bbox2: Tuple[float, float, float, float]) -> float:
        """Compute Intersection over Union between two bounding boxes."""
        x1, y1, w1, h1 = bbox1
        x2, y2, w2, h2 = bbox2

        xa = max(x1, x2)
        ya = max(y1, y2)
        xb = min(x1 + w1, x2 + w2)
        yb = min(y1 + h1, y2 + h2)

        inter_area = max(0, xb - xa) * max(0, yb - ya)
        box1_area = w1 * h1
        box2_area = w2 * h2
        union_area = box1_area + box2_area - inter_area

        return inter_area / union_area if union_area > 0 else 0

    def _create_tracker(self, frame: np.ndarray, bbox: Tuple[float, float, float, float]) -> dlib.correlation_tracker:
        """Create and initialize a dlib correlation tracker."""
        tracker = dlib.correlation_tracker()
        x, y, w, h = bbox
        # dlib expects dlib.rectangle
        rect = dlib.rectangle(int(x), int(y), int(x + w), int(y + h))
        tracker.start_track(frame, rect)
        return tracker

    def update(self, frame: np.ndarray, detections: List[Any] = None) -> List[TrackedVehicle]:
        """
        Update tracker with new frame and optional new detections.
        Returns list of currently tracked vehicles.
        """
        # Update existing trackers
        for tid, vehicle in list(self.tracked_vehicles.items()):
            if vehicle.tracker is not None:
                try:
                    vehicle.tracker.update(frame)
                    pos = vehicle.tracker.get_position()
                    new_bbox = (pos.left(), pos.top(), pos.width(), pos.height())
                    vehicle.bbox = new_bbox

                    # Record center position for speed calculation
                    cx = pos.left() + pos.width() / 2
                    cy = pos.top() + pos.height() / 2
                    vehicle.positions.append((cx, cy))
                    vehicle.last_seen = time.time()
                    vehicle.frames_since_detection = 0
                except Exception as e:
                    logger.warning(f"Tracker update failed for vehicle {tid}: {e}")
                    vehicle.frames_since_detection += 1

        # Match new detections to existing trackers
        if detections is not None:
            unmatched_detections = list(range(len(detections)))
            matched_trackers = set()

            for det_idx in unmatched_detections[:]:
                det = detections[det_idx]
                best_iou = self.iou_threshold
                best_tid = None

                for tid, vehicle in self.tracked_vehicles.items():
                    if tid in matched_trackers:
                        continue
                    iou = self._compute_iou(det.bbox, vehicle.bbox)
                    if iou > best_iou:
                        best_iou = iou
                        best_tid = tid

                if best_tid is not None:
                    # Update existing tracker with new detection
                    vehicle = self.tracked_vehicles[best_tid]
                    vehicle.tracker = self._create_tracker(frame, det.bbox)
                    vehicle.bbox = det.bbox
                    vehicle.confidence = det.confidence
                    vehicle.vehicle_type = det.vehicle_type
                    vehicle.frames_since_detection = 0
                    matched_trackers.add(best_tid)
                    unmatched_detections.remove(det_idx)

            # Create new trackers for unmatched detections
            for det_idx in unmatched_detections:
                det = detections[det_idx]
                tracker = self._create_tracker(frame, det.bbox)
                vehicle = TrackedVehicle(
                    tracking_id=self.next_id,
                    bbox=det.bbox,
                    confidence=det.confidence,
                    vehicle_type=det.vehicle_type,
                    tracker=tracker
                )
                self.tracked_vehicles[self.next_id] = vehicle
                self.next_id += 1

        # Remove lost vehicles
        for tid, vehicle in list(self.tracked_vehicles.items()):
            if vehicle.frames_since_detection > self.max_frames_missing:
                vehicle.is_active = False
                self.removed_vehicles.append(vehicle)
                del self.tracked_vehicles[tid]

        return list(self.tracked_vehicles.values())

    def get_active_vehicles(self) -> List[TrackedVehicle]:
        """Get all currently active tracked vehicles."""
        return [v for v in self.tracked_vehicles.values() if v.is_active]

    def get_all_vehicles(self) -> List[TrackedVehicle]:
        """Get all vehicles including removed ones."""
        return list(self.tracked_vehicles.values()) + self.removed_vehicles

    def reset(self):
        """Reset the tracker state."""
        self.tracked_vehicles.clear()
        self.removed_vehicles.clear()
        self.next_id = 1


class VehicleTracker:
    """
    High-level vehicle tracker that wraps the tracking backend.
    """

    def __init__(self, backend: str = "dlib", max_frames_missing: int = 30,
                 iou_threshold: float = 0.3):
        self.backend = backend
        if backend == "dlib":
            self._tracker = DlibTracker(max_frames_missing, iou_threshold)
        else:
            self._tracker = DlibTracker(max_frames_missing, iou_threshold)
        logger.info(f"Vehicle tracker initialized with {backend} backend")

    def update(self, frame: np.ndarray, detections: List[Any] = None) -> List[TrackedVehicle]:
        """Update tracking with new frame."""
        return self._tracker.update(frame, detections)

    def get_active_vehicles(self) -> List[TrackedVehicle]:
        return self._tracker.get_active_vehicles()

    def reset(self):
        self._tracker.reset()

    def draw_tracks(self, frame: np.ndarray, vehicles: List[TrackedVehicle] = None,
                    color: Tuple[int, int, int] = (255, 165, 0),
                    show_trail: bool = True) -> np.ndarray:
        """Draw tracking visualization on frame."""
        if vehicles is None:
            vehicles = self.get_active_vehicles()

        annotated = frame.copy()
        for vehicle in vehicles:
            x, y, w, h = vehicle.bbox
            # Draw bounding box
            cv2.rectangle(annotated, (int(x), int(y)), (int(x + w), int(y + h)),
                          color, 2)

            # Draw ID label
            label = f"ID:{vehicle.tracking_id} {vehicle.vehicle_type}"
            (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(annotated, (int(x), int(y) - label_h - 8),
                          (int(x) + label_w, int(y)), color, -1)
            cv2.putText(annotated, label, (int(x), int(y) - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

            # Draw speed if available
            if vehicle.speed_kmh > 0:
                speed_label = f"{vehicle.speed_kmh:.1f} km/h"
                cv2.putText(annotated, speed_label, (int(x), int(y + h) + 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

            # Draw position trail
            if show_trail and len(vehicle.positions) > 1:
                points = [(int(p[0]), int(p[1])) for p in vehicle.positions[-30:]]
                for i in range(1, len(points)):
                    alpha = i / len(points)
                    c = tuple(int(c * alpha) for c in color)
                    cv2.line(annotated, points[i - 1], points[i], c, 2)

        return annotated
