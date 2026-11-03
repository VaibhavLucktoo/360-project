import "../styles/Navbar.css";
import { FaBell, FaUserCircle, FaSun, FaMoon } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/useTheme";

function Navbar({ title = "Dashboard", userName = "User" }) {
    const navigate = useNavigate();
    const { resolvedTheme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    const firstLetter = (userName && userName.length > 0)
        ? userName.trim().charAt(0).toUpperCase()
        : "U";

    return (
        <header className="navbar">
            <div className="navbar-left">
                <span className="navbar-badge-pulse" aria-hidden="true" />
                <h1 className="navbar-title">{title}</h1>
            </div>

            {/* Right Side Controls */}
            <div className="navbar-right">
                {/* Theme Quick Toggle */}
                <button
                    type="button"
                    className="nav-icon-btn theme-toggle-btn"
                    aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
                    title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
                    onClick={toggleTheme}
                >
                    {resolvedTheme === "dark" ? (
                        <FaSun className="nav-icon sun-icon" />
                    ) : (
                        <FaMoon className="nav-icon moon-icon" />
                    )}
                </button>

                {/* Notifications Link */}
                <button
                    type="button"
                    className="nav-icon-btn"
                    aria-label="View response notifications"
                    title="View responses"
                    onClick={() => navigate("/responses")}
                >
                    <FaBell className="nav-icon" />
                </button>

                {/* User Profile Pill */}
                <button
                    type="button"
                    className="navbar-profile-pill"
                    aria-label="Open profile settings"
                    title="Profile & account settings"
                    onClick={() => navigate("/settings")}
                >
                    <div className="navbar-avatar-circle" aria-hidden="true">
                        {firstLetter}
                    </div>
                    <span className="navbar-username">{userName}</span>
                </button>
            </div>
        </header>
    );
}

export default Navbar;
