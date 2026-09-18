import random
from decimal import Decimal

ROWS = 8
MULTIPLIERS = [0.0, 0.2, 0.4, 0.6, 1.0, 1.5, 2.0, 3.0, 5.0]


def play(bet: Decimal, params: dict) -> dict:
    choice = int(params.get("choice", -1))
    if choice < 0 or choice > 2:
        return {"error": "choose_column"}

    current_row = int(params.get("current_row", -1))
    revealed = params.get("revealed", [])

    if current_row < 0:
        path = []
        for row in range(ROWS):
            mine_pos = random.randint(0, 2)
            safe = [c for c in range(3) if c != mine_pos]
            path.append({"mines": [mine_pos], "safe": safe})
        return {"path": path, "status": "playing", "mult": 1.0}

    path = params.get("path", [])
    if current_row >= ROWS:
        mult = Decimal(str(MULTIPLIERS[ROWS]))
        win = float((bet * mult).quantize(Decimal("0.01")))
        return {"path": path, "status": "complete", "mult": float(mult), "win": win}

    if choice in path[current_row]["mines"]:
        return {"path": path, "status": "exploded", "mult": 0, "win": 0}

    new_row = current_row + 1
    mult = Decimal(str(MULTIPLIERS[min(new_row, ROWS)]))
    win = float((bet * mult).quantize(Decimal("0.01")))

    if new_row >= ROWS:
        return {"path": path, "status": "complete", "mult": float(mult), "win": win}

    return {"path": path, "status": "playing", "mult": float(mult), "current_row": new_row}
