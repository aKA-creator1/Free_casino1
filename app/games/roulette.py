import random
from decimal import Decimal

RED_NUMBERS = {1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36}
BLACK_NUMBERS = {2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35}


def play(bet: Decimal, params: dict) -> dict:
    variant = params.get("variant", "european")
    bet_type = params.get("bet_type", "")
    bet_value = params.get("bet_value", 0)

    if variant == "american":
        zero_positions = [0, 37]
    else:
        zero_positions = [0]

    number = random.randint(0, 36 if variant == "european" else 37)
    if number == 37:
        display_number = "00"
    else:
        display_number = str(number)

    if number in RED_NUMBERS:
        color = "red"
    elif number in BLACK_NUMBERS:
        color = "black"
    else:
        color = "green"

    win = 0
    if bet_type == "number" and bet_value == number:
        win = 36
    elif bet_type == "red" and color == "red":
        win = 2
    elif bet_type == "black" and color == "black":
        win = 2
    elif bet_type == "green" and color == "green":
        win = 36
    elif bet_type == "odd" and number not in zero_positions and number % 2 == 1:
        win = 2
    elif bet_type == "even" and number not in zero_positions and number % 2 == 0:
        win = 2
    elif bet_type == "low" and 1 <= number <= 18:
        win = 2
    elif bet_type == "high" and 19 <= number <= 36:
        win = 2

    payout = float((bet * Decimal(str(win))).quantize(Decimal("0.01")))
    return {
        "number": display_number,
        "color": color,
        "variant": variant,
        "mult": win,
        "win": payout,
    }
