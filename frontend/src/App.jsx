
import React, { useEffect, useState } from 'react';

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

import Login from './components/pages/Login';
import Register from './components/pages/Register';
import Dashboard from './components/pages/Dashboard';
import AddTransaction from './components/pages/AddTransaction';
import EditTransaction from './components/pages/EditTransaction';
import Investments from './components/pages/Investments';

import './App.css';

const API_URL = 'http://localhost:8000/api';

// Check whether the user is logged in
function ProtectedRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/me/`, {
            method: 'GET',
            credentials: 'include'
        })
            .then(response => {
                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            })
            .catch(() => {
                setIsAuthenticated(false);
            });
    }, []);

    // Wait while checking authentication
    if (isAuthenticated === null) {
        return <p>Checking authentication...</p>;
    }

    // Redirect logged-out users
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/add-transaction"
                    element={
                        <ProtectedRoute>
                            <AddTransaction />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/investments"
                    element={
                        <ProtectedRoute>
                            <Investments />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/edit-transaction/:id"
                    element={
                        <ProtectedRoute>
                            <EditTransaction />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
