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
import { SurveyProvider } from "./context/SurveyContext";
// ===========================================
// Render React Application
// ===========================================
createRoot(document.getElementById("root")).render(

    <StrictMode>

        {/* BrowserRouter enables routing throughout the application */}
        <BrowserRouter>

            <SurveyProvider>
                 <App />
            </SurveyProvider>

        </BrowserRouter>

    </StrictMode>

);