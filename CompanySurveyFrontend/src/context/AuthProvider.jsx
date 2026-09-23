import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCurrentUser, getStoredToken } from "../services/api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
    const { pathname } = useLocation();
    const token = getStoredToken();
    const [session, setSession] = useState({ user: null, token: null, loading: true, error: "" });
    const requestVersion = useRef(0);
    const refresh = useCallback(async () => {
        const version = ++requestVersion.current;
        const currentToken = getStoredToken();
        if (!currentToken) {
            setSession({ user: null, token: null, loading: false, error: "" });
            return;
        }
        try {
            const user = await getCurrentUser();
            if (version === requestVersion.current && currentToken === getStoredToken()) {
                setSession({ user, token: currentToken, loading: false, error: "" });
                return user;
            }
        } catch (error) {
            if (version === requestVersion.current && currentToken === getStoredToken()) {
                setSession({ user: null, token: currentToken, loading: false, error: error.message });
            }
        }
    }, []);

    useEffect(() => {
        if (pathname === "/login" || pathname.endsWith("/take")) return;
        const onFocus = () => refresh();
        const initial = window.setTimeout(onFocus, 0);
        window.addEventListener("focus", onFocus);
        window.addEventListener("permissions-changed", onFocus);
        const timer = window.setInterval(onFocus, 60000);
        return () => {
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("permissions-changed", onFocus);
            window.clearInterval(timer);
            window.clearTimeout(initial);
        };
    }, [pathname, token, refresh]);

    const user = token && session.token === token ? session.user : null;
    const loading = Boolean(token) && (session.loading || session.token !== token);
    const can = (permission) => Boolean(user?.permissions?.includes(permission));
    const canSurvey = Boolean(user?.permissions?.some((key) => key.startsWith("survey.") || key.startsWith("response.") || key === "analytics.view"));
    return <AuthContext.Provider value={{ user, loading, error: session.error, can, canSurvey, refresh }}>
        {children}
    </AuthContext.Provider>;
}
