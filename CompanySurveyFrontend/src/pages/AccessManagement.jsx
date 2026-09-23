import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

// Preserve bookmarks to the former combined screen.
export default function AccessManagement() {
    const { can } = useAuth();
    return <Navigate to={can("role.manage") ? "/roles" : "/users"} replace />;
}
