import { removeLeadingWhitespace } from "../utils/inputWhitespace";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPen, FaPlus, FaTrash } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import FieldError from "../components/FieldError";
import { useAuth } from "../context/useAuth";
import { useManagementData } from "../hooks/useManagementData";
import { getRoles, getPermissions, createRole, updateRole, deleteRole } from "../services/api";
import { focusFirstError, validateRole } from "../utils/accessValidation";
import "../styles/AccessManagement.css";

const emptyRole = () => ({ role_name: "", permission_ids: [] });
const initialData = { roles: [], permissions: [] };
async function loadRoles() {
    const [roles, permissions] = await Promise.all([getRoles(), getPermissions()]);
    return { roles, permissions };
}

export default function Roles() {
    const { user, refresh } = useAuth();
    const navigate = useNavigate();
    const { data: { roles, permissions }, loading, error: loadError, reload } = useManagementData(loadRoles, initialData);
    const [form, setForm] = useState(emptyRole);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [search, setSearch] = useState("");
    const inFlight = useRef(false);
    const formRef = useRef(null);

    function openForm(role = null) {
        setEditing(role?.id ?? null);
        setForm(role ? { role_name: role.role_name, permission_ids: role.permissions.map((item) => item.id) } : emptyRole());
        setErrors({});
        setError("");
        setMessage("");
        setShowForm(true);
        window.requestAnimationFrame(() => formRef.current?.querySelector("input")?.focus());
    }

    function closeForm() {
        setShowForm(false);
        setEditing(null);
        setForm(emptyRole());
        setErrors({});
    }

    async function mutate(action, success, afterSuccess) {
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        setError("");
        setMessage("");
        try {
            await action();
            afterSuccess?.();
            setMessage(success);
            const account = await refresh();
            if (account && !account.permissions.includes("role.manage")) {
                navigate(account.permissions.includes("user.manage") ? "/users" : "/dashboard", { replace: true });
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
        const nextErrors = validateRole(form, roles, editing, permissions);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            focusFirstError(formRef.current);
            return;
        }
        const payload = { role_name: form.role_name.trim(), permission_ids: form.permission_ids };
        mutate(() => editing === null ? createRole(payload) : updateRole(editing, payload),
            editing === null ? "Role created." : "Role updated.", closeForm);
    }

    const filtered = roles.filter((role) => role.role_name.toLowerCase().includes(search.trim().toLowerCase()));
    return <>
        <Sidebar />
        <main className="access-page">
            <header className="access-header"><div><h1>Roles</h1><p>Choose what each role can do.</p></div>
                <button type="button" className="access-button primary" disabled={busy || loading || Boolean(loadError)} onClick={() => openForm()}><FaPlus aria-hidden="true" /> New role</button>
            </header>
            {error && <p role="alert" className="access-error">{error}</p>}
            {message && <p role="status" className="access-success">{message}</p>}
            {loadError && <div role="alert" className="access-error">{loadError} <button className="access-button" disabled={busy} onClick={reload}>Retry</button></div>}
            {showForm && <section className="access-card access-editor" aria-labelledby="role-form-title">
                <h2 id="role-form-title">{editing === null ? "Create role" : "Edit role"}</h2>
                <form noValidate onSubmit={submit} ref={formRef}>
                    <fieldset disabled={busy}>
                        <label className="access-name-field" htmlFor="role-name">Role name
                            <input id="role-name" required maxLength={50} value={form.role_name}
                                aria-invalid={Boolean(errors.role_name)} aria-describedby={errors.role_name ? "role-name-error" : undefined}
                                onChange={(event) => { setForm({ ...form, role_name: removeLeadingWhitespace(event.target.value) }); setErrors({ ...errors, role_name: "" }); }}
                                onBlur={() => setErrors({ ...errors, role_name: validateRole(form, roles, editing, permissions).role_name })} />
                            <FieldError id="role-name-error">{errors.role_name}</FieldError>
                        </label>
                        <h3>Permissions <span className="access-muted">({form.permission_ids.length} selected)</span></h3>
                        <p className="access-help">No permissions means respondent access. Survey permissions apply to all surveys. User and role management grant control over access.</p>
                        {editing === user?.role_id && <p className="access-help">You use this role. Changes also affect your own access.</p>}
                        <div className="permission-grid">
                            {permissions.map((permission) => <label className="permission-option" key={permission.id}>
                                <input type="checkbox" checked={form.permission_ids.includes(permission.id)} onChange={() => {
                                    setForm((current) => ({ ...current, permission_ids: current.permission_ids.includes(permission.id)
                                        ? current.permission_ids.filter((id) => id !== permission.id) : [...current.permission_ids, permission.id] }));
                                    setErrors((current) => ({ ...current, permission_ids: "" }));
                                }} />
                                <span><strong>{permission.key}</strong><small>{permission.description}</small></span>
                            </label>)}
                        </div>
                        <FieldError id="role-permissions-error">{errors.permission_ids}</FieldError>
                        <div className="access-actions">
                            <button className="access-button primary" type="submit">{busy ? "Saving..." : "Save role"}</button>
                            <button className="access-button" type="button" onClick={closeForm}>Cancel</button>
                        </div>
                    </fieldset>
                </form>
            </section>}
            <section className="access-card" aria-label="Role directory">
                <div className="access-toolbar"><h2>All roles <span className="access-muted">({roles.length})</span></h2>
                    <input type="search" aria-label="Search roles" placeholder="Search roles" value={search} onChange={(event) => setSearch(removeLeadingWhitespace(event.target.value))} /></div>
                {loading ? <p role="status">Loading roles...</p> : <div className="access-table-scroll"><table>
                    <thead><tr><th>Role</th><th>Permissions</th><th className="access-action-column">Actions</th></tr></thead>
                    <tbody>{filtered.map((role) => <tr key={role.id}>
                        <td><strong>{role.role_name}</strong>{role.id === user?.role_id && <span className="access-muted"> · Your role</span>}</td>
                        <td>{role.permissions.length ? <details><summary>{role.permissions.length} permissions</summary><ul className="permission-summary">
                            {role.permissions.map((permission) => <li key={permission.id}>{permission.key}</li>)}
                        </ul></details> : <span className="access-muted">Respondent access</span>}</td>
                        <td><div className="access-actions">
                            <button className="access-icon-button" disabled={busy} title="Edit role" aria-label={"Edit role " + role.role_name} onClick={() => openForm(role)}><FaPen aria-hidden="true" /></button>
                            <button className="access-icon-button danger" disabled={busy} title="Delete role" aria-label={"Delete role " + role.role_name}
                                onClick={() => {
                                    if (window.confirm('Delete role "' + role.role_name + '"? Users assigned to this role must be reassigned first.')) {
                                        mutate(() => deleteRole(role.id), "Role deleted.", () => { if (editing === role.id) closeForm(); });
                                    }
                                }}><FaTrash aria-hidden="true" /></button>
                        </div></td>
                    </tr>)}
                    {!filtered.length && <tr><td colSpan={3} className="access-empty">{search ? "No matching roles." : "No roles available."}</td></tr>}
                    </tbody>
                </table></div>}
            </section>
        </main>
    </>;
}
