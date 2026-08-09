import { Navigate } from "react-router-dom";

function ProtectedRoute({children}){
    // Get JWT Token from localStorage
    const token = localStorage.getItem("token");

    //If token doesn't exist, redirect to login
    if (!token){
        return <Navigate to="/login" replace />;

    }
    //Otherwise, Show the protected page
    return children;
}
export default ProtectedRoute;
