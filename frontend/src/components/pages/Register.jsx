
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const API_URL = 'http://localhost:8000/api';

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));

        setError('');
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Your passwords do not match.');
            return;
        }

        if (formData.password.length < 8) {
            setError('Your password must contain at least 8 characters.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const message = Object.entries(data)
                    .map(([field, messages]) => {
                        const readableMessages = Array.isArray(messages)
                            ? messages.join(' ')
                            : typeof messages === 'string'
                                ? messages
                                : JSON.stringify(messages);

                        return `${field}: ${readableMessages}`;
                    })
                    .join(' ');

                throw new Error(message || 'Registration failed.');
            }

            navigate('/login', {
                state: {
                    message: 'Account created successfully! Please log in.',
                },
            });
        } catch (err) {
            setError(
                err.message || 'Unable to register. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    }

    const passwordsDoNotMatch =
        formData.confirmPassword.length > 0 &&
        formData.password !== formData.confirmPassword;

    return (
        <div className="auth-container">
            <form
                className="auth-form"
                onSubmit={handleSubmit}
                noValidate
            >
                <div className="auth-brand">
                    <div className="auth-logo">P</div>
                    <h1>PesaTrack</h1>
                </div>

                <h2 className="auth-title">Create Your Account</h2>

                <p className="auth-subtitle">
                    Join PesaTrack and start managing your finances.
                </p>

                {error && (
                    <div className="auth-error" role="alert">
                        {error}
                    </div>
                )}

                <div className="auth-field">
                    <label htmlFor="username">Username</label>

                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Choose a username"
                        autoComplete="username"
                        required
                    />
                </div>

                <div className="auth-field">
                    <label htmlFor="email">Email address</label>

                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        autoComplete="email"
                        required
                    />
                </div>

                <div className="auth-field">
                    <label htmlFor="password">Password</label>

                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        minLength={8}
                        required
                    />

                    <small className="password-hint">
                        Use at least 8 characters.
                    </small>
                </div>

                <div className="auth-field">
                    <label htmlFor="confirmPassword">
                        Confirm Password
                    </label>

                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Enter your password again"
                        autoComplete="new-password"
                        minLength={8}
                        aria-invalid={passwordsDoNotMatch}
                        aria-describedby={
                            passwordsDoNotMatch
                                ? 'password-mismatch'
                                : undefined
                        }
                        required
                    />

                    {passwordsDoNotMatch && (
                        <small
                            id="password-mismatch"
                            className="password-hint"
                        >
                            Passwords do not match yet.
                        </small>
                    )}
                </div>

                <button
                    className="auth-button"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Creating account...' : 'Create Account'}
                </button>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <Link to="/login">Log in</Link>
                </p>
            </form>
        </div>
    );
}

export default Register;
