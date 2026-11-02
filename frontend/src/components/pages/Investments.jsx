
import InvestmentGrowthChart from './InvestmentGrowthChart';
import './Investments.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api';

// Get a cookie by name
function getCookie(name) {
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim();

        if (cookie.startsWith(name + '=')) {
            return decodeURIComponent(
                cookie.substring(name.length + 1)
            );
        }
    }

    return null;
}

function Investments() {
    const navigate = useNavigate();

    const [investments, setInvestments] = useState([]);
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedInvestment, setSelectedInvestment] = useState(null);
    const [actionType, setActionType] = useState('');
    const [amount, setAmount] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch investments and portfolio information
    const fetchInvestmentData = async () => {
        try {
            const [investmentResponse, portfolioResponse] =
                await Promise.all([
                    fetch(`${API_URL}/investments/`, {
                        credentials: 'include',
                    }),
                    fetch(`${API_URL}/portfolio/rate/`, {
                        credentials: 'include',
                    }),
                ]);

            if (!investmentResponse.ok || !portfolioResponse.ok) {
                throw new Error(
                    'Could not load investment information. Please check that you are logged in.'
                );
            }

            const investmentData = await investmentResponse.json();
            const portfolioData = await portfolioResponse.json();

            setInvestments(investmentData);
            setPortfolio(portfolioData);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvestmentData();
    }, []);

    // Handle deposits and withdrawals
    const handleInvestmentAction = async (e) => {
        e.preventDefault();

        if (!selectedInvestment) {
            setActionMessage('Please select an investment.');
            return;
        }

        if (!amount || Number(amount) <= 0) {
            setActionMessage('Please enter a valid amount.');
            return;
        }

        setSubmitting(true);
        setActionMessage('');

        try {
            // Request a CSRF cookie from Django
            const csrfResponse = await fetch(`${API_URL}/csrf/`, {
                credentials: 'include',
            });

            if (!csrfResponse.ok) {
                throw new Error(
                    'Could not obtain a CSRF token. Please refresh the page and try again.'
                );
            }

            // Read the CSRF token
            const csrfToken = getCookie('csrftoken');

            if (!csrfToken) {
                throw new Error(
                    'CSRF token not found. Please log in again and retry.'
                );
            }

            // Send the deposit or withdrawal request
            const response = await fetch(
                `${API_URL}/investments/${selectedInvestment.id}/${actionType}/`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken,
                    },
                    body: JSON.stringify({
                        amount: amount,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.detail ||
                    data.message ||
                    'The transaction failed.'
                );
            }

            setActionMessage(
                data.message ||
                `${actionType === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`
            );

            setAmount('');
            setSelectedInvestment(null);
            setActionType('');

            // Refresh investment and portfolio information
            await fetchInvestmentData();

        } catch (err) {
            setActionMessage(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="investments-page">
                <button
                    type="button"
                    className="back-dashboard-button"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Back to Dashboard
                </button>

                <p>Loading investments...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="investments-page">
                <button
                    type="button"
                    className="back-dashboard-button"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Back to Dashboard
                </button>

                <h2>My Investments</h2>
                <p>{error}</p>

                <button
                    type="button"
                    onClick={fetchInvestmentData}
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="investments-page">

            {/* Back to the main dashboard */}
            <button
                type="button"
                className="back-dashboard-button"
                onClick={() => navigate('/dashboard')}
            >
                ← Back to Dashboard
            </button>

            <h2>My Investments</h2>

            <p>Track your investments and portfolio growth.</p>

            {/* Portfolio summary */}
            {portfolio && (
                <div className="investment-summary">

                    <div className="summary-card">
                        <h4>Total Invested</h4>
                        <h2>
                            KES{' '}
                            {Number(
                                portfolio.total_invested
                            ).toLocaleString()}
                        </h2>
                    </div>

                    <div className="summary-card">
                        <h4>Current Value</h4>
                        <h2>
                            KES{' '}
                            {investments
                                .reduce(
                                    (total, item) =>
                                        total +
                                        Number(item.current_value),
                                    0
                                )
                                .toLocaleString()}
                        </h2>
                    </div>

                    <div className="summary-card">
                        <h4>Profit / Loss</h4>
                        <h2>
                            KES{' '}
                            {investments
                                .reduce(
                                    (total, item) =>
                                        total +
                                        Number(item.profit_or_loss),
                                    0
                                )
                                .toLocaleString()}
                        </h2>
                    </div>

                    <div className="summary-card">
                        <h4>Annual Rate</h4>
                        <h2>
                            {portfolio.annual_rate_percentage}%
                        </h2>
                    </div>

                    <div className="summary-card">
                        <h4>Estimated Annual Growth</h4>
                        <h2>
                            KES{' '}
                            {Number(
                                portfolio.estimated_annual_growth
                            ).toLocaleString()}
                        </h2>
                    </div>

                    <div className="summary-card">
                        <h4>Estimated Monthly Growth</h4>
                        <h2>
                            KES{' '}
                            {Number(
                                portfolio.estimated_monthly_growth
                            ).toLocaleString()}
                        </h2>
                    </div>

                </div>
            )}

            {/* Investment growth chart */}
            <InvestmentGrowthChart investments={investments} />

            <h3>Your Investments</h3>

            {investments.length === 0 ? (
                <p>You have not added any investments yet.</p>
            ) : (
                investments.map((investment) => (
                    <div
                        key={investment.id}
                        className="investment-card"
                    >
                        <h4>{investment.name}</h4>

                        <p>
                            Type: {investment.investment_type}
                        </p>

                        <p>
                            Amount Invested: KES{' '}
                            {Number(
                                investment.amount_invested
                            ).toLocaleString()}
                        </p>

                        <p>
                            Current Value: KES{' '}
                            {Number(
                                investment.current_value
                            ).toLocaleString()}
                        </p>

                        <p>
                            Profit/Loss: KES{' '}
                            {Number(
                                investment.profit_or_loss
                            ).toLocaleString()}
                        </p>

                        <div className="investment-actions">

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedInvestment(investment);
                                    setActionType('deposit');
                                    setAmount('');
                                    setActionMessage('');
                                }}
                            >
                                Deposit
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedInvestment(investment);
                                    setActionType('withdraw');
                                    setAmount('');
                                    setActionMessage('');
                                }}
                            >
                                Withdraw
                            </button>

                        </div>
                    </div>
                ))
            )}

            {/* Deposit and withdrawal form */}
            {selectedInvestment && (
                <div className="investment-form">

                    <h3>
                        {actionType === 'deposit'
                            ? 'Deposit Money'
                            : 'Withdraw Money'}
                    </h3>

                    <p>
                        Investment: {selectedInvestment.name}
                    </p>

                    <form onSubmit={handleInvestmentAction}>

                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Enter amount (KES)"
                            value={amount}
                            onChange={(e) =>
                                setAmount(e.target.value)
                            }
                            required
                            disabled={submitting}
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting
                                ? 'Processing...'
                                : `Confirm ${
                                      actionType === 'deposit'
                                          ? 'Deposit'
                                          : 'Withdrawal'
                                  }`}
                        </button>

                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => {
                                setSelectedInvestment(null);
                                setAmount('');
                                setActionMessage('');
                            }}
                        >
                            Cancel
                        </button>

                    </form>
                </div>
            )}

            {actionMessage && (
                <p className="action-message" role="status">
                    {actionMessage}
                </p>
            )}

        </div>
    );
}

export default Investments;
