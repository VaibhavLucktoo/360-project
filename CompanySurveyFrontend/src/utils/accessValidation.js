const MAX_ID = 2147483647;
const length = (value) => [...value].length;
const hasControl = (value) => [...value].some((character) => {
    const point = character.codePointAt(0);
    return point < 32 || (point >= 127 && point <= 159);
});

function textError(value, label, max) {
    const text = String(value ?? "").trim();
    if (!text) return label + " is required.";
    if (hasControl(text)) return label + " cannot contain control characters.";
    if (length(text) > max) return label + " must be at most " + max + " characters.";
    return "";
}

export function validateRole(form, roles = [], editingId = null, permissions = []) {
    const errors = {};
    const name = String(form.role_name ?? "").trim();
    const nameError = textError(name, "Role name", 50);
    if (nameError) errors.role_name = nameError;
    else if (roles.some((role) => role.id !== editingId && role.role_name.toLowerCase() === name.toLowerCase())) {
        errors.role_name = "A role with this name already exists.";
    }
    const ids = form.permission_ids;
    if (!Array.isArray(ids) || new Set(ids).size !== ids.length ||
        ids.some((id) => !Number.isInteger(id) || id <= 0 || id > MAX_ID || !permissions.some((item) => item.id === id))) {
        errors.permission_ids = "Choose valid permissions from the list.";
    }
    return errors;
}

export function validateUser(form, users = [], roles = [], editingId = null) {
    const errors = {};
    for (const [key, label, max] of [
        ["employee_id", "Employee ID", 10], ["full_name", "Full name", 100], ["department", "Department", 100],
    ]) {
        const error = textError(form[key], label, max);
        if (error) errors[key] = error;
    }
    const employeeId = String(form.employee_id ?? "").trim();
    if (!errors.employee_id && /\s/u.test(employeeId)) errors.employee_id = "Employee ID cannot contain spaces.";
    const email = String(form.email ?? "").trim();
    if (!email) errors.email = "Email is required.";
    else if (length(email) > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) || hasControl(email)) {
        errors.email = "Enter a valid email address.";
    }
    for (const user of users) {
        if (user.id === editingId) continue;
        if (!errors.email && user.email.toLowerCase() === email.toLowerCase()) errors.email = "This email is already in use.";
        if (!errors.employee_id && user.employee_id.toLowerCase() === employeeId.toLowerCase()) errors.employee_id = "This employee ID is already in use.";
    }
    const roleId = Number(form.role_id);
    if (!Number.isInteger(roleId) || roleId <= 0 || roleId > MAX_ID || !roles.some((role) => role.id === roleId)) {
        errors.role_id = "Choose an available role.";
    }
    if (typeof form.is_active !== "boolean") errors.is_active = "Choose an account status.";
    if (editingId === null) {
        const password = String(form.password ?? "").trim();
        if (!password) errors.password = "Password is required.";
        else if (length(password) < 8) errors.password = "Use at least 8 characters.";
        else if (/\s/u.test(password) || hasControl(password)) errors.password = "Password cannot contain spaces or control characters.";
        else if (new TextEncoder().encode(password).length > 72) errors.password = "Use at most 72 UTF-8 bytes (usually 72 characters).";
    }
    return errors;
}

export function userPayload(form, editing = false) {
    const result = {
        employee_id: form.employee_id.trim(), full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(), department: form.department.trim(),
        role_id: Number(form.role_id), is_active: form.is_active,
    };
    if (!editing) result.password = form.password.trim();
    return result;
}

export function focusFirstError(formElement) {
    window.requestAnimationFrame(() => formElement?.querySelector('[aria-invalid="true"]')?.focus());
}
