import { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USERS } from '../lib/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage on load
        const storedUser = localStorage.getItem('waterwise_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);

        // Listen for updates from other tabs
        const handleStorage = (e) => {
            if (e.key === 'waterwise_user' && e.newValue) {
                setUser(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const login = (username, password) => {
        const foundUser = MOCK_USERS.find(u => u.username === username && u.password === password);
        if (foundUser) {
            // Remove password before saving
            const { password, ...safeUser } = foundUser;
            setUser(safeUser);
            localStorage.setItem('waterwise_user', JSON.stringify(safeUser));
            return { success: true, role: safeUser.role };
        }
        return { success: false, error: 'Invalid credentials' };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('waterwise_user');
    };

    const updateUser = (updates) => {
        setUser(prev => {
            const newUser = { ...prev, ...updates };
            localStorage.setItem('waterwise_user', JSON.stringify(newUser));
            return newUser;
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
