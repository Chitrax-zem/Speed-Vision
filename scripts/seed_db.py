#!/usr/bin/env python3
"""
Database seeding script for the Vehicle Detection & Speed Tracking Platform.
Creates default users, sample cameras, and generates sample vehicle/speed data.
"""

import asyncio
import random
import sys
import os
from datetime import datetime, timedelta
from uuid import uuid4

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.db.session import AsyncSessionFactory, init_db
from app.models.user import User, UserRole
from app.models.camera import Camera, CameraStatus
from app.models.vehicle import Vehicle, VehicleType
from app.models.speed_log import SpeedLog
from app.models.detection import Detection
from app.core.security import get_password_hash
from sqlalchemy import select


async def seed_users(session):
    """Create default user accounts."""
    print("👥 Creating default users...")
    
    users_data = [
        {
            "email": "admin@vstrack.io",
            "username": "admin",
            "password": "admin123",
            "role": UserRole.ADMIN,
        },
        {
            "email": "operator@vstrack.io",
            "username": "operator",
            "password": "operator123",
            "role": UserRole.OPERATOR,
        },
        {
            "email": "viewer@vstrack.io",
            "username": "viewer",
            "password": "viewer123",
            "role": UserRole.VIEWER,
        },
    ]
    
    for user_data in users_data:
        # Check if user already exists
        result = await session.execute(
            select(User).where(User.email == user_data["email"])
        )
        existing = result.scalar_one_or_none()
        if existing:
            print(f"  ⏭️  User {user_data['email']} already exists, skipping")
            continue
            
        user = User(
            email=user_data["email"],
            username=user_data["username"],
            hashed_password=get_password_hash(user_data["password"]),
            role=user_data["role"],
            is_active=True,
        )
        session.add(user)
        print(f"  ✅ Created user: {user_data['email']} ({user_data['role'].value})")
    
    await session.commit()


async def seed_cameras(session):
    """Create sample camera entries."""
    print("\n📷 Creating sample cameras...")
    
    cameras_data = [
        {
            "name": "Highway 101 - North Bound",
            "location": "Mile Marker 42, Highway 101",
            "rtsp_url": "rtsp://192.168.1.100:554/stream1",
            "status": CameraStatus.ONLINE,
            "latitude": 37.7749,
            "longitude": -122.4194,
            "pixels_per_meter": 12.5,
            "speed_limit_kmh": 65.0,
        },
        {
            "name": "Downtown Main St - Intersection A",
            "location": "Main St & 5th Ave",
            "rtsp_url": "rtsp://192.168.1.101:554/stream1",
            "status": CameraStatus.ONLINE,
            "latitude": 37.7849,
            "longitude": -122.4094,
            "pixels_per_meter": 8.0,
            "speed_limit_kmh": 40.0,
        },
        {
            "name": "School Zone - Elm Street",
            "location": "Elm Street near Lincoln Elementary",
            "rtsp_url": "rtsp://192.168.1.102:554/stream1",
            "status": CameraStatus.ONLINE,
            "latitude": 37.7649,
            "longitude": -122.4294,
            "pixels_per_meter": 15.0,
            "speed_limit_kmh": 25.0,
        },
        {
            "name": "Industrial Park Rd - Gate 3",
            "location": "Industrial Park Road, Gate 3 Entrance",
            "rtsp_url": "rtsp://192.168.1.103:554/stream1",
            "status": CameraStatus.OFFLINE,
            "latitude": 37.7549,
            "longitude": -122.3994,
            "pixels_per_meter": 10.0,
            "speed_limit_kmh": 50.0,
        },
        {
            "name": "Bridge Toll - West Approach",
            "location": "Bay Bridge West Approach",
            "rtsp_url": "rtsp://192.168.1.104:554/stream1",
            "status": CameraStatus.MAINTENANCE,
            "latitude": 37.7949,
            "longitude": -122.3894,
            "pixels_per_meter": 11.0,
            "speed_limit_kmh": 55.0,
        },
    ]
    
    cameras = []
    for cam_data in cameras_data:
        # Check if camera already exists
        result = await session.execute(
            select(Camera).where(Camera.name == cam_data["name"])
        )
        existing = result.scalar_one_or_none()
        if existing:
            print(f"  ⏭️  Camera {cam_data['name']} already exists, skipping")
            cameras.append(existing)
            continue
            
        camera = Camera(**cam_data)
        session.add(camera)
        cameras.append(camera)
        print(f"  ✅ Created camera: {cam_data['name']}")
    
    await session.commit()
    
    # Refresh to get IDs
    for cam in cameras:
        await session.refresh(cam)
    
    return cameras


async def seed_vehicles_and_logs(session, cameras):
    """Create sample vehicle records with speed logs and detections."""
    print("\n🚗 Creating sample vehicle data...")
    
    vehicle_types = [vt for vt in VehicleType if vt != VehicleType.UNKNOWN]
    now = datetime.utcnow()
    
    total_vehicles = 0
    total_speed_logs = 0
    total_detections = 0
    
    for camera in cameras:
        if camera.status == CameraStatus.OFFLINE:
            continue
            
        # Generate 20-50 vehicles per camera
        num_vehicles = random.randint(20, 50)
        
        for i in range(num_vehicles):
            tracking_id = random.randint(1, 999)
            vehicle_type = random.choice(vehicle_types)
            
            # Speed distribution: most vehicles within speed limit, some overspeeding
            if random.random() < 0.85:
                avg_speed = random.uniform(
                    camera.speed_limit_kmh * 0.4,
                    camera.speed_limit_kmh * 0.95
                )
            else:
                avg_speed = random.uniform(
                    camera.speed_limit_kmh * 0.9,
                    camera.speed_limit_kmh * 1.5
                )
            
            max_speed = avg_speed * random.uniform(1.1, 1.4)
            min_speed = avg_speed * random.uniform(0.3, 0.7)
            is_overspeed = max_speed > camera.speed_limit_kmh
            
            # Random time in the last 7 days
            first_detected = now - timedelta(
                days=random.randint(0, 6),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            last_seen = first_detected + timedelta(seconds=random.randint(5, 120))
            detection_count = random.randint(10, 300)
            
            lane = random.randint(1, 4)
            
            vehicle = Vehicle(
                tracking_id=tracking_id,
                vehicle_type=vehicle_type,
                avg_speed_kmh=round(avg_speed, 1),
                max_speed_kmh=round(max_speed, 1),
                min_speed_kmh=round(min_speed, 1),
                is_overspeed=is_overspeed,
                lane=lane,
                camera_id=camera.id,
                first_detected=first_detected,
                last_seen=last_seen,
                detection_count=detection_count,
            )
            session.add(vehicle)
            total_vehicles += 1
            
            # Generate speed logs for this vehicle
            await session.flush()  # Get the vehicle ID
            num_logs = min(detection_count, 50)  # Cap at 50 logs per vehicle
            
            for j in range(num_logs):
                log_time = first_detected + timedelta(
                    seconds=j * (last_seen - first_detected).total_seconds() / max(num_logs, 1)
                )
                
                # Speed varies around the average with some noise
                speed = avg_speed + random.gauss(0, avg_speed * 0.1)
                speed = max(5.0, speed)  # Minimum 5 km/h
                speed_mps = speed / 3.6
                log_overspeed = speed > camera.speed_limit_kmh
                
                speed_log = SpeedLog(
                    vehicle_id=vehicle.id,
                    speed_kmh=round(speed, 1),
                    speed_mps=round(speed_mps, 2),
                    is_overspeed=log_overspeed,
                    position_x=random.randint(50, 1200),
                    position_y=random.randint(50, 700),
                    frame_number=j * 3,  # Assuming ~3 frames between logs
                    timestamp=log_time,
                )
                session.add(speed_log)
                total_speed_logs += 1
            
            # Generate some detection records
            num_detections = min(detection_count, 30)  # Cap at 30 detections
            for j in range(num_detections):
                det_time = first_detected + timedelta(
                    seconds=j * (last_seen - first_detected).total_seconds() / max(num_detections, 1)
                )
                
                # Random bounding box
                x1 = random.randint(50, 800)
                y1 = random.randint(50, 400)
                x2 = x1 + random.randint(60, 200)
                y2 = y1 + random.randint(40, 150)
                confidence = round(random.uniform(0.5, 0.99), 2)
                
                detection = Detection(
                    vehicle_id=vehicle.id,
                    camera_id=camera.id,
                    bbox_x1=x1,
                    bbox_y1=y1,
                    bbox_x2=x2,
                    bbox_y2=y2,
                    confidence=confidence,
                    vehicle_type=vehicle_type.value,
                    frame_number=j * 5,
                    timestamp=det_time,
                )
                session.add(detection)
                total_detections += 1
        
        print(f"  ✅ Created data for camera: {camera.name}")
    
    await session.commit()
    
    print(f"\n  📊 Summary:")
    print(f"     Vehicles: {total_vehicles}")
    print(f"     Speed Logs: {total_speed_logs}")
    print(f"     Detections: {total_detections}")


async def main():
    """Main seeding function."""
    print("=" * 60)
    print("🌱 Vehicle Detection & Speed Tracking - Database Seeder")
    print("=" * 60)
    
    # Initialize database tables
    print("\n📋 Initializing database tables...")
    await init_db()
    print("  ✅ Tables ready")
    
    # Run seeding
    async with AsyncSessionFactory() as session:
        await seed_users(session)
        cameras = await seed_cameras(session)
        await seed_vehicles_and_logs(session, cameras)
    
    print("\n" + "=" * 60)
    print("✅ Database seeding complete!")
    print("=" * 60)
    print("\n🔑 Default login credentials:")
    print("   Admin:    admin@vstrack.io / admin123")
    print("   Operator: operator@vstrack.io / operator123")
    print("   Viewer:   viewer@vstrack.io / viewer123")
    print("\n⚠️  Change these passwords in production!")


if __name__ == "__main__":
    asyncio.run(main())
