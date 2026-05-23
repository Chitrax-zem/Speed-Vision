import os
import uuid
import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/video", tags=["Video Processing"])

logger = logging.getLogger(__name__)

# In-memory processing status (use Redis in production)
processing_jobs = {}


class ProcessRequest(BaseModel):
    camera_id: Optional[str] = None
    pixels_per_meter: float = 15.0
    speed_limit_kmh: float = 60.0
    detection_backend: str = "haar"
    draw_annotations: bool = True


class ProcessResponse(BaseModel):
    job_id: str
    status: str
    message: str


@router.post("/upload", response_model=ProcessResponse)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    camera_id: Optional[str] = Form(None),
    pixels_per_meter: float = Form(15.0),
    speed_limit_kmh: float = Form(60.0),
    detection_backend: str = Form("haar"),
    current_user: User = Depends(get_current_active_user),
):
    """Upload a video file for processing."""
    # Validate file type
    allowed_types = ["video/mp4", "video/avi", "video/x-msvideo", "video/quicktime", "video/webm"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(allowed_types)}"
        )

    # Save uploaded file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "mp4"
    file_path = os.path.join(settings.UPLOAD_DIR, f"{uuid.uuid4()}.{file_ext}")

    with open(file_path, "wb") as f:
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE:
            os.remove(file_path)
            raise HTTPException(status_code=413, detail="File too large")
        f.write(content)

    # Create processing job
    job_id = str(uuid.uuid4())
    processing_jobs[job_id] = {
        "status": "queued",
        "file_path": file_path,
        "camera_id": camera_id,
        "pixels_per_meter": pixels_per_meter,
        "speed_limit_kmh": speed_limit_kmh,
        "detection_backend": detection_backend,
        "user_id": current_user.id,
        "progress": 0,
        "results": None,
    }

    # Start background processing
    background_tasks.add_task(process_video_background, job_id, file_path, {
        "pixels_per_meter": pixels_per_meter,
        "speed_limit_kmh": speed_limit_kmh,
        "detection_backend": detection_backend,
    })

    return ProcessResponse(
        job_id=job_id,
        status="queued",
        message="Video uploaded and queued for processing"
    )


@router.post("/stream", response_model=ProcessResponse)
async def start_stream_processing(
    request: ProcessRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
):
    """Start processing an RTSP/CCTV stream."""
    if not request.camera_id:
        raise HTTPException(status_code=400, detail="Camera ID is required for stream processing")

    job_id = str(uuid.uuid4())
    processing_jobs[job_id] = {
        "status": "queued",
        "camera_id": request.camera_id,
        "pixels_per_meter": request.pixels_per_meter,
        "speed_limit_kmh": request.speed_limit_kmh,
        "detection_backend": request.detection_backend,
        "user_id": current_user.id,
        "progress": 0,
        "results": None,
    }

    background_tasks.add_task(process_stream_background, job_id, request.dict())

    return ProcessResponse(
        job_id=job_id,
        status="queued",
        message="Stream processing started"
    )


@router.get("/jobs/{job_id}")
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """Get the status of a processing job."""
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = processing_jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "results": job["results"],
    }


@router.get("/jobs")
async def list_jobs(
    current_user: User = Depends(get_current_active_user),
):
    """List all processing jobs."""
    return {
        "jobs": [
            {
                "job_id": jid,
                "status": job["status"],
                "progress": job["progress"],
            }
            for jid, job in processing_jobs.items()
            if job.get("user_id") == current_user.id or current_user.role == "admin"
        ]
    }


async def process_video_background(job_id: str, file_path: str, config: dict):
    """Background task to process uploaded video."""
    try:
        processing_jobs[job_id]["status"] = "processing"

        from ai_engine.pipeline import ProcessingPipeline, PipelineConfig

        pipeline_config = PipelineConfig(
            detection_backend=config.get("detection_backend", "haar"),
            pixels_per_meter=config.get("pixels_per_meter", 15.0),
            speed_limit_kmh=config.get("speed_limit_kmh", 60.0),
        )

        pipeline = ProcessingPipeline(pipeline_config)
        results = pipeline.process_video(file_path)
        stats = pipeline.get_statistics()

        processing_jobs[job_id]["status"] = "completed"
        processing_jobs[job_id]["progress"] = 100
        processing_jobs[job_id]["results"] = {
            "statistics": stats,
            "total_frames": len(results),
            "total_vehicles": stats["total_vehicles_detected"],
            "overspeed_events": stats["total_overspeed_events"],
            "avg_speed": stats["avg_speed"],
            "max_speed": stats["max_speed"],
        }

    except Exception as e:
        logger.error(f"Video processing failed for job {job_id}: {e}")
        processing_jobs[job_id]["status"] = "failed"
        processing_jobs[job_id]["results"] = {"error": str(e)}


async def process_stream_background(job_id: str, config: dict):
    """Background task to process RTSP stream."""
    try:
        processing_jobs[job_id]["status"] = "streaming"

        from ai_engine.pipeline import ProcessingPipeline, PipelineConfig

        pipeline_config = PipelineConfig(
            detection_backend=config.get("detection_backend", "haar"),
            pixels_per_meter=config.get("pixels_per_meter", 15.0),
            speed_limit_kmh=config.get("speed_limit_kmh", 60.0),
        )

        pipeline = ProcessingPipeline(pipeline_config)
        # Stream processing would run until stopped
        # In production, use proper stream management
        processing_jobs[job_id]["status"] = "streaming"
        processing_jobs[job_id]["progress"] = 0
        processing_jobs[job_id]["results"] = {
            "message": "Stream is being processed in real-time",
            "statistics": pipeline.get_statistics()
        }

    except Exception as e:
        logger.error(f"Stream processing failed for job {job_id}: {e}")
        processing_jobs[job_id]["status"] = "failed"
        processing_jobs[job_id]["results"] = {"error": str(e)}
