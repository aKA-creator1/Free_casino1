import random, hashlib, time
from decimal import Decimal


def play(bet: Decimal, params: dict) -> dict:
    server_seed = params.get("server_seed", hashlib.sha256(str(time.time()).encode()).hexdigest())
    client_seed = params.get("client_seed", "")
    nonce = params.get("nonce", 0)

    h = hashlib.sha256(f"{server_seed}:{client_seed}:{nonce}".encode()).hexdigest()
    r = int(h[:8], 16) / 0xFFFFFFFF

    max_mult = 0.99 / (1 - r) if r < 0.99 else 99.0
    max_mult = round(max_mult, 2)

    cashout_at = float(params.get("cashout_at", 0))
    if cashout_at <= 0:
        return {"crashed_at": max_mult, "win": 0, "max_mult": max_mult}

    if cashout_at >= max_mult:
        return {"crashed_at": max_mult, "win": 0, "max_mult": max_mult}

    mult = Decimal(str(cashout_at))
    win = bet * mult
    return {"crashed_at": max_mult, "win": float(win.quantize(Decimal("0.01"))), "mult": float(mult)}
