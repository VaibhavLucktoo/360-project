// ===========================================
// React Router
// ===========================================
import { Routes, Route, Navigate } from "react-router-dom";

// ===========================================
// Components
// ===========================================
import ProtectedRoute from "./components/ProtectedRoute";

// ===========================================
// Pages
// ===========================================
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateSurvey from "./pages/CreateSurvey";
import SurveyDetails from "./pages/SurveyDetails";
import SurveyQuestions from "./pages/SurveyQuestions";
import SurveyPreview from "./pages/SurveyPreview";
import TakeSurvey from "./pages/TakeSurvey";
import SurveyList from "./pages/SurveyList";
import Responses from "./pages/Responses";
import Analytics from "./pages/Analytics";

// ===========================================
// Main Application
// ===========================================
function App() {

    const token = localStorage.getItem("token");

    return (

        <Routes>

            {/* ===========================================
                Root Redirect
            =========================================== */}

            <Route
                path="/"
                element={
                    token
                        ? <Navigate to="/dashboard" replace />
                        : <Navigate to="/login" replace />
                }
            />

            {/* ===========================================
                Public Route
            =========================================== */}

            <Route
                path="/login"
                element={<Login />}
            />

            {/* ===========================================
                Dashboard
            =========================================== */}

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route path="/surveys" element={<ProtectedRoute><SurveyList /></ProtectedRoute>} />
            <Route path="/responses" element={<ProtectedRoute><Responses /></ProtectedRoute>} />
            <Route path="/surveys/:id/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

            {/* ===========================================
                Create Survey
            =========================================== */}

            <Route
                path="/surveys/create"
                element={
                    <ProtectedRoute>
                        <CreateSurvey />
                    </ProtectedRoute>
                }
            />

            {/* ===========================================
                Survey Details
            =========================================== */}

            <Route
                path="/surveys/:id"
                element={
                    <ProtectedRoute>
                        <SurveyDetails />
                    </ProtectedRoute>
                }
            />

            {/* ===========================================
                Survey Questions
            =========================================== */}

            <Route
                path="/surveys/:id/questions"
                element={
                    <ProtectedRoute>
                        <SurveyDetails />
                        <SurveyQuestions />
                    </ProtectedRoute>
                }
            />

            {/* ===========================================
                Survey Preview
            =========================================== */}

            <Route
                path="/surveys/:id/preview"
                element={
                    <ProtectedRoute>
                        <SurveyPreview />
                    </ProtectedRoute>
                }
            />

            {/* ===========================================
                Take Survey
            =========================================== */}

            <Route
                path="/surveys/:id/take"
                element={
                    <ProtectedRoute>
                        <TakeSurvey />
                    </ProtectedRoute>
                }
            />

            {/* ===========================================
                Unknown Route
            =========================================== */}

            <Route
                path="*"
                element={
                    <Navigate
                        to={token ? "/dashboard" : "/login"}
                        replace
                    />
                }
            />

        </Routes>

    );

}

export default App;
