import { useAuth } from "../context/useAuth";
import "../styles/Sidebar.css";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    useEffect,
    useState,
} from "react";

import {
    clearStoredToken,
} from "../services/api";

import {
    FaHome,
    FaUsers,
    FaUserShield,
    FaClipboardList,
    FaInbox,
    FaChartBar,
    FaCog,
    FaSignOutAlt,
    FaBars,
} from "react-icons/fa";


function Sidebar() {

    const navigate = useNavigate();
    const location = useLocation();


    /* ===========================================
       State
    =========================================== */

    const { can, canSurvey } = useAuth();


    // Remember desktop collapsed state.
    const [isCollapsed, setIsCollapsed] =
        useState(() => {

            return (
                localStorage.getItem(
                    "sidebarCollapsed"
                ) === "true"
            );

        });


    // Mobile drawer state.
    const [isMobileOpen, setIsMobileOpen] =
        useState(false);


    /* ===========================================
       Load User Role
    =========================================== */




    /* ===========================================
       Sync Sidebar Width With Entire App
    =========================================== */

    useEffect(() => {

        function updateSidebarWidth() {

            const isMobile =
                window.innerWidth <= 640;


            // Mobile sidebar overlays content.
            if (isMobile) {

                document.documentElement
                    .style
                    .setProperty(
                        "--sidebar-width",
                        "0px"
                    );

                return;

            }


            // Desktop expanded / collapsed width.
            document.documentElement
                .style
                .setProperty(
                    "--sidebar-width",
                    isCollapsed
                        ? "72px"
                        : "250px"
                );

        }


        updateSidebarWidth();


        window.addEventListener(
            "resize",
            updateSidebarWidth
        );


        return () => {

            window.removeEventListener(
                "resize",
                updateSidebarWidth
            );

        };

    }, [isCollapsed]);


    /* ===========================================
       Save Collapsed State
    =========================================== */

    useEffect(() => {

        localStorage.setItem(
            "sidebarCollapsed",
            String(isCollapsed)
        );

    }, [isCollapsed]);


    /* ===========================================
       Active Navigation
    =========================================== */

    function isActive(path) {

        // Dashboard
        if (path === "/dashboard") {

            return (
                location.pathname ===
                "/dashboard"
            );

        }


        // Responses
        if (path === "/responses") {

            return (
                location.pathname ===
                    "/responses"

                ||

                /^\/surveys\/\d+\/responses$/
                    .test(
                        location.pathname
                    )
            );

        }


        // Analytics
        if (path === "/analytics") {

            return (
                location.pathname ===
                    "/analytics"

                ||

                /^\/surveys\/\d+\/analytics$/
                    .test(
                        location.pathname
                    )
            );

        }


        // Surveys
        if (path === "/surveys") {

            const isResponsePage =
                /^\/surveys\/\d+\/responses$/
                    .test(
                        location.pathname
                    );


            const isAnalyticsPage =
                /^\/surveys\/\d+\/analytics$/
                    .test(
                        location.pathname
                    );


            return (
                location.pathname
                    .startsWith("/surveys")

                &&

                !isResponsePage

                &&

                !isAnalyticsPage
            );

        }

        if (path === "/settings") {

            return (
                location.pathname ===
                "/settings"
            );

        }


        return false;

    }


    /* ===========================================
       Navigate
    =========================================== */

    function handleNavigate(path) {

        navigate(path);


        // Close drawer after navigation on mobile.
        setIsMobileOpen(false);

    }


    /* ===========================================
       Desktop Sidebar Toggle
    =========================================== */

    function toggleSidebar() {

        setIsCollapsed(
            (current) => !current
        );

    }


    /* ===========================================
       Logout
    =========================================== */

    function handleLogout() {

        clearStoredToken();


        navigate(
            "/login",
            {
                replace: true,
            }
        );

    }


    /* ===========================================
       UI
    =========================================== */

    return (

        <>


            {/* ===========================================
                Mobile Hamburger
            =========================================== */}

            <button
                type="button"
                className="sidebar-mobile-trigger"
                aria-label="Open navigation"
                onClick={() =>
                    setIsMobileOpen(true)
                }
            >
                <FaBars />
            </button>


            {/* ===========================================
                Mobile Backdrop
            =========================================== */}

            {isMobileOpen && (

                <button
                    type="button"
                    className="sidebar-backdrop"
                    aria-label="Close navigation"
                    onClick={() =>
                        setIsMobileOpen(false)
                    }
                />

            )}


            {/* ===========================================
                Sidebar
            =========================================== */}

            <aside
                className={[
                    "sidebar",

                    isCollapsed
                        ? "sidebar-collapsed"
                        : "",

                    isMobileOpen
                        ? "sidebar-mobile-open"
                        : "",
                ]
                    .filter(Boolean)
                    .join(" ")
                }
            >


                {/* ===========================================
                    Header / Brand
                =========================================== */}

                <div className="sidebar-header">


                    <div className="sidebar-brand">

                        <h2 className="sidebar-logo">
                            SurveyMS
                        </h2>

                    </div>


                    <button
                        type="button"
                        className="sidebar-toggle-btn"
                        aria-label={
                            isCollapsed
                                ? "Expand sidebar"
                                : "Collapse sidebar"
                        }
                        title={
                            isCollapsed
                                ? "Expand sidebar"
                                : "Collapse sidebar"
                        }
                        onClick={
                            toggleSidebar
                        }
                    >

                        <FaBars />

                    </button>


                </div>


                {/* ===========================================
                    Navigation
                =========================================== */}

                <nav className="sidebar-nav">

                    <ul>


                        {/* Dashboard */}

                        <li>

                            <button
                                type="button"
                                title={
                                    isCollapsed
                                        ? "Dashboard"
                                        : undefined
                                }
                                className={
                                    isActive(
                                        "/dashboard"
                                    )
                                        ? "sidebar-nav-item active"
                                        : "sidebar-nav-item"
                                }
                                onClick={() =>
                                    handleNavigate(
                                        "/dashboard"
                                    )
                                }
                            >

                                <span className="sidebar-nav-icon">
                                    <FaHome />
                                </span>

                                <span className="sidebar-nav-label">
                                    Dashboard
                                </span>

                            </button>

                        </li>


                        {/* Surveys */}

                        {canSurvey && (

                            <li>

                                <button
                                    type="button"
                                    title={
                                        isCollapsed
                                            ? "Surveys"
                                            : undefined
                                    }
                                    className={
                                        isActive(
                                            "/surveys"
                                        )
                                            ? "sidebar-nav-item active"
                                            : "sidebar-nav-item"
                                    }
                                    onClick={() =>
                                        handleNavigate(
                                            "/surveys"
                                        )
                                    }
                                >

                                    <span className="sidebar-nav-icon">
                                        <FaClipboardList />
                                    </span>

                                    <span className="sidebar-nav-label">
                                        Surveys
                                    </span>

                                </button>

                            </li>

                        )}


                        {/* Responses */}

                        {can("response.view") && (

                            <li>

                                <button
                                    type="button"
                                    title={
                                        isCollapsed
                                            ? "Responses"
                                            : undefined
                                    }
                                    className={
                                        isActive(
                                            "/responses"
                                        )
                                            ? "sidebar-nav-item active"
                                            : "sidebar-nav-item"
                                    }
                                    onClick={() =>
                                        handleNavigate(
                                            "/responses"
                                        )
                                    }
                                >

                                    <span className="sidebar-nav-icon">
                                        <FaInbox />
                                    </span>

                                    <span className="sidebar-nav-label">
                                        Responses
                                    </span>

                                </button>

                            </li>

                        )}


                        {/* Analytics */}

                        {can("analytics.view") && (

                            <li>

                                <button
                                    type="button"
                                    title={
                                        isCollapsed
                                            ? "Analytics"
                                            : undefined
                                    }
                                    className={
                                        isActive(
                                            "/analytics"
                                        )
                                            ? "sidebar-nav-item active"
                                            : "sidebar-nav-item"
                                    }
                                    onClick={() =>
                                        handleNavigate(
                                            "/analytics"
                                        )
                                    }
                                >

                                    <span className="sidebar-nav-icon">
                                        <FaChartBar />
                                    </span>

                                    <span className="sidebar-nav-label">
                                        Analytics
                                    </span>

                                </button>

                            </li>

                        )}


                        {can("role.manage") && (
                            <li><button type="button" title={isCollapsed ? "Roles" : undefined}
                                className={isActive("/roles") ? "sidebar-nav-item active" : "sidebar-nav-item"}
                                onClick={() => handleNavigate("/roles")}>
                                <span className="sidebar-nav-icon"><FaUserShield /></span>
                                <span className="sidebar-nav-label">Roles</span>
                            </button></li>
                        )}
                        {can("user.manage") && (
                            <li><button type="button" title={isCollapsed ? "Users" : undefined}
                                className={isActive("/users") ? "sidebar-nav-item active" : "sidebar-nav-item"}
                                onClick={() => handleNavigate("/users")}>
                                <span className="sidebar-nav-icon"><FaUsers /></span>
                                <span className="sidebar-nav-label">Users</span>
                            </button></li>
                        )}
                        {/* Settings */}

                        <li>

                            <button
                                type="button"
                                title={
                                    isCollapsed
                                        ? "Settings"
                                        : undefined
                                }
                                className={
                                    isActive(
                                        "/settings"
                                    )
                                        ? "sidebar-nav-item active"
                                        : "sidebar-nav-item"
                                }
                                onClick={() =>
                                    handleNavigate(
                                        "/settings"
                                    )
                                }
                            >

                                <span className="sidebar-nav-icon">
                                    <FaCog />
                                </span>

                                <span className="sidebar-nav-label">
                                    Settings
                                </span>

                            </button>

                        </li>


                    </ul>

                </nav>


                {/* ===========================================
                    Footer
                =========================================== */}

                <div className="sidebar-footer">

                    <button
                        type="button"
                        className="logout-btn"
                        title={
                            isCollapsed
                                ? "Logout"
                                : undefined
                        }
                        onClick={
                            handleLogout
                        }
                    >

                        <span className="sidebar-nav-icon">
                            <FaSignOutAlt />
                        </span>

                        <span className="sidebar-nav-label">
                            Logout
                        </span>

                    </button>

                </div>


            </aside>


        </>

    );

}


export default Sidebar;
