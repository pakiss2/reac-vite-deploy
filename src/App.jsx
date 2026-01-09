import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/clients" element={<Clients />} />
          <Route path="/admin/clients/:id" element={<ClientDetails />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/teller" element={<Navigate to="/admin" replace />} /> {/* Legacy redirect */}

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
