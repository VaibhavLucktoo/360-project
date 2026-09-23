"""Exercise the public submission and admin reporting API together."""

import csv
from io import StringIO
from uuid import uuid4

from app.auth.auth import get_current_user
from app.main import app
from app.models.user import User


def test_survey_publish_submit_report_export(client, db_session):
    admin = User(employee_id="FLOW001", full_name="Flow Admin",
                 email="flow@example.com", password_hash="unused",
                 role="admin", role_id=1, department="People")
    db_session.add(admin)
    db_session.commit()
    app.dependency_overrides[get_current_user] = lambda: admin

    def request(method, path, **kwargs):
        response = client.request(method, path, **kwargs)
        assert response.is_success, response.text
        return response

    survey = request("POST", "/surveys/", json={
        "title": "Flow check", "description": "API survey flow verification"
    }).json()
    path = f"/surveys/{survey['id']}"
    question = request("POST", "/questions/", json={
        "survey_id": survey["id"], "question_text": "Work location?",
        "question_type": "dropdown", "display_order": 1,
        "options": [
            {"option_text": "Remote", "display_order": 1},
            {"option_text": "Office", "display_order": 2},
        ],
    }).json()
    assert request("PUT", path + "/publish").json()["is_published"]

    # Remove the auth override to verify that public access needs no login.
    del app.dependency_overrides[get_current_user]
    assert request("GET", path + "/questions").json()["questions"]
    submission_id = str(uuid4())
    request("POST", path + "/submit", json={
        "submission_id": submission_id,
        "answers": [{"question_id": question["id"],
                     "answer": str(question["options"][0]["id"])}],
    })
    assert client.get(path + "/responses").status_code == 401

    app.dependency_overrides[get_current_user] = lambda: admin
    responses = request("GET", path + "/responses").json()
    assert len(responses) == 1
    assert request("GET", path + "/analytics").json()["total_responses"] == 1
    exported = request("GET", path + "/export")
    rows = list(csv.reader(StringIO(exported.text)))
    assert len(rows) == 2
    assert rows[1][0] == submission_id
    assert rows[1][-1] == "Remote"
