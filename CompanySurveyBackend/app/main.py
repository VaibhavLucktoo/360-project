import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.user import router as user_router
from app.routers.survey import router as survey_router
from app.routers.question import router as question_router
from app.routers.response import router as response_router
from app.routers.role import router as role_router

app = FastAPI()
app.include_router(role_router)

# Register API routers.
app.include_router(user_router)
app.include_router(survey_router)
app.include_router(question_router)
app.include_router(response_router)

# Allow React/Vite frontend (local dev + Render/production origins).
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
env_origins = os.getenv("CORS_ORIGINS", "")
if env_origins:
    if env_origins.strip() == "*":
        allowed_origins = ["*"]
    else:
        extra_origins = [origin.strip() for origin in env_origins.split(",") if origin.strip()]
        allowed_origins = list(set(default_origins + extra_origins))
else:
    allowed_origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home() -> dict:
    """Return a simple API health response."""
    return {
        "message": "Welcome to Company Survey Backend"
    }
