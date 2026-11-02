
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AddTransaction.css';
const API_URL = 'http://localhost:8000/api';

function EditTransaction() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    transaction_type: 'Expense',
    category: 'Food',
    amount: '',
    description: '',
    date: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Get CSRF token
  const getCsrfToken = () => {
    return document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='))
      ?.split('=')[1];
  };

  // Fetch the transaction we want to edit
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`${API_URL}/transactions/${id}/`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Could not load transaction.');
        }

        const data = await response.json();

        setFormData({
          title: data.title,
          transaction_type: data.transaction_type,
          category: data.category,
          amount: data.amount,
          description: data.description || '',
          date: data.date,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Update transaction
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError('');

    try {
      const csrfResponse = await fetch(`${API_URL}/csrf/`, {
        credentials: 'include',
      });

      if (!csrfResponse.ok) {
        throw new Error('Could not get CSRF token.');
      }

      const csrfToken = getCsrfToken();

      if (!csrfToken) {
        throw new Error('CSRF token is missing.');
      }

      const response = await fetch(`${API_URL}/transactions/${id}/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      alert('Transaction updated successfully!');
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading transaction...</p>;
  }

  return (
    <div className="add-transaction">
      <h1>Edit Transaction</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>

        <label>Title</label>
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

        <label>Amount</label>
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

        <button type="submit" disabled={saving}>
          {saving ? 'Updating...' : 'Update Transaction'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
        >
          Cancel
        </button>

      </form>
    </div>
  );
}

export default EditTransaction;
