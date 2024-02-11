from fastapi import WebSocket
from app.logger import get_logger


logger = get_logger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        if client_id in self.active_connections:
            self.active_connections[client_id].append(websocket)
        else:
            self.active_connections[client_id] = [websocket]

    def disconnect(self, client_id: str, websocket: WebSocket):
        self.active_connections[client_id].remove(websocket)
        if not self.active_connections[client_id]:
            del self.active_connections[client_id]

    async def send_message(self, client_id: str, message: str):
        wsconns = self.active_connections.get(client_id, [])
        logger.info(f"No. of {client_id} conns: {len(wsconns)}")
        logger.info(f"{client_id}: {message}")
        for websocket in wsconns:
            await websocket.send_text(message)


wsmanager = ConnectionManager()
