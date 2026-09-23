import { removeWhitespace } from "../utils/inputWhitespace";
import {
    useEffect,
    useState,
} from "react";

import {
    FaArrowLeft,
    FaCheck,
    FaMoon,
    FaSun,
    FaUserCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import {
    changePassword,
    getCurrentUser,
} from "../services/api";
import { useTheme } from "../context/useTheme";
import "../styles/Settings.css";





function Settings() {

    const navigate = useNavigate();
    const {
        theme,
        resolvedTheme,
        setTheme,
    } = useTheme();

    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [profileError, setProfileError] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);


    useEffect(() => {

        getCurrentUser()
            .then((currentUser) => {
                setUser(currentUser);
                setProfileError("");
            })
            .catch((error) => {
                setProfileError(
                    error.message ||
                    "Unable to load profile."
                );
            })
            .finally(() => {
                setLoadingUser(false);
            });

    }, []);


    async function handlePasswordSubmit(event) {

        event.preventDefault();
        setPasswordError("");
        setPasswordMessage("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("All password fields are required.");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters.");
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError("New password must be different from the current password.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirmation do not match.");
            return;
        }

        try {
            setSavingPassword(true);

            await changePassword({
                current_password: currentPassword,
                new_password: newPassword,
            });

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordMessage("Password updated successfully.");
        } catch (error) {
            setPasswordError(
                error.message ||
                "Unable to update password."
            );
        } finally {
            setSavingPassword(false);
        }

    }


    function handlePasswordInput(setValue) {

        return (event) => {
            setValue(
                removeWhitespace(
                    event.target.value
                )
            );
        };

    }


    const roleLabel =
        user?.role
            ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
            : "Unavailable";


    return (
        <>
            <Sidebar />

            <main className="settings-page">

                <button
                    type="button"
                    className="settings-back"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft />
                    <span>Back</span>
                </button>

                <header className="settings-header">
                    <div>
                        <span className="settings-label">
                            Account
                        </span>

                        <h1>
                            Profile and settings
                        </h1>

                        <p>
                            Manage your account access and app appearance.
                        </p>
                    </div>

                    <div className="settings-theme-status">
                        {resolvedTheme === "dark"
                            ? <FaMoon />
                            : <FaSun />
                        }
                        <span>
                            {resolvedTheme} mode
                        </span>
                    </div>
                </header>

                <section className="settings-grid">

                    <article className="settings-card">
                        <div className="settings-card-title">
                            <FaUserCircle />
                            <h2>Profile</h2>
                        </div>

                        {loadingUser && (
                            <p className="settings-muted">
                                Loading profile...
                            </p>
                        )}

                        {profileError && (
                            <p className="settings-error">
                                {profileError}
                            </p>
                        )}

                        {user && (
                            <dl className="profile-list">
                                <div>
                                    <dt>Name</dt>
                                    <dd>{user.full_name}</dd>
                                </div>

                                <div>
                                    <dt>Email</dt>
                                    <dd>{user.email}</dd>
                                </div>

                                <div>
                                    <dt>Employee ID</dt>
                                    <dd>{user.employee_id}</dd>
                                </div>

                                <div>
                                    <dt>Department</dt>
                                    <dd>{user.department}</dd>
                                </div>

                                <div>
                                    <dt>Role</dt>
                                    <dd>
                                        <span className="role-pill">
                                            {roleLabel}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        )}
                    </article>

                    <article className="settings-card">
                        <div className="settings-card-title">
                            <FaMoon />
                            <h2>Theme</h2>
                        </div>

                        <div className="theme-options">
                            {["system", "light", "dark"].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    className={
                                        theme === option
                                            ? "theme-option active"
                                            : "theme-option"
                                    }
                                    onClick={() => setTheme(option)}
                                >
                                    {theme === option && <FaCheck />}
                                    <span>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </article>

                    <article className="settings-card password-card">
                        <div className="settings-card-title">
                            <FaUserCircle />
                            <h2>Update password</h2>
                        </div>

                        <form
                            className="password-form"
                            onSubmit={handlePasswordSubmit}
                            noValidate
                        >
                            <label>
                                <span>Current password</span>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={handlePasswordInput(setCurrentPassword)}
                                    autoComplete="current-password"
                                    required
                                />
                            </label>

                            <label>
                                <span>New password</span>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={handlePasswordInput(setNewPassword)}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                            </label>

                            <label>
                                <span>Confirm new password</span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={handlePasswordInput(setConfirmPassword)}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                            </label>

                            {passwordError && (
                                <p className="settings-error">
                                    {passwordError}
                                </p>
                            )}

                            {passwordMessage && (
                                <p className="settings-success">
                                    {passwordMessage}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="settings-primary"
                                disabled={savingPassword}
                            >
                                {savingPassword
                                    ? "Updating..."
                                    : "Update password"
                                }
                            </button>
                        </form>
                    </article>

                </section>

            </main>
        </>
    );

}


export default Settings;
