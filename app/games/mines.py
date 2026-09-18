import random
from decimal import Decimal


def play(bet: Decimal, params: dict) -> dict:
    rows = int(params.get("rows", 5))
    cols = int(params.get("cols", 6))
    num_mines = int(params.get("mines", 3))
    revealed = params.get("revealed", [])
    total_safe = rows * cols - num_mines

    if len(revealed) == 0:
        all_positions = set(range(rows * cols))
        mine_positions = set(random.sample(list(all_positions), num_mines))
        return {
            "mine_positions": list(mine_positions),
            "mult": 1.0,
            "win": 0,
            "status": "playing",
            "revealed_count": 0,
        }

    mine_positions = set(params.get("mine_positions", []))
    if not mine_positions:
        all_positions = set(range(rows * cols))
        mine_positions = set(random.sample(list(all_positions), num_mines))

    last_revealed = revealed[-1] if revealed else -1
    if last_revealed in mine_positions:
        return {
            "mine_positions": list(mine_positions),
            "mult": 0,
            "win": 0,
            "status": "exploded",
        }

    n = len(revealed)
    if n == 0:
        mult = Decimal("1.0")
    else:
        house_edge = Decimal("0.97")
        base = Decimal(str(rows * cols))
        total_mines = Decimal(str(num_mines))
        mult = Decimal("1.0")
        for i in range(n):
            remaining = base - Decimal(str(i))
            safe_left = remaining - total_mines
            mult *= remaining / safe_left
        mult = (mult * house_edge).quantize(Decimal("0.01"))

    win = float((bet * mult).quantize(Decimal("0.01")))
    status = "playing"
    if n >= total_safe:
        status = "complete"

    return {
        "mine_positions": list(mine_positions),
        "mult": float(mult),
        "win": win,
        "status": status,
        "revealed_count": n,
    }
