CompanySurveyBackend/
├─ .env
├─ requirements.txt
├─ venv/
├─ .venv/
└─ app/
   ├─ main.py
   ├─ readme.md
   ├─ auth/
   │  ├─ auth.py
   │  └─ oauth2.py
   ├─ core/
   │  └─ __init__.py
   ├─ database/
   │  ├─ __init__.py
   │  └─ database.py
   ├─ dependencies/
   │  └─ permissions.py
   ├─ middleware/
   │  └─ __init__.py
   ├─ models/
   │  ├─ __init__.py
   │  ├─ user.py
   │  ├─ survey.py
   │  ├─ question.py
   │  ├─ response.py
   │  └─ role.py
   ├─ routers/
   │  ├─ __init__.py
   │  ├─ user.py
   │  ├─ survey.py
   │  ├─ question.py
   │  ├─ response.py
   │  ├─ dashboard.py
   │  └─ auth.py
   ├─ schemas/
   │  ├─ __init__.py
   │  ├─ user.py
   │  ├─ token.py
   │  ├─ survey.py
   │  ├─ response.py
   │  └─ question.py
   ├─ services/
   │  ├─ __init__.py
   │  ├─ user_services.py
   │  ├─ survey_services.py
   │  ├─ response_services.py
   │  └─ question_services.py
   └─ utils/
      └─ __init__.py