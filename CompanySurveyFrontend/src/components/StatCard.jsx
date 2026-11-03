import "../styles/StatCard.css";

/* Reusable Stat Card */
function StatCard({ icon, title, value, subtitle = "Active company metrics", iconClass = "" }) {
    return (
        <div className="stat-card">
            {/* Top Section */}
            <div className="card-header">
                <div className={`card-icon ${iconClass}`}>
                    {icon}
                </div>
                <h3>{title}</h3>
            </div>

            {/* Card Value */}
            <h1>{value}</h1>

            {/* Card Subtitle */}
            <p>{subtitle}</p>
        </div>
    );
}

export default StatCard;
