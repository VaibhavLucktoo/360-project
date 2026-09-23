"""Verify dynamic permissions using real tokens and separate request sessions."""
import pytest

from app.auth.auth import create_access_token
from app.models.user import User
from app.models.role import Role


def add_user(db, identifier, role_id=1):
    user = User(employee_id=identifier, full_name=identifier, email=f"{identifier}@example.com",
                password_hash="unused", role="legacy label", role_id=role_id, department="People")
    db.add(user)
    db.commit()
    return user.id, {"Authorization": "Bearer " + create_access_token({"sub": str(user.id)})}


@pytest.fixture()
def admin(db_session):
    return add_user(db_session, "ROOT")


def make_role(client, headers, keys, name="Survey Coordinator"):
    catalog = client.get("/roles/permissions", headers=headers).json()
    ids = [permission["id"] for permission in catalog if permission["key"] in keys]
    result = client.post("/roles/", headers=headers, json={"role_name": name, "permission_ids": ids})
    assert result.status_code == 201, result.text
    return result.json()


def test_dynamic_role_assignment_and_immediate_revocation(client, db_session, admin):
    admin_id, headers = admin
    role = make_role(client, headers, ["survey.create"])
    user_id, user_headers = add_user(db_session, "COORD", role["id"])
    profile = client.get("/users/me", headers=user_headers).json()
    assert profile["role"] == "Survey Coordinator"
    assert profile["permissions"] == ["survey.create"]
    body = {"title": "Quarterly survey", "description": "Team feedback"}
    assert client.post("/surveys/", headers=user_headers, json=body).status_code == 200
    assert client.get("/responses/", headers=user_headers).status_code == 403
    assert client.get("/users/", headers=user_headers).status_code == 403
    assert client.put(f"/users/{admin_id}/role", headers=user_headers, json={"role_id": role["id"]}).status_code == 403
    result = client.put(f"/roles/{role['id']}", headers=headers,
                        json={"role_name": "Renamed coordinator", "permission_ids": []})
    assert result.status_code == 200, result.text
    # Same JWT; no logout/login is needed to revoke access.
    assert client.post("/surveys/", headers=user_headers, json=body).status_code == 403
    profile = client.get("/users/me", headers=user_headers).json()
    assert profile["role"] == "Renamed coordinator"
    assert profile["permissions"] == []
    assert client.put(f"/users/{user_id}/role", headers=headers, json={"role_id": 1}).status_code == 200
    assert client.post("/surveys/", headers=user_headers, json=body).status_code == 200


@pytest.mark.parametrize("method,path,body", [
    ("post", "/surveys/", {"title": "Test", "description": "Test survey"}),
    ("put", "/surveys/1", {"title": "Test", "description": "Test survey"}),
    ("delete", "/surveys/1", None),
    ("put", "/surveys/1/publish", None),
    ("put", "/surveys/1/unpublish", None),
    ("get", "/surveys/1/questions/admin", None),
    ("get", "/surveys/1/responses", None),
    ("get", "/surveys/1/analytics", None),
    ("get", "/surveys/1/export", None),
    ("post", "/questions/", {"survey_id": 1, "question_text": "Question", "question_type": "text", "display_order": 1}),
    ("get", "/questions/", None),
    ("put", "/questions/1", {"question_text": "Question", "question_type": "text", "display_order": 1, "is_required": True}),
    ("delete", "/questions/1", None),
    ("get", "/questions/1/responses", None),
    ("get", "/questions/1/analytics", None),
    ("get", "/responses/", None),
    ("put", "/responses/1", {"answer": "changed"}),
    ("delete", "/responses/1", None),
    ("get", "/users/", None),
    ("get", "/roles/", None),
    ("get", "/roles/permissions", None),
    ("post", "/roles/", {"role_name": "Attempt", "permission_ids": []}),
    ("put", "/roles/1", {"role_name": "Attempt", "permission_ids": []}),
    ("delete", "/roles/1", None),
])
def test_respondent_cannot_call_management_endpoints(client, db_session, admin, method, path, body):
    _, headers = add_user(db_session, "RESP", 3)
    result = client.request(method, path, headers=headers, **({"json": body} if body is not None else {}))
    assert result.status_code == 403, result.text


def test_role_validation_and_assigned_role_deletion(client, db_session, admin):
    _, headers = admin
    for body in [
        {"role_name": "   "},
        {"role_name": "x" * 51},
        {"role_name": "Test", "permission_ids": [1, 1]},
        {"role_name": "Test", "permission_ids": [-1]},
        {"role_name": "Test", "permission_ids": [True]},
    ]:
        assert client.post("/roles/", headers=headers, json=body).status_code == 422
    assert client.post("/roles/", headers=headers, json={"role_name": "ADMIN"}).status_code == 409
    assert client.post("/roles/", headers=headers, json={"role_name": "Unknown", "permission_ids": [999]}).status_code == 400
    role = make_role(client, headers, [])
    user_id, _ = add_user(db_session, "MEMBER", role["id"])
    assert client.delete(f"/roles/{role['id']}", headers=headers).status_code == 409
    assert client.put(f"/users/{user_id}/role", headers=headers, json={"role_id": 999}).status_code == 400
    assert client.put(f"/users/{user_id}/role", headers=headers, json={"role_id": 2}).status_code == 200
    assert client.delete(f"/roles/{role['id']}", headers=headers).status_code == 200


def test_last_access_manager_is_protected(client, admin):
    user_id, headers = admin
    assert client.put(f"/users/{user_id}/role", headers=headers, json={"role_id": 2}).status_code == 409
    assert client.put("/roles/1", headers=headers, json={"role_name": "Administrator", "permission_ids": []}).status_code == 409
    assert client.delete(f"/users/{user_id}", headers=headers).status_code == 409
    assert "role.manage" in client.get("/users/me", headers=headers).json()["permissions"]


def test_legacy_admin_label_does_not_grant_access_and_inactive_token_is_rejected(client, db_session, admin):
    user_id, headers = add_user(db_session, "LEGACY", 2)
    user = db_session.get(User, user_id)
    user.role = "admin"
    db_session.commit()
    assert client.get("/roles/", headers=headers).status_code == 403
    user.is_active = False
    db_session.commit()
    assert client.get("/users/me", headers=headers).status_code == 401


def test_independent_export_and_analytics_permissions(client, db_session, admin):
    _, admin_headers = admin
    survey = client.post("/surveys/", headers=admin_headers,
                         json={"title": "Draft", "description": "A draft survey"}).json()
    survey_id = survey["id"]
    for key, allowed, denied in [
        ("analytics.view", "analytics", "export"),
        ("response.export", "export", "responses"),
        ("response.view", "responses", "analytics"),
    ]:
        role = make_role(client, admin_headers, [key], key)
        _, headers = add_user(db_session, str(role["id"]), role["id"])
        assert client.get(f"/surveys/{survey_id}/{allowed}", headers=headers).status_code == 200
        assert client.get(f"/surveys/{survey_id}/{denied}", headers=headers).status_code == 403
        assert client.get(f"/surveys/{survey_id}", headers=headers).status_code == 200
    _, respondent_headers = add_user(db_session, "PUBLIC", 2)
    assert client.get("/surveys/", headers=respondent_headers).json() == []
    assert client.get(f"/surveys/{survey_id}", headers=respondent_headers).status_code == 404
    assert client.get(f"/surveys/{survey_id}/questions").status_code == 404


def test_user_creation_accepts_dynamic_role_and_rejects_unknown_id(client, admin):
    _, headers = admin
    role = make_role(client, headers, [], "Arbitrary role")
    body = {"employee_id": "NEWUSER", "full_name": "New User", "email": "new@example.com",
            "password": "secure123", "department": "People", "role_id": 999}
    assert client.post("/users/", headers=headers, json=body).status_code == 400
    body["role_id"] = role["id"]
    response = client.post("/users/", headers=headers, json=body)
    assert response.status_code == 200, response.text
    assert response.json()["role"] == "Arbitrary role"
    assert response.json()["permissions"] == []


def test_delete_user_removes_account_and_invalidates_token(client, db_session, admin):
    _, headers = admin
    user_id, user_headers = add_user(db_session, "DELETE", 2)
    assert client.delete(f"/users/{user_id}", headers=user_headers).status_code == 403
    assert client.delete(f"/users/{user_id}", headers=headers).status_code == 200
    assert client.get("/users/me", headers=user_headers).status_code == 401
    assert client.get(f"/users/{user_id}", headers=headers).status_code == 404


def test_delete_survey_owner_returns_clear_error_and_preserves_data(client, db_session, admin):
    from app.models.survey import Survey
    _, headers = admin
    user_id, _ = add_user(db_session, "OWNER", 2)
    survey = Survey(title="Keep survey", description="Preserved", created_by=user_id)
    db_session.add(survey)
    db_session.commit()
    result = client.delete(f"/users/{user_id}", headers=headers)
    assert result.status_code == 409
    assert "owns surveys" in result.json()["detail"]
    assert client.get(f"/users/{user_id}", headers=headers).status_code == 200
    assert db_session.get(Survey, survey.id) is not None
