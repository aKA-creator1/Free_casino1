import random
from decimal import Decimal

ROWS = 12
MULTIPLIERS = [20.0, 10.0, 4.0, 2.0, 1.2, 0.5, 0.3, 0.5, 1.2, 2.0, 4.0, 10.0, 20.0]


def play(bet: Decimal, params: dict) -> dict:
    count = int(params.get("count", 1))
    results = []

    for _ in range(min(count, 30)):
        r = 0
        for _ in range(ROWS):
            r += 1 if random.random() < 0.5 else 0
        mult = MULTIPLIERS[r]
        win = float((bet * Decimal(str(mult))).quantize(Decimal("0.01")))
        results.append({"slot": r, "mult": mult, "win": win})

    total_win = sum(x["win"] for x in results)
    return {
        "results": results,
        "total_win": total_win,
        "count": len(results),
    }
