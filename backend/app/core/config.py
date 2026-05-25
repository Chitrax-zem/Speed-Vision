import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "VehicleSpeedTracker"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:Saurabh2000@localhost:5432/MyDatabase"
    DATABASE_URL_SYNC: str = "postgresql://postgres:Saurabh2000@localhost:5432/MyDatabase"

    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "1c2bd015a8a5b9c735b44f4d9fca85288938fc278b1d8385c166356d7533f3125d28bf63aea0bd2740841034"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: list = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://speed-vision.onrender.com/api/v1",
    ]

    UPLOAD_DIR: str = "/tmp/uploads"
    MAX_UPLOAD_SIZE: int = 500 * 1024 * 1024  # 500MB

    FPS_DEFAULT: float = 30.0
    PIXELS_PER_METER: float = 15.0
    SPEED_LIMIT_KMH: float = 60.0

    DETECTION_MODEL: str = "haar"  # "haar" or "yolov8"
    YOLO_MODEL_PATH: str = "yolov8n.pt"
    CONFIDENCE_THRESHOLD: float = 0.5

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
