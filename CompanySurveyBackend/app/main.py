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


# Allow the React/Vite frontend to access the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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
