import { Link, Navigate } from "react-router-dom";
import { getStoredToken } from "../services/api";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute({ children, permission, anyPermissions, surveyAccess = false }) {
    const { loading, error, user, can, canSurvey, refresh } = useAuth();
    if (!getStoredToken()) return <Navigate to="/login" replace />;
    if (loading) return <p role="status">Loading your access...</p>;
    if (error || !user) return <main><p role="alert">{error || "Unable to load your account."}</p><button onClick={refresh}>Retry</button></main>;
    if ((permission && !can(permission)) ||
        (anyPermissions && !anyPermissions.some(can)) ||
        (surveyAccess && !canSurvey)) {
        return <main style={{ padding: 32 }}><h1>Access unavailable</h1><p>Your role does not include permission to use this page.</p><Link to="/dashboard">Back to dashboard</Link></main>;
    }
    return children;
}
