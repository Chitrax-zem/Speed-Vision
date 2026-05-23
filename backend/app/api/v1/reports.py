import io
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.vehicle import Vehicle
from app.models.speed_log import SpeedLog
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/vehicles/csv")
async def export_vehicles_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Export vehicle data as CSV."""
    result = await db.execute(select(Vehicle).order_by(Vehicle.created_at.desc()).limit(10000))
    vehicles = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Tracking ID", "Type", "Confidence", "Avg Speed", "Max Speed",
                      "Direction", "Lane", "First Seen", "Last Seen"])

    for v in vehicles:
        writer.writerow([
            v.id, v.tracking_id, v.vehicle_type, v.confidence,
            v.avg_speed, v.max_speed, v.direction, v.lane,
            v.first_seen.isoformat() if v.first_seen else "",
            v.last_seen.isoformat() if v.last_seen else "",
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=vehicles_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@router.get("/speed-logs/csv")
async def export_speed_logs_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Export speed logs as CSV."""
    result = await db.execute(select(SpeedLog).order_by(SpeedLog.timestamp.desc()).limit(50000))
    logs = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Vehicle ID", "Speed (km/h)", "Speed (m/s)", "Overspeed",
                      "Position X", "Position Y", "Frame", "Timestamp"])

    for log in logs:
        writer.writerow([
            log.id, log.vehicle_id, log.speed_kmh, log.speed_mps,
            log.is_overspeed, log.position_x, log.position_y,
            log.frame_number, log.timestamp.isoformat() if log.timestamp else "",
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=speed_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@router.get("/summary/pdf")
async def export_summary_pdf(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Export analytics summary as PDF report."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors
    except ImportError:
        raise Exception("reportlab not installed")

    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=letter)
    styles = getSampleStyleSheet()

    elements = []
    elements.append(Paragraph("Vehicle Detection & Speed Tracking Report", styles["Title"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles["Normal"]))
    elements.append(Spacer(1, 20))

    # Get stats
    from sqlalchemy import func
    total_vehicles = (await db.execute(select(func.count(Vehicle.id)))).scalar() or 0
    avg_speed = (await db.execute(select(func.avg(Vehicle.avg_speed)))).scalar() or 0

    stats_data = [
        ["Metric", "Value"],
        ["Total Vehicles Detected", str(total_vehicles)],
        ["Average Speed", f"{float(avg_speed):.2f} km/h"],
    ]

    table = Table(stats_data)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(table)

    doc.build(elements)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"}
    )
