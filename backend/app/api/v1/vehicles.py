from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.vehicle import Vehicle, VehicleType
from app.models.speed_log import SpeedLog
from app.models.detection import Detection
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


class VehicleResponse(BaseModel):
    id: str
    tracking_id: str
    vehicle_type: str
    confidence: float
    avg_speed: float
    max_speed: float
    direction: Optional[str]
    lane: Optional[int]
    first_seen: Optional[str]
    last_seen: Optional[str]
    camera_id: Optional[str]


class VehicleListResponse(BaseModel):
    vehicles: List[VehicleResponse]
    total: int
    page: int
    per_page: int


@router.get("/", response_model=VehicleListResponse)
async def list_vehicles(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    vehicle_type: Optional[str] = None,
    camera_id: Optional[str] = None,
    min_speed: Optional[float] = None,
    max_speed: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Vehicle)

    if vehicle_type:
        query = query.where(Vehicle.vehicle_type == vehicle_type)
    if camera_id:
        query = query.where(Vehicle.camera_id == camera_id)
    if min_speed is not None:
        query = query.where(Vehicle.max_speed >= min_speed)
    if max_speed is not None:
        query = query.where(Vehicle.max_speed <= max_speed)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    # Paginate
    query = query.offset((page - 1) * per_page).limit(per_page).order_by(Vehicle.created_at.desc())
    result = await db.execute(query)
    vehicles = result.scalars().all()

    return VehicleListResponse(
        vehicles=[
            VehicleResponse(
                id=v.id,
                tracking_id=v.tracking_id,
                vehicle_type=v.vehicle_type.value if isinstance(v.vehicle_type, VehicleType) else v.vehicle_type,
                confidence=v.confidence,
                avg_speed=v.avg_speed,
                max_speed=v.max_speed,
                direction=v.direction,
                lane=v.lane,
                first_seen=v.first_seen.isoformat() if v.first_seen else None,
                last_seen=v.last_seen.isoformat() if v.last_seen else None,
                camera_id=v.camera_id,
            ) for v in vehicles
        ],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/stats")
async def get_vehicle_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    total_vehicles = (await db.execute(select(func.count(Vehicle.id)))).scalar()
    avg_speed = (await db.execute(select(func.avg(Vehicle.avg_speed)))).scalar() or 0
    max_speed = (await db.execute(select(func.max(Vehicle.max_speed)))).scalar() or 0

    type_dist = (await db.execute(
        select(Vehicle.vehicle_type, func.count(Vehicle.id)).group_by(Vehicle.vehicle_type)
    )).all()

    return {
        "total_vehicles": total_vehicles,
        "average_speed": round(float(avg_speed), 2),
        "max_speed": round(float(max_speed), 2),
        "vehicle_type_distribution": {str(t): c for t, c in type_dist},
    }


@router.get("/{vehicle_id}")
async def get_vehicle(
    vehicle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.get("/{vehicle_id}/speed-logs")
async def get_vehicle_speed_logs(
    vehicle_id: str,
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(SpeedLog)
        .where(SpeedLog.vehicle_id == vehicle_id)
        .order_by(SpeedLog.timestamp.desc())
        .limit(limit)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "speed_kmh": log.speed_kmh,
            "speed_mps": log.speed_mps,
            "is_overspeed": log.is_overspeed,
            "position_x": log.position_x,
            "position_y": log.position_y,
            "frame_number": log.frame_number,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        }
        for log in logs
    ]


@router.delete("/{vehicle_id}")
async def delete_vehicle(
    vehicle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    await db.delete(vehicle)
    return {"message": "Vehicle deleted"}
