"""
WebSocket handler for real-time detection updates.
"""

import asyncio
import json
import logging
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, Set[str]] = {}  # client_id -> set of channels

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.subscriptions[client_id] = set()
        logger.info(f"WebSocket client connected: {client_id}")

    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)
        self.subscriptions.pop(client_id, None)
        logger.info(f"WebSocket client disconnected: {client_id}")

    async def send_personal_message(self, message: dict, client_id: str):
        websocket = self.active_connections.get(client_id)
        if websocket:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to {client_id}: {e}")
                self.disconnect(client_id)

    async def broadcast(self, message: dict, channel: str = None):
        """Broadcast message to all connected clients or specific channel subscribers."""
        for client_id, websocket in list(self.active_connections.items()):
            if channel and client_id in self.subscriptions:
                if channel not in self.subscriptions[client_id]:
                    continue
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect(client_id)

    def subscribe(self, client_id: str, channel: str):
        if client_id in self.subscriptions:
            self.subscriptions[client_id].add(channel)


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """Main WebSocket endpoint handler."""
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type", "unknown")

                if msg_type == "subscribe":
                    channel = message.get("channel", "detections")
                    manager.subscribe(client_id, channel)
                    await manager.send_personal_message({
                        "type": "subscribed",
                        "channel": channel
                    }, client_id)

                elif msg_type == "ping":
                    await manager.send_personal_message({
                        "type": "pong",
                        "timestamp": message.get("timestamp")
                    }, client_id)

            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON"
                }, client_id)

    except WebSocketDisconnect:
        manager.disconnect(client_id)


async def send_detection_update(detection_data: dict):
    """Send real-time detection update to all subscribers."""
    await manager.broadcast({
        "type": "detection_update",
        "data": detection_data
    }, channel="detections")


async def send_overspeed_alert(alert_data: dict):
    """Send overspeed alert to all subscribers."""
    await manager.broadcast({
        "type": "overspeed_alert",
        "data": alert_data
    }, channel="alerts")


async def send_analytics_update(analytics_data: dict):
    """Send analytics update to all subscribers."""
    await manager.broadcast({
        "type": "analytics_update",
        "data": analytics_data
    }, channel="analytics")
