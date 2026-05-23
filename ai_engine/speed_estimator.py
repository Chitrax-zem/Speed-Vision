"""
Speed Estimation Module
Calculates vehicle speed using pixel displacement and FPS-based conversion.
Formula: speed = d_meters × fps × 3.6
"""

import numpy as np
from typing import List, Tuple, Optional
from dataclasses import dataclass
import logging
import time

logger = logging.getLogger(__name__)


@dataclass
class SpeedReading:
    vehicle_id: int
    speed_kmh: float
    speed_mps: float
    is_overspeed: bool
    position: Tuple[float, float]
    timestamp: float
    frame_number: int = 0


class SpeedEstimator:
    """
    Estimates vehicle speed based on pixel displacement between frames.

    The speed calculation uses the formula:
        speed_kmh = distance_meters × fps × 3.6

    Where:
        distance_meters = pixel_distance / pixels_per_meter
        fps = frames per second of the video
        3.6 = conversion factor from m/s to km/h
    """

    def __init__(self, pixels_per_meter: float = 15.0, fps: float = 30.0,
                 speed_limit_kmh: float = 60.0, smoothing_window: int = 5,
                 min_displacement: float = 2.0):
        self.pixels_per_meter = pixels_per_meter
        self.fps = fps
        self.speed_limit_kmh = speed_limit_kmh
        self.smoothing_window = smoothing_window
        self.min_displacement = min_displacement
        self.speed_history: dict = {}  # vehicle_id -> list of recent speeds
        self.frame_count = 0

    def update_config(self, pixels_per_meter: float = None, fps: float = None,
                      speed_limit_kmh: float = None):
        """Update estimation parameters."""
        if pixels_per_meter is not None:
            self.pixels_per_meter = pixels_per_meter
        if fps is not None:
            self.fps = fps
        if speed_limit_kmh is not None:
            self.speed_limit_kmh = speed_limit_kmh

    def estimate_speed(self, vehicle_id: int,
                       positions: List[Tuple[float, float]],
                       frame_number: int = 0) -> Optional[SpeedReading]:
        """
        Estimate speed for a tracked vehicle based on its position history.

        Args:
            vehicle_id: Unique vehicle tracking ID
            positions: List of (x, y) center positions over time
            frame_number: Current frame number

        Returns:
            SpeedReading if speed can be calculated, None otherwise
        """
        if len(positions) < 2:
            return None

        # Use last two positions for instantaneous speed
        current_pos = positions[-1]
        prev_pos = positions[-2]

        # Calculate pixel displacement
        dx = current_pos[0] - prev_pos[0]
        dy = current_pos[1] - prev_pos[1]
        pixel_distance = np.sqrt(dx ** 2 + dy ** 2)

        # Filter out noise (very small displacements)
        if pixel_distance < self.min_displacement:
            # Return last known speed if available
            if vehicle_id in self.speed_history and self.speed_history[vehicle_id]:
                last_speed = self.speed_history[vehicle_id][-1]
                return SpeedReading(
                    vehicle_id=vehicle_id,
                    speed_kmh=last_speed,
                    speed_mps=last_speed / 3.6,
                    is_overspeed=last_speed > self.speed_limit_kmh,
                    position=current_pos,
                    timestamp=time.time(),
                    frame_number=frame_number
                )
            return None

        # Convert pixel distance to meters
        distance_meters = pixel_distance / self.pixels_per_meter

        # Calculate speed: speed = d_meters × fps × 3.6
        speed_mps = distance_meters * self.fps
        speed_kmh = speed_mps * 3.6

        # Smooth speed using moving average
        if vehicle_id not in self.speed_history:
            self.speed_history[vehicle_id] = []
        self.speed_history[vehicle_id].append(speed_kmh)

        # Keep only recent speeds for smoothing
        if len(self.speed_history[vehicle_id]) > self.smoothing_window:
            self.speed_history[vehicle_id] = self.speed_history[vehicle_id][-self.smoothing_window:]

        smoothed_speed = np.mean(self.speed_history[vehicle_id])

        # Clamp negative or unrealistic speeds
        smoothed_speed = max(0.0, min(smoothed_speed, 300.0))

        is_overspeed = smoothed_speed > self.speed_limit_kmh

        return SpeedReading(
            vehicle_id=vehicle_id,
            speed_kmh=round(smoothed_speed, 2),
            speed_mps=round(smoothed_speed / 3.6, 2),
            is_overspeed=is_overspeed,
            position=current_pos,
            timestamp=time.time(),
            frame_number=frame_number
        )

    def estimate_speed_multi_frame(self, vehicle_id: int,
                                    positions: List[Tuple[float, float]],
                                    frame_number: int = 0,
                                    num_frames: int = 5) -> Optional[SpeedReading]:
        """
        Estimate speed using multi-frame displacement for more accuracy.
        Uses positions from the last N frames.
        """
        if len(positions) < num_frames + 1:
            return self.estimate_speed(vehicle_id, positions, frame_number)

        recent_positions = positions[-(num_frames + 1):]
        start_pos = recent_positions[0]
        end_pos = recent_positions[-1]

        total_dx = end_pos[0] - start_pos[0]
        total_dy = end_pos[1] - start_pos[1]
        total_pixel_distance = np.sqrt(total_dx ** 2 + total_dy ** 2)

        if total_pixel_distance < self.min_displacement * num_frames:
            return self.estimate_speed(vehicle_id, positions, frame_number)

        total_distance_meters = total_pixel_distance / self.pixels_per_meter
        time_seconds = num_frames / self.fps
        speed_mps = total_distance_meters / time_seconds if time_seconds > 0 else 0
        speed_kmh = speed_mps * 3.6

        if vehicle_id not in self.speed_history:
            self.speed_history[vehicle_id] = []
        self.speed_history[vehicle_id].append(speed_kmh)

        if len(self.speed_history[vehicle_id]) > self.smoothing_window:
            self.speed_history[vehicle_id] = self.speed_history[vehicle_id][-self.smoothing_window:]

        smoothed_speed = max(0.0, min(np.mean(self.speed_history[vehicle_id]), 300.0))

        return SpeedReading(
            vehicle_id=vehicle_id,
            speed_kmh=round(smoothed_speed, 2),
            speed_mps=round(smoothed_speed / 3.6, 2),
            is_overspeed=smoothed_speed > self.speed_limit_kmh,
            position=end_pos,
            timestamp=time.time(),
            frame_number=frame_number
        )

    def get_statistics(self) -> dict:
        """Get speed estimation statistics."""
        all_speeds = []
        overspeed_count = 0
        for vid, speeds in self.speed_history.items():
            all_speeds.extend(speeds)
            # This is approximate; real overspeed tracking is per-reading

        if not all_speeds:
            return {
                "total_vehicles": 0,
                "avg_speed": 0.0,
                "max_speed": 0.0,
                "min_speed": 0.0,
                "overspeed_count": 0
            }

        return {
            "total_vehicles": len(self.speed_history),
            "avg_speed": round(np.mean(all_speeds), 2),
            "max_speed": round(np.max(all_speeds), 2),
            "min_speed": round(np.min(all_speeds), 2),
            "overspeed_count": overspeed_count
        }

    def reset(self):
        """Reset speed estimation state."""
        self.speed_history.clear()
        self.frame_count = 0
