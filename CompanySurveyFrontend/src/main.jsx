// ===========================================
// React Imports
// ===========================================
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// ===========================================
// React Router
// ===========================================
import { BrowserRouter } from "react-router-dom";

// ===========================================
// Global Styles
// ===========================================
import "./index.css";

// ===========================================
// Main App Component
// ===========================================
import App from "./App";
import { AuthProvider } from "./context/AuthProvider";
import { SurveyProvider } from "./context/SurveyContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles/LightTheme.css";
import "./styles/DarkTheme.css";
// ===========================================
// Render React Application
// ===========================================
createRoot(document.getElementById("root")).render(

    <StrictMode>

        {/* BrowserRouter enables routing throughout the application */}
        <BrowserRouter>

            <ThemeProvider>

                <SurveyProvider>
                     <AuthProvider><App /></AuthProvider>
                </SurveyProvider>

            </ThemeProvider>

        </BrowserRouter>

    </StrictMode>

);
