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
    getCurrentUser,
} from "../services/api";

import {
    FaHome,
    FaClipboardList,
    FaSignOutAlt,
} from "react-icons/fa";


function Sidebar() {

    const navigate = useNavigate();
    const location = useLocation();

    const [isAdmin, setIsAdmin] =
        useState(false);


    // Load role for admin-only navigation
    useEffect(() => {

        getCurrentUser()
            .then((user) => {

                setIsAdmin(
                    user?.role?.toLowerCase()
                    === "admin"
                );

            })
            .catch(() => {

                setIsAdmin(false);

            });

    }, []);


    // Check whether a navigation section is active
    function isActive(path) {

        if (path === "/dashboard") {

            return (
                location.pathname
                === "/dashboard"
            );

        }

        if (path === "/surveys") {

            return (
                location.pathname
                    .startsWith("/surveys")
            );

        }

        return false;

    }


    // Clear session and return to login
    function handleLogout() {

        localStorage.removeItem(
            "token"
        );

        navigate(
            "/login",
            {
                replace: true,
            }
        );

    }


    return (

        <aside className="sidebar">


            {/* Logo */}

            <div className="sidebar-brand">

                <h2 className="sidebar-logo">
                    SurveyMS
                </h2>

            </div>


            {/* Main navigation */}

            <nav className="sidebar-nav">

                <ul>


                    {/* Dashboard */}

                    <li>

                        <button
                            type="button"
                            className={
                                isActive("/dashboard")
                                    ? "sidebar-nav-item active"
                                    : "sidebar-nav-item"
                            }
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            <FaHome />

                            <span>
                                Dashboard
                            </span>

                        </button>

                    </li>


                    {/* Survey management */}

                    {isAdmin && (

                        <li>

                            <button
                                type="button"
                                className={
                                    isActive("/surveys")
                                        ? "sidebar-nav-item active"
                                        : "sidebar-nav-item"
                                }
                                onClick={() =>
                                    navigate(
                                        "/surveys"
                                    )
                                }
                            >
                                <FaClipboardList />

                                <span>
                                    Surveys
                                </span>

                            </button>

                        </li>

                    )}


                </ul>

            </nav>


            {/* Logout */}

            <div className="sidebar-footer">

                <button
                    type="button"
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    <FaSignOutAlt />

                    <span>
                        Logout
                    </span>

                </button>

            </div>


        </aside>

    );

}


export default Sidebar;