
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import ExpensePieChart from './ExpensePieChart';
import IncomeExpenseLineChart from './IncomeExpenseLineChart';

const API_URL = 'http://localhost:8000/api';

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Logout function
  const handleLogout = async () => {
    try {
      const csrfResponse = await fetch(`${API_URL}/csrf/`, {
        credentials: 'include',
      });

      if (!csrfResponse.ok) {
        throw new Error('Could not get CSRF token');
      }

      const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrftoken='))
        ?.split('=')[1];

      const response = await fetch(`${API_URL}/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrfToken,
        },
      });

      if (response.ok) {
        navigate('/login');
      } else {
        alert('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Something went wrong while logging out.');
    }
  };
  
// Delete transaction function
const handleDelete = async (id) => {
  const confirmDelete = window.confirm(
    'Are you sure you want to delete this transaction?'
  );

  if (!confirmDelete) return;

  try {
    const csrfResponse = await fetch(`${API_URL}/csrf/`, {
      credentials: 'include',
    });

    if (!csrfResponse.ok) {
      throw new Error('Could not get CSRF token.');
    }

    const csrfToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='))
      ?.split('=')[1];

    const response = await fetch(`${API_URL}/transactions/${id}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });

    if (!response.ok) {
      throw new Error('Could not delete transaction.');
    }

    // Remove deleted transaction from the dashboard
    setTransactions((previousTransactions) =>
      previousTransactions.filter((item) => item.id !== id)
    );

    alert('Transaction deleted successfully!');

  } catch (error) {
    console.error('Delete error:', error);
    alert(error.message);
  }
};


  // Fetch transactions from Django
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${API_URL}/transactions/`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Could not load transactions. Please log in again.');
        }

        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Calculate total income
  const totalIncome = transactions
    .filter((item) => item.transaction_type === 'Income')
    .reduce((total, item) => total + Number(item.amount), 0);

  // Calculate total expenses
  const totalExpenses = transactions
    .filter((item) => item.transaction_type === 'Expense')
    .reduce((total, item) => total + Number(item.amount), 0);

  // Calculate available balance
  const balance = totalIncome - totalExpenses;

  if (loading) {
    return <p>Loading your transactions...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div className="dashboard">

      {/* Dashboard Header */}
      <header className="dashboard-header">
        <div>
          <h1>PesaTrack</h1>
          <p>Welcome to your personal finance dashboard.</p>
        </div>

        <div>
          <Link to="/add-transaction">
            Add Transaction
          </Link>

          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="summary-cards">
        <div className="summary-card">
          <h3>Total Income</h3>
          <h2>KES {totalIncome.toFixed(2)}</h2>
        </div>

        <div className="summary-card">
          <h3>Total Expenses</h3>
          <h2>KES {totalExpenses.toFixed(2)}</h2>
        </div>

        <div className="summary-card">
          <h3>Available Balance</h3>
          <h2>KES {balance.toFixed(2)}</h2>
        </div>
      </section>

      {/* Charts Section */}
      <section className="charts-section">

        {/* Expense Pie Chart */}
        <div className="chart-card">
          <ExpensePieChart transactions={transactions} />
        </div>

        {/* Income and Expenses Line Graph */}
        <div className="chart-card">
          <IncomeExpenseLineChart transactions={transactions} />
        </div>

      </section>

      {/* Recent Transactions */}
      <section className="transactions-section">
        <h2>Recent Transactions</h2>

        {transactions.length === 0 ? (
          <p>No transactions to display yet.</p>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <div>
                <strong>{transaction.title}</strong>
                <p>
                  {transaction.category} - {transaction.date}
                </p>
              </div>

<div className="transaction-actions">
  <strong>
    {transaction.transaction_type === 'Income' ? '+' : '-'}
    KES {Number(transaction.amount).toFixed(2)}
  </strong>

  <Link
    to={`/edit-transaction/${transaction.id}`}
    className="edit-button"
  >
    Edit
  </Link>

  <button
    className="delete-button"
    onClick={() => handleDelete(transaction.id)}
  >
    Delete
  </button>
</div>

            </div>
          ))
        )}
      </section>

    </div>
  );
}

export default Dashboard;
