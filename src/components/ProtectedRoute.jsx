import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center font-bold text-white">
                Verifying Session...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to a default safe page based on role if unauthorized
        const defaultPath = user.role === 'superadmin' ? '/admin/infrastructure' : '/admin';
        return <Navigate to={defaultPath} replace />;
    }

    return children;
}
