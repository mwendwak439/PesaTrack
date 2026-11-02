import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Login.css';

const API_URL = 'http://localhost:8000/api';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
const successMessage = location.state?.message || '';
    const getCsrfToken = () => {
        const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith('csrftoken='));

        return cookie ? cookie.split('=')[1] : null;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            await fetch(`${API_URL}/csrf/`, {
                method: 'GET',
                credentials: 'include',
            });

            const csrfToken = getCsrfToken();

            if (!csrfToken) {
                throw new Error(
                    'CSRF token not found. Check your Django cookie settings.'
                );
            }

            const response = await fetch(`${API_URL}/login/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || 'Login failed. Check your credentials.'
                );
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Unable to connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-brand">
                    <div className="auth-logo">P</div>
                    <h1>PesaTrack</h1>
                </div>

                <h2 className="auth-title">Welcome back!</h2>

                <p className="auth-subtitle">
                    Log in to manage your money.
                </p>

              {successMessage && (
    <div className="auth-success" role="status">
        {successMessage}
    </div>
)}

{error && (
    <div className="auth-error" role="alert">
        {error}
    </div>
)}

                <div className="auth-field">
                    <label htmlFor="username">Username</label>

                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(event) =>
                            setUsername(event.target.value)
                        }
                        placeholder="Enter your username"
                        autoComplete="username"
                        required
                    />
                </div>

                <div className="auth-field">
                    <label htmlFor="password">Password</label>

                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                    />
                </div>

                <button
                    className="auth-button"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Log In'}
                </button>

                <p className="auth-switch">
                    Don't have an account?{' '}
                    <Link to="/register">Register here</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;