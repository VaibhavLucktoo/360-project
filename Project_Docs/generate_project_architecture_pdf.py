from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    ListFlowable,
    ListItem,
    PageBreak,
)


ROOT = Path(r"c:\Users\Vaibhav\Desktop\360\360_project")
OUTPUT_DIR = ROOT / "Project_Docs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = OUTPUT_DIR / "Company_Survey_System_Architecture.pdf"


def bullet_list(items, style):
    return ListFlowable(
        [ListItem(Paragraph(item, style), leftIndent=12) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=18,
    )


def build_document():
    doc = SimpleDocTemplate(
        str(OUTPUT_FILE),
        pagesize=A4,
        rightMargin=42,
        leftMargin=42,
        topMargin=48,
        bottomMargin=42,
        title="Company Survey Management System Architecture",
        author="GitHub Copilot",
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="TitleCenter",
            parent=styles["Title"],
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0f172a"),
            fontSize=24,
            leading=30,
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubtitleCenter",
            parent=styles["Normal"],
            alignment=TA_CENTER,
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#475569"),
            spaceAfter=18,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionHeading",
            parent=styles["Heading1"],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=12,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubHeading",
            parent=styles["Heading2"],
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=8,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["BodyText"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#111827"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SmallBody",
            parent=styles["BodyText"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#111827"),
            spaceAfter=4,
        )
    )

    story = []

    story.append(Paragraph("Company Survey Management System", styles["TitleCenter"]))
    story.append(Paragraph("Backend Architecture, Frontend Architecture, and End-to-End Project Overview", styles["SubtitleCenter"]))
    story.append(Paragraph(
        "This document summarizes the actual structure of the survey management application built with FastAPI, PostgreSQL, SQLAlchemy, and React + Vite.",
        styles["Body"],
    ))
    story.append(Paragraph(
        "It is intended as a concise architecture reference for development, handoff, demo, and future maintenance.",
        styles["Body"],
    ))

    story.append(Paragraph("1. Project Overview", styles["SectionHeading"]))
    story.append(Paragraph(
        "The system supports a role-based survey workflow where administrators authenticate with JWT, create surveys, build questions, preview surveys, and later collect employee responses. The frontend is responsible for the interactive user experience, while the backend owns persistence, validation, authentication, and API orchestration.",
        styles["Body"],
    ))

    story.append(Paragraph("2. Technology Stack", styles["SectionHeading"]))
    tech_data = [
        ["Layer", "Technology", "Purpose"],
        ["Frontend", "React 19 + Vite", "Fast SPA rendering, routing, and UI composition"],
        ["State", "React Context", "Shared survey draft and active survey tracking"],
        ["Backend", "FastAPI", "REST API, validation, authentication, dependency injection"],
        ["ORM", "SQLAlchemy", "Database models and persistence"],
        ["Database", "PostgreSQL", "Primary relational storage for users, surveys, questions, and responses"],
        ["Auth", "JWT Bearer Tokens", "Protected endpoints and login session management"],
        ["Build", "Vite + npm", "Frontend development server and packaging"],
    ]
    tech_table = Table(tech_data, colWidths=[1.1 * inch, 1.9 * inch, 3.8 * inch])
    tech_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("LEADING", (0, 0), (-1, -1), 11),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(tech_table)

    story.append(Paragraph("3. Backend Architecture", styles["SectionHeading"]))
    story.append(Paragraph(
        "The backend is organized by responsibility. The FastAPI entry point wires models, routers, and CORS. SQLAlchemy models define the database schema. Routers expose HTTP endpoints, while service modules hold the actual business and database logic.",
        styles["Body"],
    ))

    story.append(Paragraph("3.1 Backend Entry Point", styles["SubHeading"]))
    story.append(bullet_list([
        "<b>app/main.py</b> initializes FastAPI, creates tables on startup, registers routers, and enables CORS for the Vite frontend origin at <b>http://localhost:5173</b>.",
        "The application imports the primary database models to ensure metadata is registered before table creation.",
        "The root endpoint returns a simple health-style welcome message.",
    ], styles["Body"]))

    story.append(Paragraph("3.2 Data Models", styles["SubHeading"]))
    story.append(bullet_list([
        "<b>User</b>: stores admin or employee identity and authentication-related fields.",
        "<b>Survey</b>: stores title, description, published status, creator reference, and timestamps.",
        "<b>Question</b>: stores survey linkage, question text, question type, display order, required flag, and timestamps.",
        "<b>Response</b>: stores employee answers linked to user and question records.",
    ], styles["Body"]))

    story.append(Paragraph("3.3 Router Layer", styles["SubHeading"]))
    story.append(bullet_list([
        "<b>app/routers/user.py</b> handles login and current-user lookup.",
        "<b>app/routers/survey.py</b> manages survey create, list, update, delete, publish, preview, analytics, export, and submission endpoints.",
        "<b>app/routers/question.py</b> manages question create, list, read, update, delete, and question-level response lookup.",
        "<b>app/routers/response.py</b> manages survey and response-related result handling.",
    ], styles["Body"]))

    story.append(Paragraph("3.4 Service Layer", styles["SubHeading"]))
    story.append(bullet_list([
        "<b>survey_services.py</b> implements create, read, update, delete, publish, and survey-with-questions retrieval.",
        "<b>question_services.py</b> validates the survey relationship, persists questions, updates question fields, and deletes questions.",
        "<b>response_services.py</b> handles survey submission, response retrieval, CSV export, and analytics.",
        "Service modules keep database logic out of the route handlers, which improves testability and readability.",
    ], styles["Body"]))

    story.append(Paragraph("3.5 Backend Security and Validation", styles["SubHeading"]))
    story.append(bullet_list([
        "Protected routes rely on JWT bearer authentication using <b>get_current_user</b> dependencies.",
        "Pydantic schemas enforce request and response shapes for surveys, questions, responses, tokens, and analytics.",
        "Survey question creation requires survey existence validation before a new question is committed.",
    ], styles["Body"]))

    story.append(Paragraph("3.6 Key Backend API Flows", styles["SubHeading"]))
    backend_api_data = [
        ["Area", "Representative Endpoints", "Purpose"],
        ["Auth", "/users/login, /users/me", "Authenticate users and expose the current session user"],
        ["Surveys", "/surveys, /surveys/{id}", "Create and manage surveys"],
        ["Questions", "/questions, /questions/{id}", "Persist and modify survey questions"],
        ["Survey Preview", "/surveys/{id}/questions", "Return survey details plus embedded questions for preview"],
        ["Responses", "/surveys/{id}/submit, /responses", "Accept submissions and report response data"],
        ["Analytics", "/surveys/{id}/analytics, /surveys/{id}/export", "Expose reporting and CSV export"],
    ]
    backend_api_table = Table(backend_api_data, colWidths=[1.35 * inch, 2.15 * inch, 3.3 * inch])
    backend_api_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1d4ed8")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.3),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#eff6ff"), colors.white]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(backend_api_table)

    story.append(Paragraph("4. Frontend Architecture", styles["SectionHeading"]))
    story.append(Paragraph(
        "The frontend is a React SPA built with Vite. It focuses on routing, form handling, view composition, and API orchestration. The actual server communication is centralized in a single service module, which keeps components small and easier to maintain.",
        styles["Body"],
    ))

    story.append(Paragraph("4.1 Application Shell", styles["SubHeading"]))
    story.append(bullet_list([
        "<b>src/main.jsx</b> mounts the app, wraps it with <b>BrowserRouter</b>, and provides the survey context to the component tree.",
        "<b>src/App.jsx</b> defines protected routes for dashboard, survey details, question builder, create survey, and preview pages.",
        "A token check in local storage controls the initial redirect between login and dashboard.",
    ], styles["Body"]))

    story.append(Paragraph("4.2 Shared State", styles["SubHeading"]))
    story.append(bullet_list([
        "<b>SurveyContext</b> stores the current survey, the active survey ID, and the question list used across builder and preview.",
        "This shared state lets the question builder and preview stay synchronized for the same survey during the same session.",
        "The active survey ID prevents the preview from mixing questions from another survey.",
    ], styles["Body"]))

    story.append(Paragraph("4.3 API Layer", styles["SubHeading"]))
    story.append(bullet_list([
        "<b>src/services/api.js</b> centralizes all fetch calls to the backend.",
        "It includes auth helpers for bearer tokens and question-cache handling to avoid duplicate GETs.",
        "The question endpoints support list, create, update, and delete operations, plus cache invalidation after mutations.",
    ], styles["Body"]))

    story.append(Paragraph("4.4 Frontend Pages", styles["SubHeading"]))
    story.append(bullet_list([
        "<b>Login</b> authenticates the admin and stores the JWT token.",
        "<b>Dashboard</b> loads survey, user, and response summaries.",
        "<b>CreateSurvey</b> creates a new survey and redirects back to the dashboard.",
        "<b>SurveyQuestions</b> is the question builder where questions are created, edited, deleted, and immediately persisted.",
        "<b>SurveyPreview</b> renders the stored questions in survey order so the admin can verify the final form before publishing.",
        "<b>SurveyDetails</b> displays a selected survey summary from the backend.",
    ], styles["Body"]))

    story.append(Paragraph("4.5 Question Builder Workflow", styles["SubHeading"]))
    story.append(bullet_list([
        "Admin opens a survey and navigates to the question builder.",
        "Frontend loads the backend question list for that survey.",
        "New questions are posted to PostgreSQL immediately through the API.",
        "After create/update/delete, the UI refreshes the local state and invalidates cached question data.",
        "Preview reads the active survey questions from shared context first and falls back to the backend if the page is refreshed or opened directly.",
    ], styles["Body"]))

    story.append(Paragraph("5. End-to-End Data Flow", styles["SectionHeading"]))
    flow_data = [
        ["Step", "Flow"],
        ["1", "Admin logs in and receives a JWT token."],
        ["2", "Admin creates a survey from the frontend."],
        ["3", "Admin opens the question builder for that survey."],
        ["4", "Frontend fetches existing questions from the backend."],
        ["5", "Admin adds, edits, or deletes questions."],
        ["6", "Backend validates, persists, and returns the saved question records."],
        ["7", "Preview displays the same survey questions in the correct order."],
        ["8", "Published surveys later collect employee responses."],
    ]
    flow_table = Table(flow_data, colWidths=[0.55 * inch, 6.2 * inch])
    flow_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#065f46")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#ecfdf5"), colors.white]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(flow_table)

    story.append(Paragraph("6. Architectural Strengths", styles["SectionHeading"]))
    story.append(bullet_list([
        "Clear separation between routes, services, schemas, and models on the backend.",
        "Centralized frontend API access simplifies future refactoring.",
        "Protected routes and JWT-based authentication are already in place.",
        "Question preview and builder now share the same source of truth for the active survey.",
        "The application is structured to support future features such as analytics, exports, and employee response review.",
    ], styles["Body"]))

    story.append(Paragraph("7. Current Constraints and Improvement Ideas", styles["SectionHeading"]))
    story.append(bullet_list([
        "A real edit form for survey metadata could be added to complete the full CRUD story on the frontend.",
        "The preview currently supports the main question types already implemented in the UI.",
        "A richer validation layer for duplicate questions, display ordering, and response logic would improve robustness.",
        "A production deployment plan could add environment-based configuration, logging, and automated tests.",
    ], styles["Body"]))

    story.append(Paragraph("8. Run and Deployment Notes", styles["SectionHeading"]))
    story.append(bullet_list([
        "Backend runs with Uvicorn on <b>http://127.0.0.1:8000</b>.",
        "Frontend runs with Vite on <b>http://localhost:5173</b>.",
        "CORS is configured on the backend to allow the frontend origin.",
        "Database connectivity uses PostgreSQL and SQLAlchemy models are created at startup.",
    ], styles["Body"]))

    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("Document prepared from the current workspace source code.", styles["SmallBody"]))

    doc.build(story)


if __name__ == "__main__":
    build_document()
    print(f"Created PDF: {OUTPUT_FILE}")