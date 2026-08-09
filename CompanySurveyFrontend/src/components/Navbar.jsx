import "../styles/Navbar.css";
import { FaBell,FaUserCircle } from "react-icons/fa";


/*Navbar Function*/

function Navbar(){
    return(

        //Navbar Container
        <div className="navbar">
            <div>
                <h2>Dashboard</h2>

            </div>

            {/*Right Side*/}
            <div className="navbar-right">
                <FaBell className="nav-icon"/>
                <div className="profile">
                    <FaUserCircle className="profile-icon"/>
                    <span>Vaibhav</span>

                </div>
            </div>
        </div>

    );
}

export default Navbar;