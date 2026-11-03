import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChartBar, FaLock, FaShieldAlt, FaCheckCircle, FaSun, FaMoon } from "react-icons/fa";

import Input from "../components/Input";
import Button from "../components/Button";
import { useTheme } from "../context/useTheme";
import { loginUser, saveToken } from "../services/api";
import { removeWhitespace } from "../utils/inputWhitespace";
import "../styles/Login.css";

function Login() {
    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Navigation & Theme
    const navigate = useNavigate();
    const { resolvedTheme, setTheme } = useTheme();

    function handleThemeToggle() {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }

    async function handleLogin(event) {
        event.preventDefault();
        setError("");

        const cleanedEmail = removeWhitespace(email);
        const cleanedPassword = removeWhitespace(password);

        if (!cleanedEmail || !cleanedPassword) {
            setError("Email and password are required.");
            return;
        }

        if (cleanedEmail !== email || cleanedPassword !== password) {
            setError("Email and password cannot contain spaces.");
            setEmail(cleanedEmail);
            setPassword(cleanedPassword);
            return;
        }

        if (loading) {
            return;
        }

        try {
            setLoading(true);
            const data = await loginUser({
                email: cleanedEmail,
                password: cleanedPassword,
            });

            saveToken(data.access_token, rememberMe);
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            setError(err.message || "Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            {/* Ambient Background Glow Orbs */}
            <div className="login-orb orb-1" aria-hidden="true" />
            <div className="login-orb orb-2" aria-hidden="true" />

            {/* Quick Theme Toggle in Top Right */}
            <button
                type="button"
                className="login-theme-toggle"
                onClick={handleThemeToggle}
                aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
                title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            >
                <span className="theme-toggle-icon">
                    {resolvedTheme === "dark" ? <FaSun /> : <FaMoon />}
                </span>
                <span className="theme-toggle-label">
                    {resolvedTheme === "dark" ? "Light" : "Dark"}
                </span>
            </button>

            {/* Split Screen Container */}
            <div className="login-split-wrapper">
                
                {/* Left Side: Brand & Honest Town Hall Graphics Showcase */}
                <div className="login-brand-panel">
                    <div className="brand-badge">
                        <FaShieldAlt className="brand-badge-icon" />
                        <span>100% Confidential Suggestion Box</span>
                    </div>

                    <div className="brand-hero">
                        <h2>The Honest Town Hall for Modern Teams</h2>
                        <p>
                            A safe, anonymous emotional thermometer. Employees share honest feedback without fear, giving leaders clarity to fix what’s broken.
                        </p>
                    </div>

                    {/* Graphic Feature & Metric Cards */}
                    <div className="brand-metric-cards">
                        <div className="metric-card">
                            <div className="metric-header">
                                <span className="metric-title">Team Morale Pulse</span>
                                <span className="metric-value">4.8 / 5.0</span>
                            </div>
                            <div className="metric-bar-track">
                                <div className="metric-bar-fill" style={{ width: "88%" }} />
                            </div>
                            <div className="metric-stars">
                                <span>★★★★★</span>
                                <span className="metric-sub">94% participation</span>
                            </div>
                        </div>

                        <div className="metric-card feature-card">
                            <div className="feature-icon-well">
                                <FaLock />
                            </div>
                            <div>
                                <div className="feature-title">Zero Fingerprint Guarantee</div>
                                <div className="feature-desc">
                                    Random ticket hashing ensures zero employee identity tracking on every response.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="brand-footer-note">
                        <FaCheckCircle className="check-icon" />
                        <span>Confidential feedback aggregation & live sentiment analytics</span>
                    </div>
                </div>

                {/* Right Side: Authentication Form Card */}
                <div className="login-card">
                    {/* Logo Emblem */}
                    <div className="logo">
                        <FaChartBar />
                    </div>

                    <h1>Survey Management System</h1>
                    <p className="subtitle">Employee Feedback Portal</p>

                    <form className="login-form" onSubmit={handleLogin} noValidate>
                        {/* Email */}
                        <Input
                            id="email"
                            name="email"
                            label="Email"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(event) =>
                                setEmail(removeWhitespace(event.target.value))
                            }
                            required={true}
                        />

                        {/* Password */}
                        <Input
                            id="password"
                            name="password"
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) =>
                                setPassword(removeWhitespace(event.target.value))
                            }
                            required={true}
                            showToggle={true}
                            showPassword={showPassword}
                            onToggle={() => setShowPassword(!showPassword)}
                        />

                        <label className="remember-me">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(event) =>
                                    setRememberMe(event.target.checked)
                                }
                            />
                            <span>Remember me</span>
                        </label>

                        {/* Error Message */}
                        {error && (
                            <div className="login-error-alert" role="alert">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            text={loading ? "Logging in..." : "Login"}
                            type="submit"
                            disabled={loading}
                        />

                        <p className="footer">
                            Version 1.0 • Pulse 360°
                        </p>
                    </form>
                </div>

            </div>
        </div>
    );
}

export default Login;
