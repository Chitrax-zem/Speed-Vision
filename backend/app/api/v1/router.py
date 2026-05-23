from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.vehicles import router as vehicles_router
from app.api.v1.cameras import router as cameras_router
from app.api.v1.video import router as video_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.reports import router as reports_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(vehicles_router)
api_router.include_router(cameras_router)
api_router.include_router(video_router)
api_router.include_router(analytics_router)
api_router.include_router(reports_router)
