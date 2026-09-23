import { normalizeUserInput, removeLeadingWhitespace } from "../utils/inputWhitespace";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPen, FaPlus, FaTrash } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import FieldError from "../components/FieldError";
import { useAuth } from "../context/useAuth";
import { useManagementData } from "../hooks/useManagementData";
import { getRoles, getUsers, createUser, updateUser, deleteUser, clearStoredToken } from "../services/api";
import { focusFirstError, userPayload, validateUser } from "../utils/accessValidation";
import "../styles/AccessManagement.css";

const emptyUser = () => ({ employee_id: "", full_name: "", email: "", password: "", department: "", role_id: "", is_active: true });
const initialData = { roles: [], users: [] };
async function loadUsers() {
    const [roles, users] = await Promise.all([getRoles(), getUsers()]);
    return { roles, users };
}
const fields = [
    ["employee_id", "Employee ID", "text", 10],
    ["full_name", "Full name", "text", 100],
    ["email", "Email", "email", 255],
    ["department", "Department", "text", 100],
    ["password", "Initial password", "password", 72],
];

export default function Users() {
    const { user: currentUser, refresh } = useAuth();
    const navigate = useNavigate();
    const { data: { users, roles }, loading, error: loadError, reload } = useManagementData(loadUsers, initialData);
    const [form, setForm] = useState(emptyUser);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [search, setSearch] = useState("");
    const inFlight = useRef(false);
    const formRef = useRef(null);

    function openForm(user = null) {
        setEditing(user?.id ?? null);
        setForm(user ? { employee_id: user.employee_id, full_name: user.full_name, email: user.email,
            department: user.department, role_id: String(user.role_id), is_active: user.is_active, password: "" } : emptyUser());
        setErrors({});
        setError("");
        setMessage("");
        setShowForm(true);
        window.requestAnimationFrame(() => formRef.current?.querySelector("input")?.focus());
    }
    function closeForm() {
        setShowForm(false);
        setEditing(null);
        setForm(emptyUser());
        setErrors({});
    }
    async function mutate(action, success, signOut = false) {
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        setError("");
        setMessage("");
        try {
            await action();
            closeForm();
            if (signOut) {
                clearStoredToken();
                navigate("/login", { replace: true });
                return;
            }
            setMessage(success);
            const account = await refresh();
            if (account && !account.permissions.includes("user.manage")) {
                navigate(account.permissions.includes("role.manage") ? "/roles" : "/dashboard", { replace: true });
                return;
            }
            if (account) await reload();
        } catch (failure) {
            setError(failure.message);
            if (failure.fieldErrors) setErrors(failure.fieldErrors);
            focusFirstError(formRef.current);
        } finally {
            inFlight.current = false;
            setBusy(false);
        }
    }
    function submit(event) {
        event.preventDefault();
        const nextErrors = validateUser(form, users, roles, editing);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            focusFirstError(formRef.current);
            return;
        }
        if (editing === currentUser?.id && !form.is_active &&
            !window.confirm("Deactivate your own account? You will be signed out.")) return;
        const payload = userPayload(form, editing !== null);
        mutate(() => editing === null ? createUser(payload) : updateUser(editing, payload),
            editing === null ? "User created." : "User updated.", editing === currentUser?.id && !form.is_active);
    }
    const filtered = users.filter((user) => [user.full_name, user.employee_id, user.email, user.department, user.role]
        .some((value) => value.toLowerCase().includes(search.trim().toLowerCase())));

    return <>
        <Sidebar />
        <main className="access-page">
            <header className="access-header"><div><h1>Users</h1><p>Manage accounts and assign their roles.</p></div>
                <button className="access-button primary" disabled={busy || loading || Boolean(loadError)} onClick={() => openForm()}><FaPlus aria-hidden="true" /> New user</button>
            </header>
            {error && <p role="alert" className="access-error">{error}</p>}
            {message && <p role="status" className="access-success">{message}</p>}
            {loadError && <div role="alert" className="access-error">{loadError} <button className="access-button" disabled={busy} onClick={reload}>Retry</button></div>}
            {showForm && <section className="access-card access-editor" aria-labelledby="user-form-title">
                <h2 id="user-form-title">{editing === null ? "Create user" : "Edit user"}</h2>
                <form noValidate onSubmit={submit} ref={formRef}>
                    <fieldset disabled={busy}>
                        <div className="user-fields">
                            {fields.filter(([key]) => key !== "password" || editing === null).map(([key, label, type, maxLength]) =>
                                <label key={key} htmlFor={"user-" + key}>{label}
                                    <input id={"user-" + key} required type={type} maxLength={maxLength} value={form[key]}
                                        autoComplete={key === "password" ? "new-password" : "off"}
                                        aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? "user-" + key + "-error" : undefined}
                                        onChange={(event) => { setForm({ ...form, [key]: normalizeUserInput(key, event.target.value) }); setErrors({ ...errors, [key]: "" }); }}
                                        onBlur={() => setErrors({ ...errors, [key]: validateUser(form, users, roles, editing)[key] })} />
                                    <FieldError id={"user-" + key + "-error"}>{errors[key]}</FieldError>
                                </label>
                            )}
                            <label htmlFor="user-role">Role
                                <select id="user-role" required value={form.role_id} aria-invalid={Boolean(errors.role_id)}
                                    aria-describedby={errors.role_id ? "user-role-error" : undefined}
                                    onChange={(event) => { setForm({ ...form, role_id: event.target.value }); setErrors({ ...errors, role_id: "" }); }}>
                                    <option value="">Choose a role</option>
                                    {roles.map((role) => <option key={role.id} value={role.id}>{role.role_name}</option>)}
                                </select>
                                <FieldError id="user-role-error">{errors.role_id}</FieldError>
                            </label>
                        </div>
                        <label className="access-checkbox"><input type="checkbox" checked={form.is_active}
                            onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Active account</label>
                        <p className="access-help">Inactive users cannot log in. Deactivate accounts that own surveys to preserve their survey data.</p>
                        <FieldError id="user-active-error">{errors.is_active}</FieldError>
                        <div className="access-actions">
                            <button className="access-button primary" type="submit">{busy ? "Saving..." : "Save user"}</button>
                            <button className="access-button" type="button" onClick={closeForm}>Cancel</button>
                        </div>
                    </fieldset>
                </form>
            </section>}
            <section className="access-card" aria-label="User directory">
                <div className="access-toolbar"><h2>All users <span className="access-muted">({users.length})</span></h2>
                    <input type="search" aria-label="Search users" placeholder="Search users" value={search} onChange={(event) => setSearch(removeLeadingWhitespace(event.target.value))} /></div>
                {loading ? <p role="status">Loading users...</p> : <div className="access-table-scroll"><table>
                    <thead><tr><th>User</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th className="access-action-column">Actions</th></tr></thead>
                    <tbody>{filtered.map((user) => <tr key={user.id}>
                        <td><strong>{user.full_name}</strong>{user.id === currentUser?.id && <span className="access-muted"> · You</span>}<small className="access-muted access-block">{user.employee_id}</small></td>
                        <td>{user.email}</td><td>{user.department}</td><td>{user.role}</td>
                        <td><span className={"access-status " + (user.is_active ? "active" : "inactive")}>{user.is_active ? "Active" : "Inactive"}</span></td>
                        <td><div className="access-actions">
                            <button className="access-icon-button" disabled={busy} title="Edit user" aria-label={"Edit user " + user.full_name} onClick={() => openForm(user)}><FaPen aria-hidden="true" /></button>
                            <button className="access-icon-button danger" disabled={busy} title="Delete user" aria-label={"Delete user " + user.full_name}
                                onClick={() => {
                                    const ownAccount = user.id === currentUser?.id;
                                    if (window.confirm('Delete "' + user.full_name + '" (' + user.email + ')? This permanently removes the account.' + (ownAccount ? " You will be signed out." : ""))) {
                                        mutate(() => deleteUser(user.id), "User deleted.", ownAccount);
                                    }
                                }}><FaTrash aria-hidden="true" /></button>
                        </div></td>
                    </tr>)}
                    {!filtered.length && <tr><td colSpan={6} className="access-empty">{search ? "No matching users." : "No users available."}</td></tr>}
                    </tbody>
                </table></div>}
            </section>
        </main>
    </>;
}
