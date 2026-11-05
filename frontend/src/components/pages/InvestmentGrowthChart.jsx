
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
                const response = await fetch(
                    `${API_URL}/portfolio/history/`,
                    {
                        credentials: 'include',
                    }
                );

                if (!response.ok) {
                    throw new Error('Could not load portfolio history.');
                }

                const data = await response.json();

                if (cancelled) return;

                // Convert timestamps and values into chart-friendly numbers.
                const formattedHistory = data
                    .map((point) => ({
                        date: new Date(point.date).getTime(),
                        value: Number(point.value),
                    }))
                    .sort((a, b) => a.date - b.date);

                setHistory(formattedHistory);

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

        fetchHistory();

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

    if (history.length === 0) {
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

            <h3>Total Investment Growth</h3>

            <p>
                Track the combined value of all your investments over time.
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
                            type="number"
                            scale="time"
                            domain={['dataMin', 'dataMax']}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(timestamp) =>
                                new Date(timestamp).toLocaleDateString(
                                    'en-GB',
                                    {
                                        day: '2-digit',
                                        month: 'short',
                                    }
                                )
                            }
                        />

                        <YAxis
                            width={100}
                            domain={['auto', 'auto']}
                            tickFormatter={(value) =>
                                `KES ${Number(value).toLocaleString('en-KE')}`
                            }
                        />

                        <Tooltip
                            formatter={(value) => [
                                `KES ${Number(value).toLocaleString(
                                    'en-KE',
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}`,
                                'Total Investment Value',
                            ]}
                            labelFormatter={(timestamp) =>
                                `Date: ${new Date(timestamp).toLocaleString(
                                    'en-GB'
                                )}`
                            }
                        />

                        <Line
                            type="linear"
                            dataKey="value"
                            name="Total Investment Value"
                            stroke="#16a34a"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            activeDot={{ r: 8 }}
                        />

                    </LineChart>

                </ResponsiveContainer>

            </div>
        </div>
    );
}

export default InvestmentGrowthChart;
