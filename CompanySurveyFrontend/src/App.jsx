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
import AccessManagement from "./pages/AccessManagement";
import Roles from "./pages/Roles";
import Users from "./pages/Users";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateSurvey from "./pages/CreateSurvey";
import SurveyDetails from "./pages/SurveyDetails";
import SurveyPreview from "./pages/SurveyPreview";
import TakeSurvey from "./pages/TakeSurvey";
import Analytics from "./pages/Analytics";
import SurveyList from "./pages/SurveyList";
import Responses from "./pages/Responses";
import SurveyBuilder from "./pages/SurveyBuilder";
import Settings from "./pages/Settings";
import QuestionAnalytics from "./pages/QuestionAnalytics";
import { getStoredToken } from "./services/api";
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

    const token = getStoredToken();

    return (

        <Routes>
            <Route path="/roles" element={<ProtectedRoute permission="role.manage"><Roles /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute permission="user.manage"><Users /></ProtectedRoute>} />
            <Route path="/access" element={
                <ProtectedRoute anyPermissions={["role.manage", "user.manage"]}>
                    <AccessManagement />
                </ProtectedRoute>
            } />

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
                Settings
            =========================================== */}

            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                }
            />

            {/* ===========================================
                Create Survey
            =========================================== */}

            <Route
                path="/surveys/create"
                element={
                    <ProtectedRoute permission="survey.create">
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
                            <ProtectedRoute permission="survey.edit">
                                <SurveyBuilder />
                            </ProtectedRoute>
                        }
                    />  


            <Route
                path="/surveys/:id/questions"
                element={
                    <ProtectedRoute permission="survey.edit">
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
                    <ProtectedRoute surveyAccess>
                        <SurveyList />
                    </ProtectedRoute>
                }
            />

            {/* ===========================================
                Survey Preview
            =========================================== */}

            <Route
                path="/surveys/:id/preview"
                element={
                    <ProtectedRoute surveyAccess>
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
    Responses
=========================================== */}

{/* Main responses page */}
<Route
    path="/responses"
    element={
        <ProtectedRoute permission="response.view">
            <Responses />
        </ProtectedRoute>
    }
/>


{/* Responses for one survey */}
<Route
    path="/surveys/:id/responses"
    element={
        <ProtectedRoute permission="response.view">
            <Responses />
        </ProtectedRoute>
    }

/>

{/* ===========================================
    Analytics Landing Page
=========================================== */}

<Route
    path="/analytics"
    element={
        <ProtectedRoute permission="analytics.view">
            <Analytics />
        </ProtectedRoute>
    }
/>

            {/* ===========================================
                Survey Analytics
            =========================================== */}

            <Route
                path="/surveys/:id/analytics"
                element={
                    <ProtectedRoute permission="analytics.view">
                        <Analytics />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/questions/:id/analytics"
                element={
                    <ProtectedRoute permission="analytics.view">
                        <QuestionAnalytics />
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
