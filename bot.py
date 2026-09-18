import asyncio
import os
import sys

os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")

import uvicorn
from app import config, db
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.main import app as fastapi_app

try:
    from aiogram import Bot, Dispatcher, F
    from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
    from aiogram.filters import CommandStart, Command
    HAS_BOT = True
except ImportError:
    HAS_BOT = False
    print("[WARN] aiogram not installed, bot mode disabled")


if HAS_BOT:
    bot = Bot(token=config.BOT_TOKEN)
    dp = Dispatcher()

    def webapp_kb():
        return InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🎰 ОТКРЫТЬ КАЗИНО", web_app=WebAppInfo(url=config.WEBAPP_URL))],
            [InlineKeyboardButton(text="👤 Баланс", callback_data="balance"),
             InlineKeyboardButton(text="🏆 Топ", callback_data="top")],
        ])

    @dp.message(CommandStart())
    async def cmd_start(m: Message):
        await m.answer(
            f"🎰 <b>CASINO PREMIUM</b>\n\n"
            f"💰 Играй в 10 игр\n👆 Тапалка: 0.5★ за тап\n\n"
            f"⚠️ <i>Всё виртуально, без реальных денег.</i>",
            reply_markup=webapp_kb()
        )

    @dp.message(Command("menu"))
    async def cmd_menu(m: Message):
        await m.answer("Меню:", reply_markup=webapp_kb())

    @dp.callback_query(F.data == "balance")
    async def cb_balance(c):
        u = await db.get_or_create_user(c.from_user.id)
        await c.answer(f"💰 Баланс: ★ {u['balance']}", show_alert=True)

    @dp.callback_query(F.data == "top")
    async def cb_top(c):
        top = await db.get_top_users(5)
        lines = [f"{i+1}. {r['username'] or 'User'} — ★ {r['balance']}" for i, r in enumerate(top)]
        await c.answer("\n".join(lines), show_alert=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_db()
    print("[entry] DB initialized")
    if HAS_BOT:
        print("[entry] Starting bot polling...")
        asyncio.create_task(dp.start_polling(bot))
    else:
        print("[entry] Bot disabled (aiogram not installed)")
    print(f"[entry] Backend starting on port {config.PORT}")
    yield
    print("[entry] Shutting down...")


fastapi_app.router.lifespan_context = lifespan


if __name__ == "__main__":
    print(f"[entry] Starting CASINO PREMIUM, PORT={config.PORT}")
    uvicorn.run(
        "bot:fastapi_app",
        host="0.0.0.0",
        port=config.PORT,
        reload=False,
        log_level="info",
    )
