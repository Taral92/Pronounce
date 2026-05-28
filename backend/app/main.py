"""
main.py — FastAPI application entry point.
All routers mounted here. CORS configured here.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import analyze, tts_router, user, stripe_router, clerk_webhook, tutor, admin

app = FastAPI(
    title="Pronounce API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)
print("ALLOWED_ORIGINS:", settings.ALLOWED_ORIGINS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(tts_router.router)
app.include_router(user.router)
app.include_router(stripe_router.router)
app.include_router(clerk_webhook.router)
app.include_router(tutor.router)
app.include_router(admin.router)

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
