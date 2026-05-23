"""
Vehicle Detection Module
Supports Haar Cascade and YOLOv8 detection backends.
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
import logging
import os

logger = logging.getLogger(__name__)


@dataclass
class Detection:
    bbox: Tuple[float, float, float, float]  # x, y, w, h
    confidence: float
    vehicle_type: str = "unknown"
    class_id: int = -1


class HaarCascadeDetector:
    """Haar Cascade based vehicle detector using OpenCV."""

    VEHICLE_CASCADES = {
        "car": "cars.xml",
        "bus": "Bus.xml",
        "truck": "truck.xml",
    }

    # Fallback to OpenCV built-in cascades
    OPENCV_CASCADES = {
        "car": cv2.data.haarcascades + "haarcascade_car.xml",
    }

    def __init__(self, scale_factor: float = 1.1, min_neighbors: int = 3,
                 min_size: Tuple[int, int] = (50, 50)):
        self.scale_factor = scale_factor
        self.min_neighbors = min_neighbors
        self.min_size = min_size
        self.cascades = {}
        self._load_cascades()

    def _load_cascades(self):
        """Load available Haar cascade classifiers."""
        # Use OpenCV built-in car cascade as primary
        cascade_path = cv2.data.haarcascades + "haarcascade_car.xml"
        if os.path.exists(cascade_path):
            self.cascades["car"] = cv2.CascadeClassifier(cascade_path)
            logger.info(f"Loaded car Haar cascade from {cascade_path}")

        # Also load pedestrian/bike for two-wheelers
        cascade_path2 = cv2.data.haarcascades + "haarcascade_russian_plate_number.xml"
        if os.path.exists(cascade_path2):
            self.cascades["plate"] = cv2.CascadeClassifier(cascade_path2)

        # LBP cascade for cars as fallback
        cascade_path3 = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        # We'll use the car cascade as the primary detector

        if not self.cascades:
            logger.warning("No Haar cascades loaded. Detection will not work.")

    def detect(self, frame: np.ndarray) -> List[Detection]:
        """Detect vehicles in a frame using Haar cascades."""
        detections = []
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        for vehicle_type, cascade in self.cascades.items():
            if vehicle_type == "plate":
                continue
            vehicles = cascade.detectMultiScale(
                gray,
                scaleFactor=self.scale_factor,
                minNeighbors=self.min_neighbors,
                minSize=self.min_size
            )
            for (x, y, w, h) in vehicles:
                det = Detection(
                    bbox=(float(x), float(y), float(w), float(h)),
                    confidence=0.7,  # Haar cascades don't provide confidence
                    vehicle_type=vehicle_type,
                    class_id=0
                )
                detections.append(det)

        return detections


class YOLOv8Detector:
    """YOLOv8 based vehicle detector using ultralytics."""

    VEHICLE_CLASSES = {
        2: "car",
        3: "motorcycle",
        5: "bus",
        7: "truck",
    }

    def __init__(self, model_path: str = "yolov8n.pt", confidence: float = 0.5,
                 device: str = "cpu"):
        self.model_path = model_path
        self.confidence = confidence
        self.device = device
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load YOLOv8 model."""
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
            logger.info(f"YOLOv8 model loaded from {self.model_path}")
        except ImportError:
            logger.warning("Ultralytics not installed. YOLOv8 detection unavailable.")
        except Exception as e:
            logger.warning(f"Failed to load YOLOv8 model: {e}")

    def detect(self, frame: np.ndarray) -> List[Detection]:
        """Detect vehicles in a frame using YOLOv8."""
        if self.model is None:
            return []

        detections = []
        try:
            results = self.model(frame, conf=self.confidence, device=self.device, verbose=False)
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        class_id = int(box.cls[0])
                        if class_id in self.VEHICLE_CLASSES:
                            xyxy = box.xyxy[0].cpu().numpy()
                            x, y, x2, y2 = xyxy
                            w, h = x2 - x, y2 - y
                            det = Detection(
                                bbox=(float(x), float(y), float(w), float(h)),
                                confidence=float(box.conf[0]),
                                vehicle_type=self.VEHICLE_CLASSES.get(class_id, "unknown"),
                                class_id=class_id
                            )
                            detections.append(det)
        except Exception as e:
            logger.error(f"YOLOv8 detection error: {e}")

        return detections


class VehicleDetector:
    """
    Unified vehicle detector that supports multiple backends.
    Automatically falls back to Haar Cascade if YOLOv8 is unavailable.
    """

    def __init__(self, backend: str = "haar", confidence: float = 0.5,
                 model_path: str = "yolov8n.pt", device: str = "cpu",
                 scale_factor: float = 1.1, min_neighbors: int = 3,
                 min_size: Tuple[int, int] = (50, 50)):
        self.backend = backend
        self.confidence = confidence
        self._detector = None

        if backend == "yolov8":
            try:
                self._detector = YOLOv8Detector(
                    model_path=model_path,
                    confidence=confidence,
                    device=device
                )
                logger.info("Using YOLOv8 detector")
            except Exception as e:
                logger.warning(f"YOLOv8 init failed, falling back to Haar: {e}")
                self._detector = HaarCascadeDetector(scale_factor, min_neighbors, min_size)
                self.backend = "haar"
        else:
            self._detector = HaarCascadeDetector(scale_factor, min_neighbors, min_size)
            logger.info("Using Haar Cascade detector")

    def detect(self, frame: np.ndarray) -> List[Detection]:
        """Detect vehicles in the given frame."""
        if self._detector is None:
            return []
        return self._detector.detect(frame)

    def draw_detections(self, frame: np.ndarray, detections: List[Detection],
                        color: Tuple[int, int, int] = (0, 255, 0),
                        thickness: int = 2) -> np.ndarray:
        """Draw bounding boxes on the frame."""
        annotated = frame.copy()
        for det in detections:
            x, y, w, h = det.bbox
            cv2.rectangle(annotated, (int(x), int(y)), (int(x + w), int(y + h)),
                          color, thickness)
            label = f"{det.vehicle_type} {det.confidence:.2f}"
            (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(annotated, (int(x), int(y) - label_h - 5),
                          (int(x) + label_w, int(y)), color, -1)
            cv2.putText(annotated, label, (int(x), int(y) - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        return annotated
