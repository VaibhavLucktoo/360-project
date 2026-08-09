import "../styles/Sidebar.css"
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/api";
/*React Icon */ 
import {
    FaHome,
    FaClipboardList,
    FaUsers,
    FaChartBar,
    FaCog,
    FaSignOutAlt
} from "react-icons/fa";

/*Sidebar Components*/ 

function Sidebar() {
    const navigate = useNavigate()
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Navigation is derived from the backend role, not from a client-side assumption.
        getCurrentUser().then((user) => setIsAdmin(user.role?.toLowerCase() === "admin")).catch(() => setIsAdmin(false));
    }, []);
    function handleLogout() {

    // Remove JWT Token
    localStorage.removeItem("token");

    // Go back to Login page
    navigate("/login");

}
    return(
        //Sidebar Container
        <div className="sidebar">
            <h2 className="sidebar-logo" >SurveyMS</h2>

            {/*Navigation Menu*/}
            <ul>
                <li onClick={() => navigate("/dashboard")}>
                    <FaHome/>
                    <span>Dashboard</span>
                </li>

                {isAdmin && <li onClick={() => navigate("/surveys")}><FaClipboardList/><span>Surveys</span></li>}

                {isAdmin && <li onClick={() => navigate("/responses")}><FaUsers/><span>Responses</span></li>}

                {isAdmin && <li onClick={() => navigate("/surveys")}><FaChartBar/><span>Reports</span></li>}

                <li>
                    <FaCog/>
                    <span>Settings</span>

                </li>
            </ul>
            {/*Logout*/}
            <button className="logout-btn" onClick={handleLogout}>
                <FaSignOutAlt/>
                Logout
            </button>
            
        </div>

    );
}

//Export Component
export default Sidebar;
