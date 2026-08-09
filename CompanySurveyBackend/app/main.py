from fastapi import FastAPI

from app.models.user import User
from app.models.survey import Survey
from app.models.question import Question
from app.models.response import Response

from app.routers.user import router as user_router
from app.routers.survey import router as survey_router
from app.routers.question import router as question_router
from app.routers.response import router as response_router

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()


app.include_router(user_router)
app.include_router(survey_router)
app.include_router(question_router)
app.include_router(response_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Welcome to Company Survey Backend"}
