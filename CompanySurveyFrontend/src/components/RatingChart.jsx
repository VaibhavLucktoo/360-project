import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useTheme } from "../context/useTheme";

function RatingChart({ distribution }) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const chartData = [1, 2, 3, 4, 5].map((rating) => ({
        rating: `${rating} ★`,
        responses: distribution?.[rating] || 0,
    }));

    const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0";
    const tickColor = isDark ? "#94a3b8" : "#64748b";
    const barColor = isDark ? "#818cf8" : "#4f46e5";
    const tooltipBg = isDark ? "#1e293b" : "#ffffff";
    const tooltipBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "#cbd5e1";
    const tooltipColor = isDark ? "#f8fafc" : "#0f172a";

    return (
        <div style={{ width: "100%", height: "230px", marginTop: "16px" }}>
            <p
                style={{
                    marginBottom: "12px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                }}
            >
                Rating Distribution
            </p>

            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -10,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={gridColor}
                    />

                    <XAxis
                        dataKey="rating"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: tickColor, fontSize: 13, fontWeight: 500 }}
                    />

                    <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: tickColor, fontSize: 12 }}
                    />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: tooltipBg,
                            borderColor: tooltipBorder,
                            borderRadius: "10px",
                            color: tooltipColor,
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                            fontSize: "13px",
                            fontWeight: 600,
                        }}
                        itemStyle={{ color: tooltipColor }}
                        formatter={(value) => [
                            `${value} response${value === 1 ? "" : "s"}`,
                            "Total",
                        ]}
                    />

                    <Bar
                        dataKey="responses"
                        fill={barColor}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={56}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default RatingChart;
