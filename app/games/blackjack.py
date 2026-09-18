import random
from decimal import Decimal

CARD_VALUES = list(range(2, 11)) + [10, 10, 10, 10]  # 2-10, J, Q, K, A(10)
CARD_RANKS = [str(v) for v in range(2, 11)] + ["J", "Q", "K", "A"]
SUITS = ["♠", "♥", "♦", "♣"]


def draw_card():
    rank = random.choice(CARD_RANKS)
    suit = random.choice(SUITS)
    if rank in ("J", "Q", "K"):
        value = 10
    elif rank == "A":
        value = 11
    else:
        value = int(rank)
    return {"rank": rank, "suit": suit, "value": value}


def hand_value(hand):
    total = sum(c["value"] for c in hand)
    aces = sum(1 for c in hand if c["rank"] == "A")
    while total > 21 and aces > 0:
        total -= 10
        aces -= 1
    return total


def play(bet: Decimal, params: dict) -> dict:
    action = params.get("action", "deal")
    player_hand = params.get("player_hand", [])
    dealer_hand = params.get("dealer_hand", [])

    if action == "deal":
        player_hand = [draw_card(), draw_card()]
        dealer_hand = [draw_card(), draw_card()]

        pv = hand_value(player_hand)
        dv = hand_value(dealer_hand)

        if pv == 21 and dv == 21:
            return {"player_hand": player_hand, "dealer_hand": dealer_hand, "player_val": 21, "dealer_val": 21, "result": "push", "mult": 1.0, "win": float(bet)}
        if pv == 21:
            return {"player_hand": player_hand, "dealer_hand": dealer_hand, "player_val": 21, "dealer_val": dv, "result": "blackjack", "mult": 2.5, "win": float((bet * Decimal("2.5")).quantize(Decimal("0.01")))}

        return {"player_hand": player_hand, "dealer_hand": [dealer_hand[0]], "player_val": pv, "dealer_val": dealer_hand[0]["value"], "result": "playing", "mult": 0, "win": 0}

    elif action == "hit":
        player_hand.append(draw_card())
        pv = hand_value(player_hand)
        if pv > 21:
            return {"player_hand": player_hand, "dealer_hand": dealer_hand, "player_val": pv, "dealer_val": hand_value(dealer_hand), "result": "bust", "mult": 0, "win": 0}
        return {"player_hand": player_hand, "dealer_hand": [dealer_hand[0]], "player_val": pv, "dealer_val": dealer_hand[0]["value"], "result": "playing", "mult": 0, "win": 0}

    elif action == "stand":
        pv = hand_value(player_hand)
        while hand_value(dealer_hand) < 17:
            dealer_hand.append(draw_card())
        dv = hand_value(dealer_hand)
        if dv > 21:
            return {"player_hand": player_hand, "dealer_hand": dealer_hand, "player_val": pv, "dealer_val": dv, "result": "dealer_bust", "mult": 2.0, "win": float((bet * Decimal("2")).quantize(Decimal("0.01")))}
        if pv > dv:
            return {"player_hand": player_hand, "dealer_hand": dealer_hand, "player_val": pv, "dealer_val": dv, "result": "win", "mult": 2.0, "win": float((bet * Decimal("2")).quantize(Decimal("0.01")))}
        elif pv < dv:
            return {"player_hand": player_hand, "dealer_hand": dealer_hand, "player_val": pv, "dealer_val": dv, "result": "lose", "mult": 0, "win": 0}
        else:
            return {"player_hand": player_hand, "dealer_hand": dealer_hand, "player_val": pv, "dealer_val": dv, "result": "push", "mult": 1.0, "win": float(bet)}

    elif action == "double":
        player_hand.append(draw_card())
        pv = hand_value(player_hand)
        if pv > 21:
            return {"player_hand": player_hand, "dealer_hand": dealer_hand, "player_val": pv, "dealer_val": hand_value(dealer_hand), "result": "bust", "mult": 0, "win": 0}
        while hand_value(dealer_hand) < 17:
            dealer_hand.append(draw_card())
        dv = hand_value(dealer_hand)
        if dv > 21 or pv > dv:
            return {"player_hand": player_hand, "dealer_hand": dealer_hand, "player_val": pv, "dealer_val": dv, "result": "double_win", "mult": 4.0, "win": float((bet * Decimal("4")).quantize(Decimal("0.01")))}
        elif pv < dv:
            return {"player_hand": player_hand, "dealer_hand": dealer_hand, "player_val": pv, "dealer_val": dv, "result": "bust", "mult": 0, "win": 0}
        else:
            return {"player_hand": player_hand, "dealer_hand": dealer_hand, "player_val": pv, "dealer_val": dv, "result": "push", "mult": 2.0, "win": float((bet * Decimal("2")).quantize(Decimal("0.01")))}

    return {"error": "invalid_action"}
