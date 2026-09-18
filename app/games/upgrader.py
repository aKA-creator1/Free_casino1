import random
from decimal import Decimal

TIERS = [
    {"label": "x1.5", "chance": 64.0, "mult": 1.5},
    {"label": "x2", "chance": 48.0, "mult": 2.0},
    {"label": "x3", "chance": 32.0, "mult": 3.0},
    {"label": "x4", "chance": 24.0, "mult": 4.0},
    {"label": "x6", "chance": 16.0, "mult": 6.0},
    {"label": "x10", "chance": 9.6, "mult": 10.0},
]


def play(bet: Decimal, params: dict) -> dict:
    tier = int(params.get("tier", 0))
    if tier < 0 or tier >= len(TIERS):
        return {"error": "invalid_tier"}

    selected = TIERS[tier]
    roll = random.random() * 100
    won = roll < selected["chance"]

    if won:
        win = float((bet * Decimal(str(selected["mult"]))).quantize(Decimal("0.01")))
        return {"roll": round(roll, 1), "tier": selected, "won": True, "mult": selected["mult"], "win": win}
    else:
        return {"roll": round(roll, 1), "tier": selected, "won": False, "mult": 0, "win": 0}
