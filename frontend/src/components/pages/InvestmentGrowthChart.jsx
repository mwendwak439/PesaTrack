
import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

import './InvestmentGrowthChart.css';

const API_URL = 'http://localhost:8000/api';

function InvestmentGrowthChart({ investments }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function fetchHistory() {
            setLoading(true);
            setError('');

            try {
                const results = await Promise.all(
                    investments.map(async (investment) => {
                        const response = await fetch(
                            `${API_URL}/investments/${investment.id}/history/`,
                            {
                                credentials: 'include',
                            }
                        );

                        if (!response.ok) {
                            throw new Error(
                                `Could not load history for ${investment.name}.`
                            );
                        }

                        const data = await response.json();

                        return {
                            id: investment.id,
                            name: investment.name,
                            history: data.history || [],
                        };
                    })
                );

                if (cancelled) return;

                // Combine recorded investment values by date.
                const dateMap = new Map();

                results.forEach((investment) => {
                    investment.history.forEach((point) => {
                        if (!dateMap.has(point.date)) {
                            dateMap.set(point.date, {
                                date: point.date,
                            });
                        }

                        dateMap.get(point.date)[
                            `investment_${investment.id}`
                        ] = Number(point.value);
                    });
                });

let chartData = Array.from(dateMap.values()).sort(
    (a, b) => a.date.localeCompare(b.date)
);

// If there is no history yet, use the current investment values.
if (chartData.length === 0 && investments.length > 0) {
    chartData = [
        {
            date: new Date().toISOString().slice(0, 10),
            ...Object.fromEntries(
                investments.map((investment) => [
                    `investment_${investment.id}`,
                    Number(investment.current_value),
                ])
            ),
        },
    ];
}

setHistory(chartData);

            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        if (investments.length > 0) {
            fetchHistory();
        } else {
            setHistory([]);
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [investments]);

    if (loading) {
        return <p>Loading investment growth chart...</p>;
    }

    if (error) {
        return (
            <div className="growth-chart-card">
                <h3>Investment Growth</h3>
                <p className="chart-message">{error}</p>
            </div>
        );
    }

    if (investments.length === 0 || history.length === 0) {
        return (
            <div className="growth-chart-card">
                <h3>Investment Growth</h3>
                <p>
                    No investment history is available yet.
                    Your recorded investment values will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="growth-chart-card">
            <h3>Investment Growth</h3>

            <p>
                Track recorded changes in your investment values over time.
            </p>

            <div className="growth-chart">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={history}
                        margin={{
                            top: 15,
                            right: 20,
                            left: 10,
                            bottom: 10,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                        />
<YAxis
    width={100}
    domain={[
        0,
        (dataMax) => Math.ceil(dataMax * 1.2 / 100) * 100,
    ]}
    tickFormatter={(value) =>
        `KES ${Number(value).toLocaleString()}`
    }
/>

                        <Tooltip
                            formatter={(value) => [
                                `KES ${Number(value).toLocaleString()}`,
                                'Investment Value',
                            ]}
                            labelFormatter={(label) => `Date: ${label}`}
                        />

                        {investments.map((investment) => (
                            <Line
                                key={investment.id}
                                type="monotone"
                                dataKey={`investment_${investment.id}`}
                                name={investment.name}
                                connectNulls
                                strokeWidth={2}
                                dot={{ r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default InvestmentGrowthChart;
