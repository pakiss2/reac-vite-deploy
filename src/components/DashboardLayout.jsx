import {
    LayoutDashboard,
    Users,
    FileText,
    Settings as SettingsIcon,
    LogOut,
    Droplets,
    Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function DashboardLayout({ children, title }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Determine role-based links
    const links = user?.role === 'superadmin' ? [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Clients', path: '/admin/clients' },
        { icon: FileText, label: 'Reports', path: '/admin/reports' },
        { icon: SettingsIcon, label: 'Settings', path: '/admin/settings' },
    ] : user?.role === 'admin' ? [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Clients', path: '/admin/clients' },
        { icon: FileText, label: 'Reports', path: '/admin/reports' },
        { icon: SettingsIcon, label: 'Settings', path: '/admin/settings' },
    ] : [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Clients', path: '/admin/clients' },
        { icon: FileText, label: 'Reports', path: '/admin/reports' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <aside className="w-64 bg-[#1a2332] text-white flex flex-col fixed h-full z-10 print:hidden">
                <div className="p-6 flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Droplets className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Nagcarlan water billing</span>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {links.map((link) => (
                        <Link key={link.path} to={link.path}>
                            <div className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
                                location.pathname === link.path
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}>
                                <link.icon size={20} />
                                {link.label}
                            </div>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden border border-slate-500/50 shadow-inner">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-xs text-white font-bold">{user?.name?.[0] || 'U'}</span>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate text-white">{user?.name}</p>
                            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full mt-4 flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-sm"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-64 p-8 overflow-y-auto print:ml-0 print:p-0">
                <header className="flex justify-between items-center mb-8 print:hidden">
                    <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
                </header>
                {children}
            </main>
        </div>
    );
}
