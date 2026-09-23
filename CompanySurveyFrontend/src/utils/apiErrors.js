const labels = {
    employee_id: "Employee ID", full_name: "Full name", email: "Email", password: "Password",
    department: "Department", role_id: "Role", role_name: "Role name", permission_ids: "Permissions",
    is_active: "Account status",
};

export function parseApiError(detail, fallback = "Request failed.") {
    const fields = {};
    if (typeof detail === "string" && detail.trim()) return { message: detail, fields };
    if (!Array.isArray(detail)) return { message: fallback, fields };
    const messages = detail.map((item) => {
        if (!item || typeof item.msg !== "string") return null;
        const location = Array.isArray(item.loc) ? item.loc : [];
        const field = location.find((part) => Object.hasOwn(labels, part));
        const text = item.msg.replace(/^Value error, /u, "");
        if (field && !fields[field]) fields[field] = text;
        return field ? labels[field] + ": " + text : text;
    }).filter(Boolean);
    return { message: [...new Set(messages)].join(" ") || fallback, fields };
}
