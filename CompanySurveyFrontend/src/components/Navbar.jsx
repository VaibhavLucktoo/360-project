import "../styles/Navbar.css";
import { FaBell,FaUserCircle } from "react-icons/fa";


/*Navbar Function*/
// Navbar receives the current user's name
function Navbar({ title = "Dashboard",  userName = "User" }) {
    return(

        //Navbar Container
        <div className="navbar">
            <div>
                <h2>{title}</h2>

            </div>

            {/*Right Side*/}
            <div className="navbar-right">
                <FaBell className="nav-icon"/>
                <div className="profile">
                    <FaUserCircle className="profile-icon"/>
                    <span>{userName}</span>

                </div>
            </div>
        </div>

    );
}

export default Navbar;