
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddTransaction.css';

const API_URL = 'http://localhost:8000/api';

function AddTransaction() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    transaction_type: 'Expense',
    category: 'Food',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Get CSRF token from browser cookies
  const getCsrfToken = () => {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='));

    return cookie ? cookie.split('=')[1] : null;
  };

  // Handle changes in form fields
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Submit transaction to Django
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const csrfResponse = await fetch(`${API_URL}/csrf/`, {
        credentials: 'include',
      });

      if (!csrfResponse.ok) {
        throw new Error('Could not obtain CSRF cookie.');
      }

      const csrfToken = getCsrfToken();

      if (!csrfToken) {
        throw new Error('CSRF token not found. Please try again.');
      }

      const response = await fetch(`${API_URL}/transactions/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      setMessage('Transaction added successfully!');

      // Return to dashboard after successful submission
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-transaction">
      <h2>Add New Transaction</h2>

      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <label>Transaction Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <label>Transaction Type</label>
        <select
          name="transaction_type"
          value={formData.transaction_type}
          onChange={handleChange}
        >
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>

        <label>Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
        >
          {[
            'Salary', 'Business', 'Food', 'Transport', 'Rent',
            'Shopping', 'Bills', 'Health', 'Education',
            'Entertainment', 'Fitness', 'Other'
          ].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <label>Amount (KES)</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          min="0.01"
          step="0.01"
          required
        />

        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
        />

        <label>Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
}

export default AddTransaction;
