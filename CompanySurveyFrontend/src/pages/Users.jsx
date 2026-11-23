import {
    normalizeUserInput,
    removeLeadingWhitespace,
} from "../utils/inputWhitespace";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaPen,
    FaPlus,
    FaTrash,
    FaShieldAlt,
    FaUsers,
    FaUserCheck,
    FaUserTimes,
    FaBuilding,
    FaUserShield,
    FaCheckCircle,
    FaExclamationCircle,
    FaSearch,
    FaTimes,
    FaEnvelope,
    FaIdBadge,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import FieldError from "../components/FieldError";
import { useAuth } from "../context/useAuth";
import { useManagementData } from "../hooks/useManagementData";
import {
    getRoles,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    clearStoredToken,
} from "../services/api";
import {
    focusFirstError,
    userPayload,
    validateUser,
} from "../utils/accessValidation";
import "../styles/AccessManagement.css";

const emptyUser = () => ({
    employee_id: "",
    full_name: "",
    email: "",
    password: "",
    department: "",
    role_id: "",
    is_active: true,
});

const initialData = { roles: [], users: [] };

async function loadUsers() {
    const [roles, users] = await Promise.all([getRoles(), getUsers()]);
    return { roles, users };
}

const fields = [
    ["employee_id", "Employee ID", "text", 10, "e.g. EMP042"],
    ["full_name", "Full Name", "text", 100, "e.g. Sarah Jenkins"],
    ["email", "Work Email", "email", 255, "e.g. sarah.j@company.com"],
    ["department", "Department", "text", 100, "e.g. Engineering"],
    ["password", "Initial Password", "password", 72, "Min. 8 characters"],
];

function getInitials(name = "") {
    const parts = name.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Users() {
    const { user: currentUser, can, refresh } = useAuth();
    const navigate = useNavigate();
    const {
        data: { users, roles },
        loading,
        error: loadError,
        reload,
    } = useManagementData(loadUsers, initialData);

    const [form, setForm] = useState(emptyUser);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");

    const inFlight = useRef(false);
    const formRef = useRef(null);

    function openForm(user = null) {
        setEditing(user?.id ?? null);
        setForm(
            user
                ? {
                      employee_id: user.employee_id,
                      full_name: user.full_name,
                      email: user.email,
                      department: user.department,
                      role_id: String(user.role_id),
                      is_active: user.is_active,
                      password: "",
                  }
                : emptyUser()
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
                navigate(
                    account.permissions.includes("role.manage")
                        ? "/roles"
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
        const nextErrors = validateUser(form, users, roles, editing);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            focusFirstError(formRef.current);
            return;
        }
        if (
            editing === currentUser?.id &&
            !form.is_active &&
            !window.confirm(
                "Deactivate your own account? You will be signed out immediately."
            )
        ) {
            return;
        }
        const payload = userPayload(form, editing !== null);
        mutate(
            () =>
                editing === null
                    ? createUser(payload)
                    : updateUser(editing, payload),
            editing === null ? "User created successfully." : "User updated successfully.",
            editing === currentUser?.id && !form.is_active
        );
    }

    /* Compute unique departments */
    const departments = useMemo(() => {
        const unique = new Set(
            users.map((u) => u.department?.trim()).filter(Boolean)
        );
        return Array.from(unique).sort();
    }, [users]);

    /* Filter users */
    const filtered = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch = [
                user.full_name,
                user.employee_id,
                user.email,
                user.department,
                user.role,
            ].some((value) =>
                (value || "").toLowerCase().includes(search.trim().toLowerCase())
            );

            if (!matchesSearch) return false;

            if (statusFilter === "active" && !user.is_active) return false;
            if (statusFilter === "inactive" && user.is_active) return false;

            if (
                departmentFilter !== "all" &&
                user.department !== departmentFilter
            ) {
                return false;
            }

            return true;
        });
    }, [users, search, statusFilter, departmentFilter]);

    const activeCount = users.filter((u) => u.is_active).length;
    const inactiveCount = users.filter((u) => !u.is_active).length;

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
                                {can("role.manage") && (
                                    <button
                                        type="button"
                                        className="access-nav-tab"
                                        onClick={() => navigate("/roles")}
                                    >
                                        <FaUserShield />
                                        <span>Roles & Permissions</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="access-nav-tab active"
                                    onClick={() => navigate("/users")}
                                >
                                    <FaUsers />
                                    <span>User Directory</span>
                                </button>
                            </nav>
                        </div>

                        <div className="access-hero-row">
                            <div className="access-hero-copy">
                                <h1>User Accounts Directory</h1>
                                <p>
                                    Provision employee accounts, assign organizational roles, and govern active session access.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="access-button primary btn-hero-action"
                                disabled={busy || loading || Boolean(loadError)}
                                onClick={() => openForm()}
                            >
                                <FaPlus aria-hidden="true" />
                                <span>New User Account</span>
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
                            <div className="kpi-icon-well blue">
                                <FaUsers />
                            </div>
                            <div className="kpi-body">
                                <span className="kpi-label">Total Users</span>
                                <strong className="kpi-value">{users.length}</strong>
                                <span className="kpi-hint">Configured accounts</span>
                            </div>
                        </div>

                        <div className="access-kpi-card">
                            <div className="kpi-icon-well emerald">
                                <FaUserCheck />
                            </div>
                            <div className="kpi-body">
                                <span className="kpi-label">Active Accounts</span>
                                <strong className="kpi-value">{activeCount}</strong>
                                <span className="kpi-hint">Can log in & pulse</span>
                            </div>
                        </div>

                        <div className="access-kpi-card">
                            <div className="kpi-icon-well amber">
                                <FaUserTimes />
                            </div>
                            <div className="kpi-body">
                                <span className="kpi-label">Inactive Accounts</span>
                                <strong className="kpi-value">{inactiveCount}</strong>
                                <span className="kpi-hint">Deactivated accounts</span>
                            </div>
                        </div>

                        <div className="access-kpi-card">
                            <div className="kpi-icon-well purple">
                                <FaBuilding />
                            </div>
                            <div className="kpi-body">
                                <span className="kpi-label">Departments</span>
                                <strong className="kpi-value">{departments.length}</strong>
                                <span className="kpi-hint">Distinct divisions</span>
                            </div>
                        </div>
                    </section>

                    {/* Create / Edit User Form Modal / Card */}
                    {showForm && (
                        <section
                            className="access-card access-editor-card"
                            aria-labelledby="user-form-title"
                        >
                            <div className="editor-card-header">
                                <div className="editor-header-text">
                                    <h2 id="user-form-title">
                                        {editing === null
                                            ? "Provision New User Account"
                                            : `Edit Account: ${form.full_name}`}
                                    </h2>
                                    <p>
                                        Configure employee credentials, security assignment, and operational status.
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
                                    <div className="user-fields-grid">
                                        {fields
                                            .filter(
                                                ([key]) =>
                                                    key !== "password" ||
                                                    editing === null
                                            )
                                            .map(
                                                ([
                                                    key,
                                                    label,
                                                    type,
                                                    maxLength,
                                                    placeholder,
                                                ]) => (
                                                    <label
                                                        key={key}
                                                        htmlFor={"user-" + key}
                                                        className="user-field-label"
                                                    >
                                                        <span className="label-text">
                                                            {label}{" "}
                                                            <span className="required-star">*</span>
                                                        </span>
                                                        <input
                                                            id={"user-" + key}
                                                            required
                                                            type={type}
                                                            maxLength={maxLength}
                                                            value={form[key]}
                                                            placeholder={placeholder}
                                                            autoComplete={
                                                                key === "password"
                                                                    ? "new-password"
                                                                    : "off"
                                                            }
                                                            aria-invalid={Boolean(
                                                                errors[key]
                                                            )}
                                                            aria-describedby={
                                                                errors[key]
                                                                    ? "user-" +
                                                                      key +
                                                                      "-error"
                                                                    : undefined
                                                            }
                                                            onChange={(event) => {
                                                                setForm({
                                                                    ...form,
                                                                    [key]: normalizeUserInput(
                                                                        key,
                                                                        event.target
                                                                            .value
                                                                    ),
                                                                });
                                                                setErrors({
                                                                    ...errors,
                                                                    [key]: "",
                                                                });
                                                            }}
                                                            onBlur={() =>
                                                                setErrors({
                                                                    ...errors,
                                                                    [key]: validateUser(
                                                                        form,
                                                                        users,
                                                                        roles,
                                                                        editing
                                                                    )[key],
                                                                })
                                                            }
                                                        />
                                                        <FieldError
                                                            id={
                                                                "user-" +
                                                                key +
                                                                "-error"
                                                            }
                                                        >
                                                            {errors[key]}
                                                        </FieldError>
                                                    </label>
                                                )
                                            )}

                                        {/* Role Selector */}
                                        <label
                                            htmlFor="user-role"
                                            className="user-field-label"
                                        >
                                            <span className="label-text">
                                                Assigned Security Role{" "}
                                                <span className="required-star">*</span>
                                            </span>
                                            <select
                                                id="user-role"
                                                required
                                                value={form.role_id}
                                                aria-invalid={Boolean(
                                                    errors.role_id
                                                )}
                                                aria-describedby={
                                                    errors.role_id
                                                        ? "user-role-error"
                                                        : undefined
                                                }
                                                onChange={(event) => {
                                                    setForm({
                                                        ...form,
                                                        role_id:
                                                            event.target.value,
                                                    });
                                                    setErrors({
                                                        ...errors,
                                                        role_id: "",
                                                    });
                                                }}
                                            >
                                                <option value="">
                                                    Choose an authorized role
                                                </option>
                                                {roles.map((role) => (
                                                    <option
                                                        key={role.id}
                                                        value={role.id}
                                                    >
                                                        {role.role_name}
                                                    </option>
                                                ))}
                                            </select>
                                            <FieldError id="user-role-error">
                                                {errors.role_id}
                                            </FieldError>
                                        </label>
                                    </div>

                                    {/* Active Account Switch */}
                                    <div className="active-toggle-container">
                                        <label className="access-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={form.is_active}
                                                onChange={(event) =>
                                                    setForm({
                                                        ...form,
                                                        is_active:
                                                            event.target.checked,
                                                    })
                                                }
                                            />
                                            <span className="checkbox-custom-ui"></span>
                                            <div className="checkbox-text-group">
                                                <strong>Account is Active</strong>
                                                <small>
                                                    Deactivate accounts that own surveys to safely preserve survey history without allowing login.
                                                </small>
                                            </div>
                                        </label>
                                    </div>

                                    <FieldError id="user-active-error">
                                        {errors.is_active}
                                    </FieldError>

                                    {/* Action Buttons */}
                                    <div className="access-form-actions">
                                        <button
                                            className="access-button primary btn-save"
                                            type="submit"
                                        >
                                            {busy
                                                ? "Saving Account..."
                                                : editing === null
                                                ? "Create Account"
                                                : "Save Changes"}
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

                    {/* Users Directory Table Card */}
                    <section
                        className="access-card access-table-card"
                        aria-label="User directory"
                    >
                        {/* Toolbar */}
                        <div className="access-toolbar users-toolbar">
                            <div className="toolbar-title-block">
                                <h2>
                                    Employee Directory{" "}
                                    <span className="access-muted-pill">
                                        {filtered.length} of {users.length}
                                    </span>
                                </h2>
                                <p>Manage user accounts, roles, and status across departments.</p>
                            </div>

                            <div className="toolbar-controls-row">
                                {/* Search Box */}
                                <div className="toolbar-search-box">
                                    <FaSearch className="search-icon" />
                                    <input
                                        type="search"
                                        aria-label="Search users"
                                        placeholder="Search by name, email, department..."
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(
                                                removeLeadingWhitespace(
                                                    event.target.value
                                                )
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

                                {/* Status Filter Pills */}
                                <div className="status-filter-pills">
                                    <button
                                        type="button"
                                        className={`filter-pill-btn ${
                                            statusFilter === "all" ? "active" : ""
                                        }`}
                                        onClick={() => setStatusFilter("all")}
                                    >
                                        All ({users.length})
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-pill-btn ${
                                            statusFilter === "active" ? "active" : ""
                                        }`}
                                        onClick={() => setStatusFilter("active")}
                                    >
                                        Active ({activeCount})
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-pill-btn ${
                                            statusFilter === "inactive" ? "active" : ""
                                        }`}
                                        onClick={() => setStatusFilter("inactive")}
                                    >
                                        Inactive ({inactiveCount})
                                    </button>
                                </div>

                                {/* Department Filter Dropdown */}
                                {departments.length > 0 && (
                                    <select
                                        className="toolbar-dept-select"
                                        value={departmentFilter}
                                        onChange={(e) =>
                                            setDepartmentFilter(e.target.value)
                                        }
                                        aria-label="Filter by department"
                                    >
                                        <option value="all">All Departments</option>
                                        {departments.map((dept) => (
                                            <option key={dept} value={dept}>
                                                {dept}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="access-loading-state" role="status">
                                <div className="access-spinner"></div>
                                <p>Loading user directory...</p>
                            </div>
                        ) : (
                            <div className="access-table-scroll">
                                <table className="access-data-table">
                                    <thead>
                                        <tr>
                                            <th>Employee Profile</th>
                                            <th>Email Address</th>
                                            <th>Department</th>
                                            <th>Assigned Role</th>
                                            <th>Status</th>
                                            <th className="access-action-column">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((user) => {
                                            const isSelf =
                                                user.id === currentUser?.id;
                                            return (
                                                <tr key={user.id}>
                                                    {/* User Profile */}
                                                    <td className="user-profile-cell">
                                                        <div className="user-profile-wrap">
                                                            <div className="user-avatar-circle">
                                                                {getInitials(
                                                                    user.full_name
                                                                )}
                                                            </div>
                                                            <div className="user-details-col">
                                                                <strong className="user-name-text">
                                                                    {user.full_name}
                                                                </strong>
                                                                {isSelf && (
                                                                    <span className="your-role-badge">
                                                                        You
                                                                    </span>
                                                                )}
                                                                <div className="user-empid-tag">
                                                                    <FaIdBadge className="tag-icon" />
                                                                    <span>
                                                                        {user.employee_id}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Email */}
                                                    <td className="user-email-cell">
                                                        <div className="email-wrap">
                                                            <FaEnvelope className="email-icon" />
                                                            <span>{user.email}</span>
                                                        </div>
                                                    </td>

                                                    {/* Department */}
                                                    <td>
                                                        <span className="dept-tag">
                                                            {user.department || "—"}
                                                        </span>
                                                    </td>

                                                    {/* Role */}
                                                    <td>
                                                        <span className="role-chip">
                                                            <FaUserShield className="role-chip-icon" />
                                                            <span>{user.role}</span>
                                                        </span>
                                                    </td>

                                                    {/* Status */}
                                                    <td>
                                                        <span
                                                            className={`access-status-pill ${
                                                                user.is_active
                                                                    ? "active"
                                                                    : "inactive"
                                                            }`}
                                                        >
                                                            {user.is_active && (
                                                                <span className="active-glow-dot"></span>
                                                            )}
                                                            <span>
                                                                {user.is_active
                                                                    ? "Active"
                                                                    : "Inactive"}
                                                            </span>
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td>
                                                        <div className="access-actions-wrap">
                                                            <button
                                                                className="access-icon-button"
                                                                disabled={busy}
                                                                title="Edit user"
                                                                aria-label={
                                                                    "Edit user " +
                                                                    user.full_name
                                                                }
                                                                onClick={() =>
                                                                    openForm(user)
                                                                }
                                                            >
                                                                <FaPen aria-hidden="true" />
                                                            </button>
                                                            <button
                                                                className="access-icon-button danger"
                                                                disabled={busy}
                                                                title="Delete user"
                                                                aria-label={
                                                                    "Delete user " +
                                                                    user.full_name
                                                                }
                                                                onClick={() => {
                                                                    const ownAccount =
                                                                        user.id ===
                                                                        currentUser?.id;
                                                                    if (
                                                                        window.confirm(
                                                                            'Delete "' +
                                                                                user.full_name +
                                                                                '" (' +
                                                                                user.email +
                                                                                ")? This permanently removes the account." +
                                                                                (ownAccount
                                                                                    ? " You will be signed out immediately."
                                                                                    : "")
                                                                        )
                                                                    ) {
                                                                        mutate(
                                                                            () =>
                                                                                deleteUser(
                                                                                    user.id
                                                                                ),
                                                                            "User deleted successfully.",
                                                                            ownAccount
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <FaTrash aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {!filtered.length && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="access-empty-state"
                                                >
                                                    <FaUsers className="empty-state-icon" />
                                                    <p>
                                                        {search ||
                                                        statusFilter !== "all" ||
                                                        departmentFilter !== "all"
                                                            ? "No users match your filters or search query."
                                                            : "No employee accounts found in the directory."}
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
