from fastapi import APIRouter, Request
from pydantic import BaseModel
from decimal import Decimal
from app import db, config

router = APIRouter(tags=["user"])


class TapReq(BaseModel):
    tg_id: int


class GiftReq(BaseModel):
    tg_id: int


@router.post("/tap")
async def tap(req: TapReq):
    user = await db.get_or_create_user(req.tg_id)
    result = await db.do_tap(user["id"])
    return result


@router.post("/daily")
async def daily(req: GiftReq):
    user = await db.get_or_create_user(req.tg_id)
    can = await db.can_claim_gift(user["id"], "daily")
    if not can:
        return {"error": "already_claimed"}
    await db.record_gift_claim(user["id"], "daily")
    u = await db.update_balance(user["id"], Decimal(str(config.DAILY_BONUS)))
    await db.record_tx(user["id"], "gift", "daily", Decimal(str(config.DAILY_BONUS)), u["balance"])
    return {"balance": float(u["balance"]), "bonus": config.DAILY_BONUS}


@router.get("/top")
async def top():
    return await db.get_top_users(20)


@router.get("/leaderboard")
async def leaderboard():
    return await db.get_top_users(50)


class ProfileReq(BaseModel):
    tg_id: int


@router.post("/profile")
async def profile(req: ProfileReq):
    user = await db.get_or_create_user(req.tg_id)
    return {
        "tg_id": user["tg_id"],
        "username": user["username"],
        "first_name": user["first_name"],
        "balance": float(user["balance"]),
        "total_taps": user["total_taps"],
        "total_won": float(user["total_won"]),
        "total_lost": float(user["total_lost"]),
        "created_at": str(user["created_at"]),
    }
