import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";


function RatingChart({ distribution }) {

    const chartData = [1, 2, 3, 4, 5].map((rating) => ({
        rating: `${rating} star`,
        responses: distribution?.[rating] || 0,
    }));


    return (

        <div
            style={{
                width: "100%",
                height: "220px",
                marginTop: "16px",
            }}
        >

            <p
                style={{
                    marginBottom: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#475467",
                }}
            >
                Rating Distribution
            </p>


            <ResponsiveContainer
                width="100%"
                height="100%"
            >

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
                    />

                    <XAxis
                        dataKey="rating"
                        tickLine={false}
                        axisLine={false}
                    />

                    <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                    />

                    <Tooltip
                        formatter={(value) => [
                            `${value} response${value === 1 ? "" : "s"}`,
                            "Responses",
                        ]}
                    />

                    <Bar
                        dataKey="responses"
                        fill="#2563eb"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={70}
                    />

                </BarChart>

            </ResponsiveContainer>

        </div>

    );

}


export default RatingChart;
