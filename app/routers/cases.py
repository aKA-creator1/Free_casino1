from fastapi import APIRouter
from pydantic import BaseModel
from decimal import Decimal
from app import db

router = APIRouter(tags=["cases"])


DEFAULT_CASES = [
    {
        "id": 1, "name": "Базовый кейс", "price": 100,
        "items": [
            {"name": "★ 50", "mult": 0.5, "rarity": "common"},
            {"name": "★ 100", "mult": 1.0, "rarity": "common"},
            {"name": "★ 200", "mult": 2.0, "rarity": "uncommon"},
            {"name": "★ 500", "mult": 5.0, "rarity": "rare"},
            {"name": "★ 2000", "mult": 20.0, "rarity": "epic"},
            {"name": "★ 10000", "mult": 100.0, "rarity": "legendary"},
        ]
    },
    {
        "id": 2, "name": "Золотой кейс", "price": 500,
        "items": [
            {"name": "★ 250", "mult": 0.5, "rarity": "common"},
            {"name": "★ 500", "mult": 1.0, "rarity": "common"},
            {"name": "★ 1000", "mult": 2.0, "rarity": "uncommon"},
            {"name": "★ 2500", "mult": 5.0, "rarity": "rare"},
            {"name": "★ 10000", "mult": 20.0, "rarity": "epic"},
            {"name": "★ 50000", "mult": 100.0, "rarity": "legendary"},
        ]
    },
    {
        "id": 3, "name": "Diamond кейс", "price": 2000,
        "items": [
            {"name": "★ 1000", "mult": 0.5, "rarity": "common"},
            {"name": "★ 2000", "mult": 1.0, "rarity": "common"},
            {"name": "★ 5000", "mult": 2.5, "rarity": "uncommon"},
            {"name": "★ 15000", "mult": 7.5, "rarity": "rare"},
            {"name": "★ 50000", "mult": 25.0, "rarity": "epic"},
            {"name": "★ 200000", "mult": 100.0, "rarity": "legendary"},
        ]
    },
]


@router.get("/list")
async def list_cases():
    return DEFAULT_CASES


class OpenCaseReq(BaseModel):
    tg_id: int
    case_id: int


@router.post("/open")
async def open_case(req: OpenCaseReq):
    user = await db.get_or_create_user(req.tg_id)
    case = next((c for c in DEFAULT_CASES if c["id"] == req.case_id), None)
    if not case:
        return {"error": "case_not_found"}
    price = Decimal(str(case["price"]))
    if user["balance"] < price:
        return {"error": "insufficient_balance"}

    import random
    roll = random.random() * 100
    cumulative = 0
    won_item = case["items"][0]
    for item in case["items"]:
        rarity_chance = {"common": 50, "uncommon": 25, "rare": 15, "epic": 8, "legendary": 2}
        cumulative += rarity_chance.get(item["rarity"], 10)
        if roll <= cumulative:
            won_item = item
            break

    win_amount = price * Decimal(str(won_item["mult"]))
    u = await db.update_balance(user["id"], -price + win_amount)
    await db.record_tx(user["id"], "bet", "case_open", -price, u["balance"])
    if win_amount > 0:
        await db.record_tx(user["id"], "win", "case_open", win_amount, u["balance"])

    return {
        "balance": float(u["balance"]),
        "item": won_item,
        "profit": float(win_amount - price),
    }


class SellCaseItemReq(BaseModel):
    tg_id: int
    item_name: str
    price: float


@router.post("/sell")
async def sell_case_item(req: SellCaseItemReq):
    user = await db.get_or_create_user(req.tg_id)
    sell_price = Decimal(str(req.price))
    u = await db.update_balance(user["id"], sell_price)
    await db.record_tx(user["id"], "win", "case_sell", sell_price, u["balance"])
    return {"balance": float(u["balance"])}
