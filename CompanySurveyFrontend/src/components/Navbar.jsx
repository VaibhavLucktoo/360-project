import "../styles/Navbar.css";
import { FaBell, FaUserCircle, FaSun, FaMoon } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/useTheme";

/* Navbar Component */
function Navbar({ title = "Dashboard", userName = "User" }) {
    const navigate = useNavigate();
    const { resolvedTheme, setTheme } = useTheme();

    function handleToggleTheme() {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }

    return (
        <header className="navbar">
            <div className="navbar-left">
                <h2>{title}</h2>
            </div>

            {/* Right Side Controls */}
            <div className="navbar-right">
                {/* Sun / Moon Theme Toggle */}
                <button
                    type="button"
                    className="nav-icon-btn nav-theme-btn"
                    aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
                    title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
                    onClick={handleToggleTheme}
                >
                    {resolvedTheme === "dark" ? (
                        <FaSun className="nav-icon theme-sun" />
                    ) : (
                        <FaMoon className="nav-icon theme-moon" />
                    )}
                </button>

                {/* Notifications */}
                <button
                    type="button"
                    className="nav-icon-btn"
                    aria-label="View response notifications"
                    title="Responses"
                    onClick={() => navigate("/responses")}
                >
                    <FaBell className="nav-icon" />
                </button>

                {/* Profile Pill */}
                <button
                    type="button"
                    className="profile"
                    aria-label="Open profile settings"
                    title="Profile settings"
                    onClick={() => navigate("/settings")}
                >
                    <FaUserCircle className="profile-icon" />
                    <span className="profile-name">{userName}</span>
                </button>
            </div>
        </header>
    );
}

export default Navbar;
