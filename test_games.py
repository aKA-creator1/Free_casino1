import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.games import crash, mines, plinko, tower, slots, roulette, blackjack, dice, upgrader
from decimal import Decimal

bet = Decimal('100')

r = crash.play(bet, {'cashout_at': 2.0})
print(f"crash: win={r['win']}")

r = mines.play(bet, {'rows': 5, 'cols': 6, 'mines': 3, 'revealed': []})
print(f"mines: status={r['status']}")

r = plinko.play(bet, {'count': 1})
print(f"plinko: total_win={r['total_win']}")

r = tower.play(bet, {'choice': 0, 'current_row': -1, 'path': []})
print(f"tower: status={r['status']}")

r = slots.play(bet, {'type': 'classic'})
print(f"slots: reels={r['reels']}, win={r['win']}")

r = roulette.play(bet, {'variant': 'european', 'bet_type': 'red', 'bet_value': 0})
print(f"roulette: number={r['number']}, color={r['color']}, win={r['win']}")

r = blackjack.play(bet, {'action': 'deal'})
print(f"blackjack: result={r['result']}")

r = dice.play(bet, {'target': 50, 'over_under': 'over'})
print(f"dice: number={r['number']}, mult={r['mult']}, win={r['win']}")

r = upgrader.play(bet, {'tier': 0})
print(f"upgrader: roll={r['roll']}, won={r['won']}")

print("ALL GAMES OK")
