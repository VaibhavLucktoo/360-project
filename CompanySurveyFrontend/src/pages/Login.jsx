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
import { loginUser } from "../services/api";



// ===========================================
// Login Component
// ===========================================
function Login() {

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Error Message
    const [error, setError] = useState("");

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

        try {

            // Send Login Request
            const data = await loginUser({

                email: email,

                password: password

            });

            // Read Response
            localStorage.setItem("token", data.access_token);
            navigate("/dashboard");

        }

        catch (error) {

            console.error(error);

            setError("Unable to connect to the server.");

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
                        onChange={(event) => setEmail(event.target.value)}
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
                        onChange={(event) => setPassword(event.target.value)}
                        required={true}
                        showToggle={true}
                        showPassword={showPassword}
                        onToggle={() => setShowPassword(!showPassword)}
                    />

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

                    {/* Remember Me */}
                    <div className="login-options">

                        <label className="remember-me">

                            <input type="checkbox" />

                            Remember Me

                        </label>

                        <a href="#">
                            Forgot Password?
                        </a>

                    </div>

                    {/* Login Button */}
                    <Button
                        text="Login"
                        type="submit"
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
