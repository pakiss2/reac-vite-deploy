import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'teller', 'superadmin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/clients" element={<ProtectedRoute allowedRoles={['admin', 'teller', 'superadmin']}><Clients /></ProtectedRoute>} />
            <Route path="/admin/clients/:id" element={<ProtectedRoute allowedRoles={['admin', 'teller', 'superadmin']}><ClientDetails /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin', 'teller', 'superadmin']}><Reports /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><Settings /></ProtectedRoute>} />

            <Route path="/teller" element={<Navigate to="/admin" replace />} /> {/* Legacy redirect */}

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
