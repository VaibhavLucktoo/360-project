import { removeLeadingWhitespace } from "../utils/inputWhitespace";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaPen,
    FaPlus,
    FaTrash,
    FaShieldAlt,
    FaKey,
    FaUserShield,
    FaUsers,
    FaCheckCircle,
    FaExclamationCircle,
    FaSearch,
    FaTimes,
    FaCheck,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import FieldError from "../components/FieldError";
import { useAuth } from "../context/useAuth";
import { useManagementData } from "../hooks/useManagementData";
import {
    getRoles,
    getPermissions,
    createRole,
    updateRole,
    deleteRole,
} from "../services/api";
import { focusFirstError, validateRole } from "../utils/accessValidation";
import "../styles/AccessManagement.css";

const emptyRole = () => ({ role_name: "", permission_ids: [] });
const initialData = { roles: [], permissions: [] };

async function loadRoles() {
    const [roles, permissions] = await Promise.all([
        getRoles(),
        getPermissions(),
    ]);
    return { roles, permissions };
}

export default function Roles() {
    const { user, can, refresh } = useAuth();
    const navigate = useNavigate();
    const {
        data: { roles, permissions },
        loading,
        error: loadError,
        reload,
    } = useManagementData(loadRoles, initialData);

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
        setForm(
            role
                ? {
                      role_name: role.role_name,
                      permission_ids: role.permissions.map((item) => item.id),
                  }
                : emptyRole()
        );
        setErrors({});
        setError("");
        setMessage("");
        setShowForm(true);
        window.requestAnimationFrame(() =>
            formRef.current?.querySelector("input")?.focus()
        );
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
                navigate(
                    account.permissions.includes("user.manage")
                        ? "/users"
                        : "/dashboard",
                    { replace: true }
                );
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
        const payload = {
            role_name: form.role_name.trim(),
            permission_ids: form.permission_ids,
        };
        mutate(
            () =>
                editing === null
                    ? createRole(payload)
                    : updateRole(editing, payload),
            editing === null ? "Role created successfully." : "Role updated successfully.",
            closeForm
        );
    }

    /* Categorized permissions */
    const groupedPermissions = useMemo(() => {
        const categories = {
            "Surveys & Form Building": [],
            "Feedback & Analytics": [],
            "Security & User Management": [],
            "Other Permissions": [],
        };

        permissions.forEach((perm) => {
            const key = perm.key || "";
            if (key.startsWith("survey.")) {
                categories["Surveys & Form Building"].push(perm);
            } else if (key.startsWith("response.") || key.startsWith("analytics.")) {
                categories["Feedback & Analytics"].push(perm);
            } else if (key.startsWith("user.") || key.startsWith("role.")) {
                categories["Security & User Management"].push(perm);
            } else {
                categories["Other Permissions"].push(perm);
            }
        });

        return Object.entries(categories).filter(
            ([, perms]) => perms.length > 0
        );
    }, [permissions]);

    const filtered = roles.filter((role) =>
        role.role_name.toLowerCase().includes(search.trim().toLowerCase())
    );

    return (
        <>
            <Sidebar />
            <main className="access-page">
                <div className="access-page-container">
                    {/* Header */}
                    <header className="access-header-block">
                        <div className="access-header-top">
                            <div className="access-header-badge">
                                <FaShieldAlt className="badge-shield" />
                                <span>Access Governance & RBAC</span>
                            </div>

                            {/* Section Switcher Tabs */}
                            <nav className="access-nav-tabs" aria-label="Access Navigation">
                                <button
                                    type="button"
                                    className="access-nav-tab active"
                                    onClick={() => navigate("/roles")}
                                >
                                    <FaUserShield />
                                    <span>Roles & Permissions</span>
                                </button>
                                {can("user.manage") && (
                                    <button
                                        type="button"
                                        className="access-nav-tab"
                                        onClick={() => navigate("/users")}
                                    >
                                        <FaUsers />
                                        <span>User Directory</span>
                                    </button>
                                )}
                            </nav>
                        </div>

                        <div className="access-hero-row">
                            <div className="access-hero-copy">
                                <h1>Roles & Permissions</h1>
                                <p>
                                    Define granular security profiles, manage administrative controls, and determine respondent capabilities.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="access-button primary btn-hero-action"
                                disabled={busy || loading || Boolean(loadError)}
                                onClick={() => openForm()}
                            >
                                <FaPlus aria-hidden="true" />
                                <span>Create Role</span>
                            </button>
                        </div>
                    </header>

                    {/* Alerts */}
                    {error && (
                        <div role="alert" className="access-banner error">
                            <FaExclamationCircle className="banner-icon" />
                            <span>{error}</span>
                        </div>
                    )}
                    {message && (
                        <div role="status" className="access-banner success">
                            <FaCheckCircle className="banner-icon" />
                            <span>{message}</span>
                        </div>
                    )}
                    {loadError && (
                        <div role="alert" className="access-banner error">
                            <FaExclamationCircle className="banner-icon" />
                            <span>{loadError}</span>
                            <button
                                type="button"
                                className="access-retry-btn"
                                disabled={busy}
                                onClick={reload}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* KPI Summary Strip */}
                    <section className="access-kpi-grid">
                        <div className="access-kpi-card">
                            <div className="kpi-icon-well purple">
                                <FaUserShield />
                            </div>
                            <div className="kpi-body">
                                <span className="kpi-label">Configured Roles</span>
                                <strong className="kpi-value">{roles.length}</strong>
                                <span className="kpi-hint">Security profiles</span>
                            </div>
                        </div>

                        <div className="access-kpi-card">
                            <div className="kpi-icon-well blue">
                                <FaKey />
                            </div>
                            <div className="kpi-body">
                                <span className="kpi-label">Security Scopes</span>
                                <strong className="kpi-value">{permissions.length}</strong>
                                <span className="kpi-hint">Granular permissions</span>
                            </div>
                        </div>

                        <div className="access-kpi-card">
                            <div className="kpi-icon-well emerald">
                                <FaShieldAlt />
                            </div>
                            <div className="kpi-body">
                                <span className="kpi-label">Your Current Role</span>
                                <strong className="kpi-value text-sm">
                                    {roles.find((r) => r.id === user?.role_id)?.role_name || "Assigned"}
                                </strong>
                                <span className="kpi-hint">Active session profile</span>
                            </div>
                        </div>
                    </section>

                    {/* Create / Edit Role Form Modal / Section */}
                    {showForm && (
                        <section
                            className="access-card access-editor-card"
                            aria-labelledby="role-form-title"
                        >
                            <div className="editor-card-header">
                                <div className="editor-header-text">
                                    <h2 id="role-form-title">
                                        {editing === null ? "Create New Security Role" : `Edit Role: ${form.role_name}`}
                                    </h2>
                                    <p>
                                        Configure role title and toggle authorized capabilities.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-editor-close"
                                    onClick={closeForm}
                                    title="Close form"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <form noValidate onSubmit={submit} ref={formRef}>
                                <fieldset disabled={busy} className="editor-fieldset">
                                    {/* Role Name */}
                                    <div className="form-group-block">
                                        <label className="access-name-field" htmlFor="role-name">
                                            <span className="label-text">
                                                Role Name <span className="required-star">*</span>
                                            </span>
                                            <input
                                                id="role-name"
                                                required
                                                maxLength={50}
                                                value={form.role_name}
                                                placeholder="e.g. Survey Auditor"
                                                aria-invalid={Boolean(errors.role_name)}
                                                aria-describedby={
                                                    errors.role_name
                                                        ? "role-name-error"
                                                        : undefined
                                                }
                                                onChange={(event) => {
                                                    setForm({
                                                        ...form,
                                                        role_name: removeLeadingWhitespace(
                                                            event.target.value
                                                        ),
                                                    });
                                                    setErrors({
                                                        ...errors,
                                                        role_name: "",
                                                    });
                                                }}
                                                onBlur={() =>
                                                    setErrors({
                                                        ...errors,
                                                        role_name: validateRole(
                                                            form,
                                                            roles,
                                                            editing,
                                                            permissions
                                                        ).role_name,
                                                    })
                                                }
                                            />
                                            <FieldError id="role-name-error">
                                                {errors.role_name}
                                            </FieldError>
                                        </label>
                                    </div>

                                    {/* Permissions Scope Section */}
                                    <div className="form-group-block permissions-group">
                                        <div className="permissions-group-header">
                                            <h3>
                                                Permissions Scope{" "}
                                                <span className="access-muted-pill">
                                                    {form.permission_ids.length} of {permissions.length} selected
                                                </span>
                                            </h3>
                                            <p className="access-help-copy">
                                                Leaving permissions empty grants standard respondent access. Survey permissions apply across all surveys.
                                            </p>
                                            {editing === user?.role_id && (
                                                <div className="access-warning-callout">
                                                    <FaExclamationCircle />
                                                    <span>You are currently assigned to this role. Saving changes will immediately update your own permissions.</span>
                                                </div>
                                            )}
                                        </div>

                                        {groupedPermissions.map(([groupName, groupPerms]) => (
                                            <div key={groupName} className="permission-category-group">
                                                <h4 className="permission-category-title">{groupName}</h4>
                                                <div className="permission-grid">
                                                    {groupPerms.map((permission) => {
                                                        const isChecked = form.permission_ids.includes(permission.id);
                                                        return (
                                                            <label
                                                                className={`permission-option-card ${
                                                                    isChecked ? "selected" : ""
                                                                }`}
                                                                key={permission.id}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => {
                                                                        setForm((current) => ({
                                                                            ...current,
                                                                            permission_ids: current.permission_ids.includes(
                                                                                permission.id
                                                                            )
                                                                                ? current.permission_ids.filter(
                                                                                      (id) => id !== permission.id
                                                                                  )
                                                                                : [...current.permission_ids, permission.id],
                                                                        }));
                                                                        setErrors((current) => ({
                                                                            ...current,
                                                                            permission_ids: "",
                                                                        }));
                                                                    }}
                                                                />
                                                                <div className="permission-card-body">
                                                                    <div className="permission-header-line">
                                                                        <span className="permission-key-tag">
                                                                            {permission.key}
                                                                        </span>
                                                                        {isChecked && (
                                                                            <span className="permission-active-check">
                                                                                <FaCheck />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <small className="permission-desc-text">
                                                                        {permission.description}
                                                                    </small>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        <FieldError id="role-permissions-error">
                                            {errors.permission_ids}
                                        </FieldError>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="access-form-actions">
                                        <button
                                            className="access-button primary btn-save"
                                            type="submit"
                                        >
                                            {busy ? "Saving..." : editing === null ? "Create Role" : "Save Changes"}
                                        </button>
                                        <button
                                            className="access-button btn-cancel"
                                            type="button"
                                            onClick={closeForm}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </fieldset>
                            </form>
                        </section>
                    )}

                    {/* Roles Directory Table Card */}
                    <section
                        className="access-card access-table-card"
                        aria-label="Role directory"
                    >
                        <div className="access-toolbar">
                            <div className="toolbar-title-block">
                                <h2>
                                    Role Directory{" "}
                                    <span className="access-muted-pill">
                                        {roles.length}
                                    </span>
                                </h2>
                                <p>All active security profiles configured in the system.</p>
                            </div>

                            <div className="toolbar-search-box">
                                <FaSearch className="search-icon" />
                                <input
                                    type="search"
                                    aria-label="Search roles"
                                    placeholder="Search by role title..."
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            removeLeadingWhitespace(event.target.value)
                                        )
                                    }
                                />
                                {search && (
                                    <button
                                        type="button"
                                        className="search-clear-btn"
                                        onClick={() => setSearch("")}
                                        title="Clear search"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="access-loading-state" role="status">
                                <div className="access-spinner"></div>
                                <p>Loading role configurations...</p>
                            </div>
                        ) : (
                            <div className="access-table-scroll">
                                <table className="access-data-table">
                                    <thead>
                                        <tr>
                                            <th>Role Profile</th>
                                            <th>Configured Permissions</th>
                                            <th className="access-action-column">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((role) => (
                                            <tr key={role.id}>
                                                <td className="role-name-cell">
                                                    <div className="role-profile-wrap">
                                                        <span className="role-icon-bullet">
                                                            <FaUserShield />
                                                        </span>
                                                        <div>
                                                            <strong className="role-title-text">
                                                                {role.role_name}
                                                            </strong>
                                                            {role.id === user?.role_id && (
                                                                <span className="your-role-badge">
                                                                    Your Active Role
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="role-permissions-cell">
                                                    {role.permissions.length ? (
                                                        <details className="role-permissions-dropdown">
                                                            <summary className="permissions-summary-trigger">
                                                                <span className="permission-count-chip">
                                                                    {role.permissions.length} permissions
                                                                </span>
                                                                <span className="view-link">View Scopes ▾</span>
                                                            </summary>
                                                            <div className="permission-chips-drawer">
                                                                {role.permissions.map((permission) => (
                                                                    <span
                                                                        key={permission.id}
                                                                        className="permission-scope-badge"
                                                                    >
                                                                        {permission.key}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </details>
                                                    ) : (
                                                        <span className="respondent-access-chip">
                                                            Respondent Access (Read-Only)
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="access-actions-wrap">
                                                        <button
                                                            className="access-icon-button"
                                                            disabled={busy}
                                                            title="Edit role"
                                                            aria-label={"Edit role " + role.role_name}
                                                            onClick={() => openForm(role)}
                                                        >
                                                            <FaPen aria-hidden="true" />
                                                        </button>
                                                        <button
                                                            className="access-icon-button danger"
                                                            disabled={busy}
                                                            title="Delete role"
                                                            aria-label={"Delete role " + role.role_name}
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        'Delete role "' +
                                                                            role.role_name +
                                                                            '"? Users assigned to this role must be reassigned first.'
                                                                    )
                                                                ) {
                                                                    mutate(
                                                                        () => deleteRole(role.id),
                                                                        "Role deleted successfully.",
                                                                        () => {
                                                                            if (editing === role.id)
                                                                                closeForm();
                                                                        }
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <FaTrash aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {!filtered.length && (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="access-empty-state"
                                                >
                                                    <FaUserShield className="empty-state-icon" />
                                                    <p>
                                                        {search
                                                            ? "No roles match your search query."
                                                            : "No security roles available in the directory."}
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
