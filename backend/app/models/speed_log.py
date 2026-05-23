import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.session import Base


class SpeedLog(Base):
    __tablename__ = "speed_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    speed_kmh = Column(Float, nullable=False)
    speed_mps = Column(Float, nullable=False)
    is_overspeed = Column(Boolean, default=False)
    position_x = Column(Float, nullable=True)
    position_y = Column(Float, nullable=True)
    frame_number = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="speed_logs")
