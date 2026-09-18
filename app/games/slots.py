import random
from decimal import Decimal

CLASSIC_SYMBOLS = ["BAR", "7", "BELL", "LEMON", "CHERRY", "STAR"]
CLASSIC_WEIGHTS = [10, 5, 15, 20, 25, 25]

VIDEO_SYMBOLS = ["A", "K", "Q", "J", "10", "WILD", "SCATTER"]
VIDEO_WEIGHTS = [20, 20, 20, 20, 15, 3, 2]


def play(bet: Decimal, params: dict) -> dict:
    slot_type = params.get("type", "classic")

    if slot_type == "classic":
        reels = [random.choices(CLASSIC_SYMBOLS, CLASSIC_WEIGHTS)[0] for _ in range(3)]
        if reels[0] == reels[1] == reels[2]:
            pays = {"BAR": 10, "7": 7, "BELL": 5, "LEMON": 3, "CHERRY": 2, "STAR": 1.5}
            mult = pays.get(reels[0], 1)
        elif reels[0] == reels[1] or reels[1] == reels[2]:
            mult = 0.5
        else:
            mult = 0
        win = float((bet * Decimal(str(mult))).quantize(Decimal("0.01")))
        return {"reels": reels, "type": "classic", "mult": mult, "win": win}

    else:
        reels = [random.choices(VIDEO_SYMBOLS, VIDEO_WEIGHTS)[0] for _ in range(15)]
        grid = [reels[i:i+5] for i in range(0, 15, 5)]
        wild_count = sum(1 for s in reels if s == "WILD")
        scatter_count = sum(1 for s in reels if s == "SCATTER")

        paylines = []
        for row in range(3):
            line = [grid[row][col] for col in range(5)]
            non_wild = [s for s in line if s != "WILD"]
            if len(non_wild) == 0:
                match = "WILD"
            else:
                match = non_wild[0]
            if all(s == match or s == "WILD" for s in line):
                pays = {"A": 5, "K": 4, "Q": 3, "J": 2, "10": 1}
                paylines.append({"row": row, "symbol": match, "pay": pays.get(match, 1)})

        line_mult = sum(p["pay"] for p in paylines)
        scatter_pay = max(0, scatter_count - 2) * 5
        total_mult = line_mult + scatter_pay + wild_count * 0.5
        total_mult = min(total_mult, 50)

        win = float((bet * Decimal(str(total_mult))).quantize(Decimal("0.01")))
        return {"grid": grid, "type": "video", "paylines": paylines, "scatters": scatter_count, "mult": total_mult, "win": win}
