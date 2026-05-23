import uuid
from sqlalchemy import Column, String, Boolean, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.session import Base


class CameraStatus(str, enum.Enum):
    online = "online"
    offline = "offline"
    maintenance = "maintenance"


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    rtsp_url = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(Enum(CameraStatus), default=CameraStatus.online)
    is_active = Column(Boolean, default=True)
    resolution_width = Column(Float, default=1920)
    resolution_height = Column(Float, default=1080)
    fps = Column(Float, default=30.0)
    pixels_per_meter = Column(Float, default=15.0)
    speed_limit_kmh = Column(Float, default=60.0)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vehicles = relationship("Vehicle", back_populates="camera")
    owner = relationship("User", back_populates="cameras")
