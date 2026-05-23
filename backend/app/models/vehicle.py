import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.session import Base


class VehicleType(str, enum.Enum):
    car = "car"
    truck = "truck"
    bus = "bus"
    motorcycle = "motorcycle"
    bicycle = "bicycle"
    van = "van"
    unknown = "unknown"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tracking_id = Column(String, index=True, nullable=False)
    vehicle_type = Column(Enum(VehicleType), default=VehicleType.unknown)
    confidence = Column(Float, default=0.0)
    avg_speed = Column(Float, default=0.0)
    max_speed = Column(Float, default=0.0)
    direction = Column(String, nullable=True)
    lane = Column(Integer, nullable=True)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    speed_logs = relationship("SpeedLog", back_populates="vehicle", cascade="all, delete-orphan")
    detections = relationship("Detection", back_populates="vehicle", cascade="all, delete-orphan")
    camera = relationship("Camera", back_populates="vehicles")
    created_by_user = relationship("User", back_populates="vehicles")
