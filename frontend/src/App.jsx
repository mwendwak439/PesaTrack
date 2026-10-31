
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

import Login from './components/pages/Login';
import Dashboard from './components/pages/Dashboard';
import AddTransaction from './components/pages/AddTransaction';
import EditTransaction from './components/pages/EditTransaction';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
  <Route path="/" element={<Login />} />
  <Route path="/login" element={<Login />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/add-transaction" element={<AddTransaction />} />
  <Route path="/edit-transaction/:id" element={<EditTransaction />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
        </BrowserRouter>
    );
}

export default App;
