import { removeWhitespace } from "../utils/inputWhitespace";
// ===========================================
// Icons
// ===========================================
import { FaChartBar } from "react-icons/fa";

// ===========================================
// React
// ===========================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ===========================================
// Components
// ===========================================
import Input from "../components/Input";
import Button from "../components/Button";

// ===========================================
// Styles
// ===========================================
import "../styles/Login.css";

// ===========================================
// API
// ===========================================
import { loginUser, saveToken } from "../services/api";





// ===========================================
// Login Component
// ===========================================
function Login() {

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Error Message
    const [error, setError] = useState("");

    const [rememberMe, setRememberMe] = useState(false);

    const [loading, setLoading] = useState(false);

    // Password Visibility
    const [showPassword, setShowPassword] = useState(false);

    // React Router Navigation
    const navigate = useNavigate();


    // ===========================================
    // Login Function
    // ===========================================
    async function handleLogin(event) {

        // Prevent page refresh
        event.preventDefault();

        // Clear previous error
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

            // Send Login Request
            const data = await loginUser({

                email: cleanedEmail,

                password: cleanedPassword

            });

            // Read Response
            saveToken(data.access_token, rememberMe);
            navigate("/dashboard");

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Unable to connect to the server."
            );

        } finally {

            setLoading(false);
        }

    }

    // ===========================================
    // UI
    // ===========================================

    return (

        <div className="login-container">

            <div className="login-card">

                {/* Logo */}
                <div className="logo">
                    <FaChartBar />
                </div>

                {/* Heading */}
                <h1>Survey Management System</h1>

                <p className="subtitle">
                    Employee Feedback Portal
                </p>

                {/* Login Form */}
                <form
                    className="login-form"
                    onSubmit={handleLogin}
                    noValidate
                >

                    {/* Email */}
                    <Input
                        id="email"
                        name="email"
                        label="Email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(event) =>
                            setEmail(
                                removeWhitespace(
                                    event.target.value
                                )
                            )
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
                            setPassword(
                                removeWhitespace(
                                    event.target.value
                                )
                            )
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
                                setRememberMe(
                                    event.target.checked
                                )
                            }
                        />

                        <span>
                            Remember me
                        </span>
                    </label>

                    {/* Error Message */}
                    {error && (

                        <p
                            style={{
                                color: "red",
                                marginBottom: "15px",
                                fontSize: "14px"
                            }}
                        >
                            {error}
                        </p>

                    )}

                    {/* Login Button */}
                    <Button
                        text={
                            loading
                                ? "Logging in..."
                                : "Login"
                        }
                        type="submit"
                        disabled={loading}
                    />

                    {/* Footer */}
                    <p className="footer">
                        Version 1.0
                    </p>

                </form>

            </div>

        </div>

    );

}

export default Login;
