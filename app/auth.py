import time, hmac, hashlib, json
from urllib.parse import unquote
from fastapi import Request, HTTPException
from app import config


def verify_telegram_init_data(init_data: str) -> dict:
    try:
        parts = dict(x.split("=", 1) for x in init_data.split("&"))
        hash_val = parts.pop("hash", None)
        if not hash_val:
            return None

        data_check = "\n".join(f"{k}={v}" for k, v in sorted(parts.items()))
        secret = hmac.new(b"WebAppData", config.BOT_TOKEN.encode(), hashlib.sha256).digest()
        computed = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()

        if computed != hash_val:
            return None

        if "auth_date" in parts:
            auth_time = int(parts["auth_date"])
            if time.time() - auth_time > 86400:
                return None

        user = json.loads(parts.get("user", "{}"))
        return {
            "tg_id": user.get("id"),
            "username": user.get("username", ""),
            "first_name": user.get("first_name", ""),
        }
    except Exception:
        return None


def get_user_from_request(request: Request) -> dict:
    init_data = request.headers.get("X-Telegram-Init-Data", "")
    if init_data:
        user = verify_telegram_init_data(init_data)
        if user:
            return user

    body_user = getattr(request.state, "user", None)
    if body_user:
        return body_user

    return None


async def auth_middleware(request: Request, call_next):
    request.state.user = None
    init_data = request.headers.get("X-Telegram-Init-Data", "")
    if init_data and request.url.path.startswith("/api/"):
        user = verify_telegram_init_data(init_data)
        if user:
            request.state.user = user
    response = await call_next(request)
    return response
