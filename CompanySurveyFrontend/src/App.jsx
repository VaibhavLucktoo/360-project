// ===========================================
// React Router
// ===========================================
import { Routes, Route, Navigate, useParams } from "react-router-dom";

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
import SurveyPreview from "./pages/SurveyPreview";
import TakeSurvey from "./pages/TakeSurvey";
import Analytics from "./pages/Analytics";
import SurveyList from "./pages/SurveyList";
import Responses from "./pages/Responses";
import QuestionAnalytics from "./pages/QuestionAnalytics";
import SurveyBuilder from "./pages/SurveyBuilder";
// ===========================================
// Main Application
// ===========================================

// Redirect old question-management links to the builder
function LegacySurveyQuestionsRedirect() {
    const { id } = useParams();

    return (
        <Navigate
            to={`/surveys/${id}/builder`}
            replace
        />
    );
}

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


            {/* View survey details */}
            <Route
                path="/surveys/:id"
                element={
                    <ProtectedRoute>
                        <SurveyDetails />
                    </ProtectedRoute>
                }
            />

            {/* ===========================================
                    Survey Builder
                =========================================== */}

                    <Route
                        path="/surveys/:id/builder"
                        element={
                            <ProtectedRoute>
                                <SurveyBuilder />
                            </ProtectedRoute>
                        }
                    />  


            <Route
                path="/surveys/:id/questions"
                element={
                    <ProtectedRoute>
                        <LegacySurveyQuestionsRedirect />
                    </ProtectedRoute>
                }
            />            
            {/* ===========================================
                Survey List
            =========================================== */}

            <Route
                path="/surveys"
                element={
                    <ProtectedRoute>
                        <SurveyList />
                    </ProtectedRoute>
                }
            />

            {/*Question Analytics*/}
            <Route
                path="/surveys/:surveyId/questions/:questionId/analytics"
                element={
                    <ProtectedRoute>
                        <QuestionAnalytics />
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
                    
                        <TakeSurvey />
                }
            />

            {/* ===========================================
                Survey Responses
            =========================================== */}

            <Route
                path="/surveys/:id/responses"
                element={
                    <ProtectedRoute>
                        <Responses />
                    </ProtectedRoute>
                }
            />

            {/* ===========================================
                Survey Analytics
            =========================================== */}

            <Route
                path="/surveys/:id/analytics"
                element={
                    <ProtectedRoute>
                        <Analytics />
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