import os, asyncpg, hashlib, secrets
from datetime import datetime, date
from decimal import Decimal
from app import config

_pool: asyncpg.Pool = None


async def init_db():
    global _pool
    _pool = await asyncpg.create_pool(config.DATABASE_URL, min_size=2, max_size=20)
    async with _pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                tg_id BIGINT UNIQUE NOT NULL,
                username TEXT DEFAULT '',
                first_name TEXT DEFAULT '',
                balance NUMERIC(16,2) DEFAULT 0,
                total_taps INT DEFAULT 0,
                daily_taps INT DEFAULT 0,
                daily_taps_date DATE,
                total_won NUMERIC(16,2) DEFAULT 0,
                total_lost NUMERIC(16,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id),
                type TEXT,
                game TEXT,
                amount NUMERIC(16,2),
                balance_after NUMERIC(16,2),
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS cases (
                id SERIAL PRIMARY KEY,
                name TEXT,
                price NUMERIC(10,2),
                items JSONB DEFAULT '[]'::jsonb
            );
            CREATE TABLE IF NOT EXISTS pvp_rooms (
                id SERIAL PRIMARY KEY,
                game_type TEXT,
                player1_id INT REFERENCES users(id),
                player2_id INT REFERENCES users(id),
                bet NUMERIC(10,2),
                state JSONB DEFAULT '{}'::jsonb,
                status TEXT DEFAULT 'waiting',
                result TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS gift_claims (
                user_id INT REFERENCES users(id),
                gift_type TEXT,
                claimed_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (user_id, gift_type, claimed_at)
            );
            CREATE TABLE IF NOT EXISTS seeds (
                id SERIAL PRIMARY KEY,
                server_seed TEXT NOT NULL,
                client_seed TEXT DEFAULT '',
                nonce INT DEFAULT 0
            );
        """)


def get_pool():
    return _pool


async def get_or_create_user(tg_id: int, username: str = "", first_name: str = "") -> dict:
    async with _pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE tg_id=$1", tg_id)
        if not row:
            row = await conn.fetchrow(
                "INSERT INTO users(tg_id,username,first_name,balance) VALUES($1,$2,$3,$4) RETURNING *",
                tg_id, username, first_name, config.START_BONUS
            )
        return dict(row)


async def update_balance(user_id: int, delta: Decimal) -> dict:
    async with _pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE users SET balance = balance + $1 WHERE id=$2 RETURNING *", delta, user_id
        )
        return dict(row)


async def record_tx(user_id: int, tx_type: str, game: str, amount: Decimal, balance_after: Decimal):
    async with _pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO transactions(user_id,type,game,amount,balance_after) VALUES($1,$2,$3,$4,$5)",
            user_id, tx_type, game, amount, balance_after
        )


async def do_tap(user_id: int) -> dict:
    async with _pool.acquire() as conn:
        user = await conn.fetchrow("SELECT * FROM users WHERE id=$1", user_id)
        today = date.today()
        if user['daily_taps_date'] != today:
            await conn.execute(
                "UPDATE users SET daily_taps=0, daily_taps_date=$1 WHERE id=$2", today, user_id
            )
            taps_today = 0
        else:
            taps_today = user['daily_taps']

        if taps_today >= config.TAP_DAILY_LIMIT:
            return {"error": "limit", "remaining": 0, "taps_today": taps_today}

        reward = Decimal(str(config.TAP_REWARD))
        for threshold, mult in config.TAP_MULTIPLIER_THRESHOLDS:
            if taps_today < threshold:
                reward *= Decimal(str(mult))
                break

        if reward < Decimal("0.01"):
            reward = Decimal("0.01")

        import random
        r = random.random()
        if r < config.TAP_X20_CHANCE:
            reward *= 20
            mult_type = "x20"
        elif r < config.TAP_X20_CHANCE + config.TAP_X5_CHANCE:
            reward *= 5
            mult_type = "x5"
        else:
            mult_type = "x1"

        row = await conn.fetchrow(
            "UPDATE users SET balance=balance+$1, total_taps=total_taps+1, daily_taps=daily_taps+1 WHERE id=$2 RETURNING *",
            reward, user_id
        )
        return {
            "balance": float(row['balance']),
            "reward": float(reward),
            "mult": mult_type,
            "taps_today": taps_today + 1,
            "remaining": config.TAP_DAILY_LIMIT - taps_today - 1
        }


async def get_top_users(limit: int = 20) -> list:
    async with _pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT tg_id, username, first_name, balance FROM users ORDER BY balance DESC LIMIT $1",
            limit
        )
        return [dict(r) for r in rows]


async def get_user_stats() -> dict:
    async with _pool.acquire() as conn:
        total_users = await conn.fetchval("SELECT COUNT(*) FROM users")
        total_bets = await conn.fetchval("SELECT COALESCE(SUM(ABS(amount)),0) FROM transactions WHERE type='bet'")
        total_games = await conn.fetchval("SELECT COUNT(*) FROM transactions WHERE type='bet'")
        return {"total_users": total_users, "total_bets": float(total_bets), "total_games": total_games}


async def can_claim_gift(user_id: int, gift_type: str) -> bool:
    async with _pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT 1 FROM gift_claims WHERE user_id=$1 AND gift_type=$2 AND claimed_at > NOW() - INTERVAL '20 hours'",
            user_id, gift_type
        )
        return row is None


async def record_gift_claim(user_id: int, gift_type: str):
    async with _pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO gift_claims(user_id,gift_type) VALUES($1,$2)", user_id, gift_type
        )


async def admin_give(tg_id: int, amount: Decimal) -> dict:
    async with _pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE tg_id=$1", tg_id)
        if not row:
            return {"error": "user_not_found"}
        row = await conn.fetchrow(
            "UPDATE users SET balance=balance+$1 WHERE tg_id=$2 RETURNING *", amount, tg_id
        )
        return dict(row)


async def get_seed() -> str:
    async with _pool.acquire() as conn:
        return await conn.fetchval("SELECT server_seed FROM seeds ORDER BY id DESC LIMIT 1") or secrets.token_hex(32)


async def create_seed() -> str:
    new_seed = secrets.token_hex(32)
    async with _pool.acquire() as conn:
        await conn.execute("INSERT INTO seeds(server_seed) VALUES($1)", new_seed)
    return new_seed
