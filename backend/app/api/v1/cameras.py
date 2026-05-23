from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.db.session import get_db
from app.models.camera import Camera, CameraStatus
from app.core.security import get_current_active_user, require_role
from app.models.user import User

router = APIRouter(prefix="/cameras", tags=["Cameras"])


class CameraCreate(BaseModel):
    name: str
    location: Optional[str] = None
    rtsp_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    resolution_width: float = 1920
    resolution_height: float = 1080
    fps: float = 30.0
    pixels_per_meter: float = 15.0
    speed_limit_kmh: float = 60.0


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    rtsp_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None
    pixels_per_meter: Optional[float] = None
    speed_limit_kmh: Optional[float] = None


@router.get("/")
async def list_cameras(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Camera)
    if status:
        query = query.where(Camera.status == status)

    total = (await db.execute(select(func.count()).select_from(Camera))).scalar()
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    cameras = result.scalars().all()

    return {
        "cameras": [
            {
                "id": c.id,
                "name": c.name,
                "location": c.location,
                "rtsp_url": c.rtsp_url,
                "latitude": c.latitude,
                "longitude": c.longitude,
                "status": c.status.value if isinstance(c.status, CameraStatus) else c.status,
                "is_active": c.is_active,
                "resolution_width": c.resolution_width,
                "resolution_height": c.resolution_height,
                "fps": c.fps,
                "pixels_per_meter": c.pixels_per_meter,
                "speed_limit_kmh": c.speed_limit_kmh,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in cameras
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.post("/", status_code=201)
async def create_camera(
    data: CameraCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    camera = Camera(
        name=data.name,
        location=data.location,
        rtsp_url=data.rtsp_url,
        latitude=data.latitude,
        longitude=data.longitude,
        resolution_width=data.resolution_width,
        resolution_height=data.resolution_height,
        fps=data.fps,
        pixels_per_meter=data.pixels_per_meter,
        speed_limit_kmh=data.speed_limit_kmh,
        owner_id=current_user.id,
    )
    db.add(camera)
    await db.flush()
    return {"id": camera.id, "name": camera.name, "status": "created"}


@router.get("/{camera_id}")
async def get_camera(
    camera_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera


@router.patch("/{camera_id}")
async def update_camera(
    camera_id: str,
    data: CameraUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(camera, key, value)

    return {"message": "Camera updated"}


@router.delete("/{camera_id}")
async def delete_camera(
    camera_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    await db.delete(camera)
    return {"message": "Camera deleted"}
