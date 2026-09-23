import test from "node:test";
import assert from "node:assert/strict";
import { validateRole, validateUser, userPayload } from "../src/utils/accessValidation.js";
import { parseApiError } from "../src/utils/apiErrors.js";

const roles = [{ id: 1, role_name: "Admin" }, { id: 2, role_name: "Respondent" }];
const permissions = [{ id: 1 }, { id: 2 }];
const users = [{ id: 1, employee_id: "E001", email: "person@example.com" }];
const validUser = {
    employee_id: "E002", full_name: "New User", email: "new@example.com", department: "People",
    password: "secure123", role_id: "2", is_active: true,
};

test("roles allow a new name with no permissions", () => {
    assert.deepEqual(validateRole({ role_name: " Reviewer ", permission_ids: [] }, roles, null, permissions), {});
});
test("roles reject blank, duplicate, overlong, and control-character names", () => {
    for (const name of [" ", "ADMIN", "x".repeat(51), "A\u0000B"]) {
        assert.ok(validateRole({ role_name: name, permission_ids: [] }, roles, null, permissions).role_name);
    }
});
test("editing the same role preserves its name", () => {
    assert.deepEqual(validateRole({ role_name: "Admin", permission_ids: [1] }, roles, 1, permissions), {});
});
test("roles reject duplicate or stale permissions", () => {
    for (const ids of [[1, 1], [999], [0], [true], ["1"], null]) {
        assert.ok(validateRole({ role_name: "Reviewer", permission_ids: ids }, roles, null, permissions).permission_ids);
    }
});
test("valid user creation and editing payloads", () => {
    assert.deepEqual(validateUser(validUser, users, roles), {});
    assert.deepEqual(userPayload({ ...validUser, full_name: " New User ", email: " NEW@EXAMPLE.COM " }), {
        ...validUser, full_name: "New User", email: "new@example.com", role_id: 2,
    });
    assert.equal(Object.hasOwn(userPayload(validUser, true), "password"), false);
});
test("editing ignores the same user's email and employee ID", () => {
    const form = { ...validUser, employee_id: "E001", email: "person@example.com", password: "" };
    assert.deepEqual(validateUser(form, users, roles, 1), {});
    const errors = validateUser(form, users, roles, null);
    assert.ok(errors.employee_id && errors.email && errors.password);
});
for (const [field, value] of [
    ["employee_id", " "], ["employee_id", "X".repeat(11)], ["employee_id", "E 01"],
    ["full_name", " "], ["full_name", "X".repeat(101)], ["full_name", "A\u0000B"],
    ["department", " "], ["department", "X".repeat(101)],
    ["email", ""], ["email", "missing-at.example.com"], ["email", "bad@domain"],
    ["role_id", ""], ["role_id", 0], ["role_id", 999], ["role_id", 2147483648],
    ["password", ""], ["password", "short"], ["password", "has space"],
    ["password", "x".repeat(73)], ["password", "é".repeat(37)], ["password", "abc\u0000defgh"],
    ["is_active", "false"],
]) {
    test("user validation rejects " + field + ": " + JSON.stringify(value), () => {
        assert.ok(validateUser({ ...validUser, [field]: value }, users, roles)[field]);
    });
}
test("password byte boundary supports Unicode without bcrypt truncation", () => {
    assert.equal(validateUser({ ...validUser, password: "é".repeat(36) }, users, roles).password, undefined);
});
test("duplicate checks are case insensitive", () => {
    const errors = validateUser({ ...validUser, employee_id: "e001", email: "PERSON@EXAMPLE.COM" }, users, roles);
    assert.ok(errors.employee_id);
    assert.ok(errors.email);
});
test("API validation errors map to their input fields", () => {
    const error = parseApiError([
        { loc: ["body", "email"], msg: "Enter a valid email" },
        { loc: ["body", "permission_ids", 0], msg: "Value error, Unknown permission" },
    ]);
    assert.equal(error.fields.email, "Enter a valid email");
    assert.equal(error.fields.permission_ids, "Unknown permission");
    assert.match(error.message, /Email: Enter a valid email/);
    assert.match(error.message, /Permissions: Unknown permission/);
});
test("API error parser handles plain errors and unexpected server replies", () => {
    assert.deepEqual(parseApiError("Role is assigned"), { message: "Role is assigned", fields: {} });
    for (const value of [null, undefined, {}, [], [null], [{ msg: 42 }]]) {
        assert.equal(parseApiError(value, "Try again").message, "Try again");
    }
});
