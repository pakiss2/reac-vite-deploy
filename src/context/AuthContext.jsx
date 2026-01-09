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

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
