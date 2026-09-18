import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:5005/")
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "6665950252").split(",") if x.strip()]
PORT = int(os.getenv("PORT", "5005"))
DATABASE_URL = os.getenv("DATABASE_URL", "")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-change-me")

START_BONUS = 1000
DAILY_BONUS = 500
TAP_REWARD = 0.5
TAP_DAILY_LIMIT = 1000
TAP_X5_CHANCE = 0.10
TAP_X20_CHANCE = 0.01
TAP_MULTIPLIER_THRESHOLDS = [
    (1000, 1.0),
    (2000, 0.8),
    (5000, 0.5),
    (10000, 0.3),
    (25000, 0.2),
    (50000, 0.1),
]

CRASH_HOUSE_EDGE = 0.03
MINES_HOUSE_EDGE = 0.03
PLINKO_HOUSE_EDGE = 0.037
TOWER_HOUSE_EDGE = 0.05
DICE_HOUSE_EDGE = 0.01
ROULETTE_HOUSE_EDGE = 0.027
BLACKJACK_HOUSE_EDGE = 0.005
UPGRADER_HOUSE_EDGE = 0.05
SLOTS_HOUSE_EDGE = 0.05
CASE_HOUSE_EDGE = 0.10
