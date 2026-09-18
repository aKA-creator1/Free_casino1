from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
from app import config, db
from app.auth import auth_middleware
from app.routers import user, games, cases, pvp, admin

app = FastAPI(title="Casino Premium")

app.middleware("http")(auth_middleware)

app.include_router(user.router, prefix="/api")
app.include_router(games.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(pvp.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


class InitReq(BaseModel):
    tg_id: int
    username: str = ""
    first_name: str = ""


@app.post("/api/user/init")
async def init_user(req: InitReq):
    u = await db.get_or_create_user(req.tg_id, req.username, req.first_name)
    return {
        "tg_id": u["tg_id"],
        "username": u["username"],
        "first_name": u["first_name"],
        "balance": float(u["balance"]),
        "total_taps": u["total_taps"],
        "daily_taps": u["daily_taps"],
    }


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    file_path = os.path.join(frontend_dir, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse(os.path.join(frontend_dir, "index.html"))
