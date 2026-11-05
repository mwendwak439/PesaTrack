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
    const [amount, setAmount] = useState('');
    const [actionMessage, setActionMessage] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [showInvestmentForm, setShowInvestmentForm] = useState(false);
    const [creatingInvestment, setCreatingInvestment] = useState(false);

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

    // Invest money into the PesaTrack investment account
    const handleCreateInvestment = async (e) => {
        e.preventDefault();

        if (!amount || Number(amount) <= 0) {
            setActionMessage('Please enter a valid amount.');
            return;
        }

        setCreatingInvestment(true);
        setActionMessage('');

        try {
            const csrfResponse = await fetch(`${API_URL}/csrf/`, {
                credentials: 'include',
            });

            if (!csrfResponse.ok) {
                throw new Error('Could not obtain CSRF token.');
            }

            const csrfToken = getCookie('csrftoken');

            if (!csrfToken) {
                throw new Error(
                    'CSRF token not found. Please log in again.'
                );
            }

            const response = await fetch(`${API_URL}/investments/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({
                    amount: amount,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.detail ||
                    'Investment deposit failed.'
                );
            }

            setActionMessage(
                data.message || 'Investment deposit successful!'
            );

            setAmount('');
            setShowInvestmentForm(false);

            await fetchInvestmentData();

        } catch (err) {
            setActionMessage(err.message);
        } finally {
            setCreatingInvestment(false);
        }
    };

    useEffect(() => {
        fetchInvestmentData();
    }, []);

    // Handle investment withdrawals
    const handleWithdrawal = async (e) => {
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

            const csrfToken = getCookie('csrftoken');

            if (!csrfToken) {
                throw new Error(
                    'CSRF token not found. Please log in again.'
                );
            }

            // Send withdrawal request
            const response = await fetch(
                `${API_URL}/investments/${selectedInvestment.id}/withdraw/`,
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
                    'Withdrawal failed.'
                );
            }

            setActionMessage(
                data.message || 'Withdrawal successful!'
            );

            setAmount('');
            setSelectedInvestment(null);

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

    const totalCurrentValue = investments.reduce(
        (total, item) => total + Number(item.current_value),
        0
    );

    const totalProfitLoss = investments.reduce(
        (total, item) => total + Number(item.profit_or_loss),
        0
    );

// Calculate total profit/loss percentage
const totalInvested = Number(portfolio?.total_invested || 0);

const totalProfitLossPercentage = totalInvested > 0
    ? (totalProfitLoss / totalInvested) * 100
    : 0;

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
    <h4>Profit / Loss</h4>

    <h2>
        KES {totalProfitLoss.toLocaleString('en-KE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}
    </h2>

    <p>
        {totalProfitLoss > 0
            ? 'Profit'
            : totalProfitLoss < 0
                ? 'Loss'
                : 'No gain or loss'
        }
    </p>

    <p>
        {totalProfitLossPercentage.toFixed(2)}%
    </p>
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

            {/* Main investment button */}
            <button
                type="button"
             className="invest-money-button"
                onClick={() => {
                    setShowInvestmentForm(!showInvestmentForm);
                    setActionMessage('');
                    setSelectedInvestment(null);
                }}
            >
                {showInvestmentForm ? 'Cancel' : '+ Invest Money'}
            </button>

            {/* Invest money form */}
            {showInvestmentForm && (
                <div className="investment-form">

                    <h3>Invest Money</h3>

                    <p>
                        Enter the amount you want to transfer from your
                        PesaTrack wallet into your investment account.
                    </p>

                    <form onSubmit={handleCreateInvestment}>

                        <label>Investment Amount (KES)</label>

                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            disabled={creatingInvestment}
                        />

                        <button
                            type="submit"
                            disabled={creatingInvestment}
                        >
                            {creatingInvestment
                                ? 'Processing...'
                                : 'Invest Now'}
                        </button>

                        <button
                            type="button"
                            disabled={creatingInvestment}
                            onClick={() => {
                                setShowInvestmentForm(false);
                                setAmount('');
                                setActionMessage('');
                            }}
                        >
                            Cancel
                        </button>

                    </form>
                </div>
            )}

            {/* Investment account */}
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
                            className='withdraw-investment-button'
                                type="button"
                                onClick={() => {
                                    setSelectedInvestment(investment);
                                    setAmount('');
                                    setActionMessage('');
                                    setShowInvestmentForm(false);
                                }}
                            >
                                Withdraw
                            </button>

                        </div>
                    </div>
                ))
            )}

            {/* Withdrawal form */}
            {selectedInvestment && (
                <div className="investment-form">

                    <h3>Withdraw Money</h3>

                    <p>
                        Investment: {selectedInvestment.name}
                    </p>

                    <form onSubmit={handleWithdrawal}>

                        <label>Withdrawal Amount (KES)</label>

                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Enter amount (KES)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            disabled={submitting}
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting
                                ? 'Processing...'
                                : 'Confirm Withdrawal'}
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