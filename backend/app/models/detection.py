import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.session import Base


class Detection(Base):
    __tablename__ = "detections"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=True)
    bbox_x = Column(Float, nullable=False)
    bbox_y = Column(Float, nullable=False)
    bbox_w = Column(Float, nullable=False)
    bbox_h = Column(Float, nullable=False)
    confidence = Column(Float, default=0.0)
    vehicle_type = Column(String, nullable=True)
    frame_number = Column(Integer, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="detections")
