"""Full access-management CRUD and boundary-validation regressions."""
from uuid import uuid4

import pytest

from app.auth.auth import create_access_token
from app.models.user import User
from app.models.role import Role
from app.models.survey import Survey
from app.models.question import Question
from app.models.response import Response


@pytest.fixture()
def administrator(db_session):
    user = User(employee_id="ROOT", full_name="Access Admin", email="root@example.com",
                password_hash="unused", role="admin", role_id=1, department="People")
    db_session.add(user)
    db_session.commit()
    return user.id, {"Authorization": "Bearer " + create_access_token({"sub": str(user.id)})}


def user_body(**changes):
    return {
        "employee_id": "NEW001", "full_name": "New User", "email": "new@example.com",
        "password": "secure123", "department": "People", "role_id": 2, **changes,
    }


def update_body(**changes):
    body = user_body(**changes)
    body.pop("password")
    return body


def test_user_full_crud_login_deactivation_and_reactivation(client, administrator):
    _, headers = administrator
    response = client.post("/users/", headers=headers, json=user_body(email=" NEW@EXAMPLE.COM "))
    assert response.status_code == 200, response.text
    user = response.json()
    user_id = user["id"]
    assert user["email"] == "new@example.com"
    assert "password" not in user and "password_hash" not in user
    assert client.get(f"/users/{user_id}", headers=headers).json()["employee_id"] == "NEW001"
    assert any(item["id"] == user_id for item in client.get("/users/", headers=headers).json())
    login = client.post("/users/login", data={"username": "NEW@EXAMPLE.COM", "password": "secure123"})
    assert login.status_code == 200
    user_headers = {"Authorization": "Bearer " + login.json()["access_token"]}
    update = update_body(employee_id="EDIT001", full_name=" Edited User ", email="changed@example.com",
                         department=" Operations ", role_id=3, is_active=False)
    response = client.put(f"/users/{user_id}", headers=headers, json=update)
    assert response.status_code == 200, response.text
    assert response.json()["full_name"] == "Edited User"
    assert response.json()["department"] == "Operations"
    assert response.json()["role"] == "manager"
    assert client.get("/users/me", headers=user_headers).status_code == 401
    assert client.post("/users/login", data={"username": "changed@example.com", "password": "secure123"}).status_code == 401
    update["is_active"] = True
    assert client.put(f"/users/{user_id}", headers=headers, json=update).status_code == 200
    assert client.post("/users/login", data={"username": "CHANGED@EXAMPLE.COM", "password": "secure123"}).status_code == 200
    assert client.delete(f"/users/{user_id}", headers=headers).status_code == 200
    assert client.get(f"/users/{user_id}", headers=headers).status_code == 404
    assert client.delete(f"/users/{user_id}", headers=headers).status_code == 404


@pytest.mark.parametrize("field,value", [
    ("employee_id", "   "), ("employee_id", "E 001"), ("employee_id", "X" * 11),
    ("employee_id", "X\x00Y"), ("full_name", " "), ("full_name", "X" * 101),
    ("full_name", "A\x00B"), ("department", " "), ("department", "X" * 101),
    ("email", "not-an-email"), ("email", "a@b"), ("email", "a\x00b@example.com"),
    ("role_id", 0), ("role_id", -1), ("role_id", 2147483648), ("role_id", True),
    ("role_id", "1"), ("role_id", 1.5), ("is_active", "false"), ("is_active", None),
    ("password", "1234567"), ("password", "has space"), ("password", "x" * 73),
    ("password", "é" * 37), ("password", "abc\x00defgh"),
])
def test_create_user_rejects_invalid_fields(client, administrator, field, value):
    _, headers = administrator
    response = client.post("/users/", headers=headers, json=user_body(**{field: value}))
    assert response.status_code == 422, response.text
    assert any(field in item["loc"] for item in response.json()["detail"])


def test_duplicate_user_values_case_insensitive_and_atomic_update(client, administrator):
    _, headers = administrator
    first = client.post("/users/", headers=headers, json=user_body()).json()
    for data in [user_body(employee_id="new001", email="other@example.com"),
                 user_body(employee_id="OTHER", email="NEW@EXAMPLE.COM")]:
        assert client.post("/users/", headers=headers, json=data).status_code == 400
    second = client.post("/users/", headers=headers, json=user_body(employee_id="OTHER", email="other@example.com")).json()
    result = client.put(f"/users/{second['id']}", headers=headers,
                        json=update_body(employee_id="new001", email="other@example.com", full_name="Changed"))
    assert result.status_code == 400
    assert client.get(f"/users/{second['id']}", headers=headers).json()["full_name"] == "New User"
    assert client.put(f"/users/{first['id']}", headers=headers, json=update_body()).status_code == 200


def test_last_manager_cannot_be_deactivated_or_demoted_via_user_update(client, administrator):
    user_id, headers = administrator
    body = update_body(employee_id="ROOT", email="root@example.com", role_id=1, is_active=False)
    assert client.put(f"/users/{user_id}", headers=headers, json=body).status_code == 409
    body.update(is_active=True, role_id=2)
    assert client.put(f"/users/{user_id}", headers=headers, json=body).status_code == 409
    me = client.get("/users/me", headers=headers)
    assert me.status_code == 200 and me.json()["is_active"] and me.json()["role_id"] == 1


def test_user_update_validates_unknown_role_and_preserves_record(client, administrator):
    _, headers = administrator
    user = client.post("/users/", headers=headers, json=user_body()).json()
    result = client.put(f"/users/{user['id']}", headers=headers, json=update_body(full_name="Changed", role_id=999))
    assert result.status_code == 400
    assert client.get(f"/users/{user['id']}", headers=headers).json()["full_name"] == "New User"
    result = client.put(f"/users/{user['id']}", headers=headers, json=update_body(is_active="false"))
    assert result.status_code == 422


def test_role_full_crud_and_explicit_permission_update(client, administrator):
    _, headers = administrator
    catalog = client.get("/roles/permissions", headers=headers).json()
    ids = [item["id"] for item in catalog if item["key"] in ("survey.create", "survey.edit")]
    result = client.post("/roles/", headers=headers, json={"role_name": " Coordinator ", "permission_ids": ids})
    assert result.status_code == 201
    role = result.json()
    assert role["role_name"] == "Coordinator"
    assert len(client.get(f"/roles/{role['id']}", headers=headers).json()["permissions"]) == 2
    # An incomplete PUT must not silently clear the permissions.
    assert client.put(f"/roles/{role['id']}", headers=headers, json={"role_name": "Renamed"}).status_code == 422
    assert len(client.get(f"/roles/{role['id']}", headers=headers).json()["permissions"]) == 2
    assert client.put(f"/roles/{role['id']}", headers=headers,
                      json={"role_name": "Renamed", "permission_ids": [ids[0]]}).status_code == 200
    assert client.delete(f"/roles/{role['id']}", headers=headers).status_code == 200
    assert client.get(f"/roles/{role['id']}", headers=headers).status_code == 404


@pytest.mark.parametrize("method,path,body", [
    ("get", "/users/0", None), ("delete", "/users/-1", None),
    ("put", "/users/2147483648/role", {"role_id": 1}),
    ("get", "/roles/2147483648", None),
    ("delete", "/roles/0", None),
    ("put", "/roles/-1", {"role_name": "X", "permission_ids": []}),
    ("get", "/users/not-a-number", None),
])
def test_invalid_path_ids_return_validation_errors(client, administrator, method, path, body):
    _, headers = administrator
    result = client.request(method, path, headers=headers, **({"json": body} if body is not None else {}))
    assert result.status_code == 422, result.text


@pytest.mark.parametrize("body", [
    {"role_name": "A\x00B"},
    {"role_name": " "},
    {"role_name": "X" * 51},
    {"role_name": "Test", "permission_ids": [2147483648]},
    {"role_name": "Test", "permission_ids": [1.5]},
    {"role_name": "Test", "permission_ids": [1, 1]},
    {"role_name": "Test", "unexpected": True},
])
def test_role_boundary_validation(client, administrator, body):
    _, headers = administrator
    assert client.post("/roles/", headers=headers, json=body).status_code == 422


def test_roles_and_users_are_separately_authorized(client, db_session, administrator):
    _, admin_headers = administrator
    catalog = client.get("/roles/permissions", headers=admin_headers).json()
    for index, key in enumerate(("role.manage", "user.manage"), start=1):
        role = client.post("/roles/", headers=admin_headers, json={
            "role_name": key, "permission_ids": [item["id"] for item in catalog if item["key"] == key],
        }).json()
        user = User(employee_id=f"SCOPED{index}", full_name="Scoped User", email=f"scope{index}@example.com",
                    password_hash="unused", role=key, role_id=role["id"], department="People")
        db_session.add(user)
        db_session.commit()
        headers = {"Authorization": "Bearer " + create_access_token({"sub": str(user.id)})}
        assert client.get("/roles/", headers=headers).status_code == 200
        assert client.get("/users/", headers=headers).status_code == (200 if key == "user.manage" else 403)
        assert client.get("/roles/permissions", headers=headers).status_code == (200 if key == "role.manage" else 403)
        assert client.get(f"/roles/{role['id']}", headers=headers).status_code == (200 if key == "role.manage" else 403)
        denied = client.post("/roles/", headers=headers, json={"role_name": "Forbidden"})
        assert denied.status_code == (201 if key == "role.manage" else 403)


def test_deleting_respondent_preserves_their_answers(client, db_session, administrator):
    admin_id, headers = administrator
    user = client.post("/users/", headers=headers, json=user_body()).json()
    survey = Survey(title="Keep results", description="Keep results", created_by=admin_id, is_published=True)
    db_session.add(survey)
    db_session.flush()
    question = Question(survey_id=survey.id, question_text="Feedback?", question_type="text", display_order=1)
    db_session.add(question)
    db_session.flush()
    response = Response(survey_id=survey.id, question_id=question.id, user_id=user["id"],
                        submission_id=str(uuid4()), answer="Keep this answer")
    db_session.add(response)
    db_session.commit()
    response_id = response.id
    assert client.delete(f"/users/{user['id']}", headers=headers).status_code == 200
    db_session.expire_all()
    saved = db_session.get(Response, response_id)
    assert saved is not None and saved.answer == "Keep this answer" and saved.user_id is None


def test_survey_owner_can_be_deactivated_without_deleting_surveys(client, db_session, administrator):
    admin_id, headers = administrator
    user = client.post("/users/", headers=headers, json=user_body()).json()
    survey = Survey(title="Keep survey", description="Keep survey", created_by=user["id"])
    db_session.add(survey)
    db_session.commit()
    result = client.put(f"/users/{user['id']}", headers=headers, json=update_body(is_active=False))
    assert result.status_code == 200
    assert result.json()["is_active"] is False
    assert client.get(f"/surveys/{survey.id}", headers=headers).status_code == 200
