"""
Lane Detection Module
Detects road lanes using edge detection and Hough transforms.
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class Lane:
    id: int
    points: List[Tuple[int, int]]
    direction: str = "unknown"  # "northbound", "southbound", etc.


class LaneDetector:
    """
    Detects road lanes from video frames using Canny edge detection
    and Hough line transforms. Assigns vehicles to detected lanes.
    """

    def __init__(self, roi_vertices: Optional[np.ndarray] = None,
                 canny_low: int = 50, canny_high: int = 150,
                 hough_rho: int = 1, hough_theta: float = np.pi / 180,
                 hough_threshold: int = 50, min_line_length: int = 100,
                 max_line_gap: int = 50):
        self.roi_vertices = roi_vertices
        self.canny_low = canny_low
        self.canny_high = canny_high
        self.hough_rho = hough_rho
        self.hough_theta = hough_theta
        self.hough_threshold = hough_threshold
        self.min_line_length = min_line_length
        self.max_line_gap = max_line_gap
        self.detected_lanes: List[Lane] = []
        self._lane_id_counter = 0

    def _region_of_interest(self, frame: np.ndarray) -> np.ndarray:
        """Apply region of interest mask."""
        if self.roi_vertices is not None:
            mask = np.zeros_like(frame)
            cv2.fillPoly(mask, [self.roi_vertices], 255)
            return cv2.bitwise_and(frame, mask)

        # Default ROI: lower half of the frame
        h, w = frame.shape[:2]
        vertices = np.array([[
            (w * 0.1, h),
            (w * 0.4, h * 0.4),
            (w * 0.6, h * 0.4),
            (w * 0.9, h)
        ]], dtype=np.int32)
        mask = np.zeros_like(frame)
        cv2.fillPoly(mask, [vertices], 255)
        return cv2.bitwise_and(frame, mask)

    def detect_lanes(self, frame: np.ndarray) -> List[Lane]:
        """
        Detect lane lines in the given frame.

        Returns a list of Lane objects with detected lane boundaries.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blur, self.canny_low, self.canny_high)
        roi_edges = self._region_of_interest(edges)

        lines = cv2.HoughLinesP(
            roi_edges,
            self.hough_rho,
            self.hough_theta,
            self.hough_threshold,
            minLineLength=self.min_line_length,
            maxLineGap=self.max_line_gap
        )

        lanes = []
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                self._lane_id_counter += 1
                lane = Lane(
                    id=self._lane_id_counter,
                    points=[(int(x1), int(y1)), (int(x2), int(y2))]
                )
                lanes.append(lane)

        self.detected_lanes = lanes
        return lanes

    def assign_vehicle_to_lane(self, vehicle_position: Tuple[float, float]) -> int:
        """
        Determine which lane a vehicle is in based on its position.
        Returns lane index (0-based).
        """
        if not self.detected_lanes:
            return 0

        vx, vy = vehicle_position
        min_dist = float('inf')
        assigned_lane = 0

        for i, lane in enumerate(self.detected_lanes):
            for px, py in lane.points:
                dist = np.sqrt((vx - px) ** 2 + (vy - py) ** 2)
                if dist < min_dist:
                    min_dist = dist
                    assigned_lane = i

        return assigned_lane

    def draw_lanes(self, frame: np.ndarray, lanes: List[Lane] = None,
                   color: Tuple[int, int, int] = (255, 255, 0),
                   thickness: int = 2) -> np.ndarray:
        """Draw detected lane lines on the frame."""
        if lanes is None:
            lanes = self.detected_lanes

        annotated = frame.copy()
        for lane in lanes:
            for i in range(len(lane.points) - 1):
                cv2.line(annotated, lane.points[i], lane.points[i + 1],
                         color, thickness)

        return annotated
