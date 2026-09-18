from fastapi import APIRouter
from pydantic import BaseModel
from decimal import Decimal
from app import db, config

router = APIRouter(tags=["admin"])


def is_admin(tg_id: int) -> bool:
    return tg_id in config.ADMIN_IDS


class GiveReq(BaseModel):
    admin_id: int
    tg_id: int
    amount: float


@router.post("/give")
async def give(req: GiveReq):
    if not is_admin(req.admin_id):
        return {"error": "not_admin"}
    result = await db.admin_give(req.tg_id, Decimal(str(req.amount)))
    if "error" in result:
        return result
    return {"ok": True, "balance": float(result["balance"])}


class TakeReq(BaseModel):
    admin_id: int
    tg_id: int
    amount: float


@router.post("/take")
async def take(req: TakeReq):
    if not is_admin(req.admin_id):
        return {"error": "not_admin"}
    result = await db.admin_give(req.tg_id, Decimal(str(-req.amount)))
    if "error" in result:
        return result
    return {"ok": True, "balance": float(result["balance"])}


@router.get("/stats")
async def stats():
    return await db.get_user_stats()
