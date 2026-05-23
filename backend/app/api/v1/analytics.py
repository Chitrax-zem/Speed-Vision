from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from pydantic import BaseModel

from app.db.session import get_db
from app.models.vehicle import Vehicle
from app.models.speed_log import SpeedLog
from app.models.detection import Detection
from app.models.camera import Camera
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get comprehensive dashboard statistics."""
    total_vehicles = (await db.execute(select(func.count(Vehicle.id)))).scalar() or 0
    avg_speed = (await db.execute(select(func.avg(Vehicle.avg_speed)))).scalar() or 0
    max_speed = (await db.execute(select(func.max(Vehicle.max_speed)))).scalar() or 0

    overspeed_count = (await db.execute(
        select(func.count(SpeedLog.id)).where(SpeedLog.is_overspeed == True)
    )).scalar() or 0

    total_cameras = (await db.execute(select(func.count(Camera.id)))).scalar() or 0
    active_cameras = (await db.execute(
        select(func.count(Camera.id)).where(Camera.is_active == True)
    )).scalar() or 0

    # Vehicle type distribution
    type_dist = (await db.execute(
        select(Vehicle.vehicle_type, func.count(Vehicle.id)).group_by(Vehicle.vehicle_type)
    )).all()

    # Recent detections count (last 24h)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_detections = (await db.execute(
        select(func.count(Vehicle.id)).where(Vehicle.created_at >= yesterday)
    )).scalar() or 0

    return {
        "total_vehicles_detected": total_vehicles,
        "average_speed_kmh": round(float(avg_speed), 2),
        "max_speed_kmh": round(float(max_speed), 2),
        "overspeed_alerts": overspeed_count,
        "total_cameras": total_cameras,
        "active_cameras": active_cameras,
        "recent_detections_24h": recent_detections,
        "vehicle_type_distribution": {str(t): c for t, c in type_dist},
    }


@router.get("/speed-trend")
async def get_speed_trend(
    hours: int = Query(24, ge=1, le=168),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get speed trend over time."""
    since = datetime.utcnow() - timedelta(hours=hours)

    result = await db.execute(
        select(
            func.date_trunc("hour", SpeedLog.timestamp).label("hour"),
            func.avg(SpeedLog.speed_kmh).label("avg_speed"),
            func.max(SpeedLog.speed_kmh).label("max_speed"),
            func.count(SpeedLog.id).label("count"),
        )
        .where(SpeedLog.timestamp >= since)
        .group_by(func.date_trunc("hour", SpeedLog.timestamp))
        .order_by("hour")
    )

    rows = result.all()
    return {
        "trend": [
            {
                "hour": str(row.hour) if row.hour else None,
                "avg_speed": round(float(row.avg_speed), 2) if row.avg_speed else 0,
                "max_speed": round(float(row.max_speed), 2) if row.max_speed else 0,
                "vehicle_count": row.count,
            }
            for row in rows
        ]
    }


@router.get("/hourly-distribution")
async def get_hourly_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get vehicle count distribution by hour of day."""
    result = await db.execute(
        select(
            extract("hour", Vehicle.created_at).label("hour"),
            func.count(Vehicle.id).label("count"),
        )
        .group_by(extract("hour", Vehicle.created_at))
        .order_by("hour")
    )

    rows = result.all()
    distribution = {i: 0 for i in range(24)}
    for row in rows:
        if row.hour is not None:
            distribution[int(row.hour)] = row.count

    return {"distribution": distribution}


@router.get("/overspeed-events")
async def get_overspeed_events(
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get recent overspeed events."""
    result = await db.execute(
        select(SpeedLog)
        .where(SpeedLog.is_overspeed == True)
        .order_by(SpeedLog.timestamp.desc())
        .limit(limit)
    )
    events = result.scalars().all()

    return {
        "events": [
            {
                "id": e.id,
                "vehicle_id": e.vehicle_id,
                "speed_kmh": e.speed_kmh,
                "speed_mps": e.speed_mps,
                "position_x": e.position_x,
                "position_y": e.position_y,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            }
            for e in events
        ]
    }


@router.get("/vehicle-type-stats")
async def get_vehicle_type_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get detailed statistics by vehicle type."""
    result = await db.execute(
        select(
            Vehicle.vehicle_type,
            func.count(Vehicle.id).label("count"),
            func.avg(Vehicle.avg_speed).label("avg_speed"),
            func.max(Vehicle.max_speed).label("max_speed"),
        )
        .group_by(Vehicle.vehicle_type)
    )

    rows = result.all()
    return {
        "types": [
            {
                "type": str(row.vehicle_type),
                "count": row.count,
                "avg_speed": round(float(row.avg_speed), 2) if row.avg_speed else 0,
                "max_speed": round(float(row.max_speed), 2) if row.max_speed else 0,
            }
            for row in rows
        ]
    }


@router.get("/heatmap")
async def get_detection_heatmap(
    camera_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get detection heatmap data (position-based density)."""
    query = select(
        Detection.bbox_x,
        Detection.bbox_y,
    )
    if camera_id:
        query = query.where(Detection.camera_id == camera_id)

    result = await db.execute(query.limit(10000))
    rows = result.all()

    # Create a grid-based heatmap
    grid_size = 20
    heatmap = [[0] * grid_size for _ in range(grid_size)]

    for row in rows:
        gx = min(int(row.bbox_x / 100), grid_size - 1)
        gy = min(int(row.bbox_y / 100), grid_size - 1)
        gx = max(0, gx)
        gy = max(0, gy)
        heatmap[gy][gx] += 1

    return {"heatmap": heatmap, "grid_size": grid_size}
