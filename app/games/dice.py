import random
from decimal import Decimal


def play(bet: Decimal, params: dict) -> dict:
    target = float(params.get("target", 50))
    over_under = params.get("over_under", "over")

    number = random.randint(1, 100)

    if over_under == "over":
        win_chance = (100 - target) / 100
    else:
        win_chance = target / 100

    if win_chance <= 0:
        return {"error": "invalid_target"}

    house_edge = 0.01
    multiplier = round((1 - house_edge) / win_chance, 2) if win_chance > 0 else 0

    won = False
    if over_under == "over" and number > target:
        won = True
    elif over_under == "under" and number < target:
        won = True

    win = float((bet * Decimal(str(multiplier))).quantize(Decimal("0.01"))) if won else 0

    return {
        "number": number,
        "target": target,
        "over_under": over_under,
        "win_chance": round(win_chance * 100, 1),
        "mult": multiplier,
        "win": win,
    }
