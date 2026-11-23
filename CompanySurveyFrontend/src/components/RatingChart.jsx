import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

const RATING_COLORS = [
    "#ef4444", // 1 Star: Displeased (Rose)
    "#f97316", // 2 Stars: Needs Improvement (Orange)
    "#f59e0b", // 3 Stars: Neutral (Amber)
    "#6366f1", // 4 Stars: Satisfied (Indigo)
    "#10b981", // 5 Stars: Exceptional (Emerald)
];

const RATING_EMOJIS = ["😡", "🙁", "😐", "🙂", "🤩"];

function RatingChart({ distribution }) {
    const chartData = [1, 2, 3, 4, 5].map((rating, idx) => ({
        rating: `${rating} ★`,
        emoji: RATING_EMOJIS[idx],
        label: `${rating} Star`,
        responses: distribution?.[rating] || 0,
        color: RATING_COLORS[idx],
    }));

    const total = chartData.reduce((sum, item) => sum + item.responses, 0);

    return (
        <div className="rating-chart-wrapper">
            <div className="chart-header-row">
                <span className="chart-title">5-Point Sentiment Distribution</span>
                <span className="chart-total-pill">{total} Total Ratings</span>
            </div>

            <div style={{ width: "100%", height: "230px" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(148, 163, 184, 0.25)"
                        />
                        <XAxis
                            dataKey="rating"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#64748b", fontSize: 13, fontWeight: 700 }}
                        />
                        <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                        />
                        <Tooltip
                            cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    const pct =
                                        total > 0
                                            ? Math.round(
                                                  (d.responses / total) * 100
                                              )
                                            : 0;
                                    return (
                                        <div className="chart-custom-tooltip">
                                            <div className="tooltip-title">
                                                <span>{d.emoji}</span>
                                                <strong>{d.label}</strong>
                                            </div>
                                            <div className="tooltip-value">
                                                <span className="tooltip-count">
                                                    {d.responses} responses
                                                </span>
                                                <span className="tooltip-pct">
                                                    ({pct}%)
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="responses"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={60}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default RatingChart;
