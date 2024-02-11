from datetime import datetime

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import FileResponse

from app.config import Config
from app.logger import get_logger
from app.mongodb import init_database
from app.wsmanager import wsmanager
from app.workers import run_scheduler

from auth.manager import get_user_id_from_token
from auth.routes import router as auth_router

from jigsaw.routes import router as jigsaw_router
from jigsaw.image_routes import router as image_router
from jigsaw.routes_shareables import router as shareables_router
from jigsaw.profiler import router as profile_router
from jigsaw.tasks import reg_update_profile_limits

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan_manager(app: FastAPI):
    # await init_database()  # this also works
    logger.info("Starting up...")
    startup_tasks = asyncio.gather(
        init_database(),
        # run_scheduler(), reg_update_profile_limits()
    )
    await startup_tasks
    yield


if int(Config.DEV_MODE):
    app = FastAPI(lifespan=lifespan_manager)
else:
    app = FastAPI(lifespan=lifespan_manager, docs_url=None, redoc_url=None, openapi_url=None)


origins = [Config.UI_URL]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def capture_request_origin(request: Request, call_next):
    response = await call_next(request)
    reqtz = request.headers.get('timezone', '<unknown>')
    logger.info(f"req: {reqtz}::{request.client.host} -> {request.url.path}")
    return response


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(title="Cells", version="0.01", routes=app.routes)
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


app.include_router(auth_router, prefix="/auth", tags=["auth"])
# app.include_router(
#     fastapi_users.get_users_router(UserSelfRead, UserUpdate),
#     prefix="/users",
#     tags=["users"],
# )
app.include_router(profile_router, prefix="/profile", tags=["profile"])
app.include_router(
    jigsaw_router,
    prefix="/jigsaw",
    tags=["jigsaw"],
)
app.include_router(
    image_router,
    prefix="/images",
    tags=["image"],
)
app.include_router(
    shareables_router,
    prefix="/shareables",
    tags=["shareable"],
)

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("static/favicon.ico")


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await wsmanager.connect(websocket, client_id)
    logger.info(f"Websocket: {client_id} has connected")
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        wsmanager.disconnect(client_id, websocket)
        logger.info(f"Websocket disconnected")
