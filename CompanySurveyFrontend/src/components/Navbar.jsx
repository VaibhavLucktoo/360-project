import "../styles/Navbar.css";
import { FaBell,FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";


/*Navbar Function*/
// Navbar receives the current user's name
function Navbar({ title = "Dashboard",  userName = "User" }) {

    const navigate = useNavigate();

    return(

        //Navbar Container
        <div className="navbar">
            <div>
                <h2>{title}</h2>

            </div>

            {/*Right Side*/}
            <div className="navbar-right">
                <button
                    type="button"
                    className="nav-icon-btn"
                    aria-label="View response notifications"
                    title="Responses"
                    onClick={() => navigate("/responses")}
                >
                    <FaBell className="nav-icon"/>
                </button>

                <button
                    type="button"
                    className="profile"
                    aria-label="Open profile settings"
                    title="Profile settings"
                    onClick={() => navigate("/settings")}
                >
                    <FaUserCircle className="profile-icon"/>
                    <span>{userName}</span>

                </button>
            </div>
        </div>

    );
}

export default Navbar;
