// ===========================================
// Import CSS
// ===========================================
import "../styles/StatCard.css";

// ===========================================
// Reusable Stat Card
// ===========================================
function StatCard(props) {

    return (

        <div className="stat-card">

            {/* Top Section */}
            <div className="card-header">

                {/* Card Icon */}
                <div className="card-icon">
                    {props.icon}
                </div>

                {/* Card Title */}
                <h3>{props.title}</h3>

            </div>

            {/* Card Value */}
            <h1>{props.value}</h1>

            {/* Card Subtitle */}
            <p>{props.subtitle}</p>

        </div>

    );

}

export default StatCard;