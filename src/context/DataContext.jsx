import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MOCK_CLIENTS, MOCK_BILLS } from '../lib/mockData';

const DataContext = createContext();

export function DataProvider({ children }) {
    // Initialize state from localStorage or mock data
    const [clients, setClients] = useState(() => {
        try {
            const stored = localStorage.getItem('waterwise_clients');
            return stored ? JSON.parse(stored) : MOCK_CLIENTS;
        } catch (e) {
            console.error('Error loading clients from storage:', e);
            return MOCK_CLIENTS;
        }
    });

    const [bills, setBills] = useState(() => {
        try {
            const stored = localStorage.getItem('waterwise_bills');
            return stored ? JSON.parse(stored) : MOCK_BILLS;
        } catch (e) {
            console.error('Error loading bills from storage:', e);
            return MOCK_BILLS;
        }
    });

    const [billingSettings, setBillingSettings] = useState(() => {
        try {
            const stored = localStorage.getItem('waterwise_billing_settings');
            return stored ? JSON.parse(stored) : {
                residential: {
                    minConsumption: 15,
                    minRate: 30,
                    tier1Rate: 2.5,
                    tier1Limit: 25,
                    tier2Rate: 3
                },
                commercial: {
                    minConsumption: 15,
                    minRate: 40,
                    tier1Rate: 5,
                    tier1Limit: 50,
                    tier2Rate: 6
                }
            };
        } catch (e) {
            return {
                residential: { minConsumption: 15, minRate: 30, tier1Rate: 2.5, tier1Limit: 25, tier2Rate: 3 },
                commercial: { minConsumption: 15, minRate: 40, tier1Rate: 5, tier1Limit: 50, tier2Rate: 6 }
            };
        }
    });

    const [penaltySettings, setPenaltySettings] = useState(() => {
        try {
            const stored = localStorage.getItem('waterwise_penalty_settings');
            return stored ? JSON.parse(stored) : {
                ratePerMonth: 0.02,
                maxRate: 0.36,
                maxMonths: 18
            };
        } catch (e) {
            return { ratePerMonth: 0.02, maxRate: 0.36, maxMonths: 18 };
        }
    });

    const [lastUpdated, setLastUpdated] = useState(Date.now());

    const isInternalUpdate = useRef(false);

    // 1. Persist to localStorage whenever state changes
    useEffect(() => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }
        localStorage.setItem('waterwise_clients', JSON.stringify(clients));
        setLastUpdated(Date.now());
    }, [clients]);

    useEffect(() => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }
        localStorage.setItem('waterwise_bills', JSON.stringify(bills));
        setLastUpdated(Date.now());
    }, [bills]);

    useEffect(() => {
        localStorage.setItem('waterwise_billing_settings', JSON.stringify(billingSettings));
    }, [billingSettings]);

    useEffect(() => {
        localStorage.setItem('waterwise_penalty_settings', JSON.stringify(penaltySettings));
    }, [penaltySettings]);

    // 2. Listen for storage events (updates from other tabs)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'waterwise_clients' && e.newValue) {
                const newData = JSON.parse(e.newValue);
                if (JSON.stringify(newData) !== JSON.stringify(clients)) {
                    isInternalUpdate.current = true;
                    setClients(newData);
                }
            }
            if (e.key === 'waterwise_bills' && e.newValue) {
                const newData = JSON.parse(e.newValue);
                if (JSON.stringify(newData) !== JSON.stringify(bills)) {
                    isInternalUpdate.current = true;
                    setBills(newData);
                }
            }
            if (e.key === 'waterwise_billing_settings' && e.newValue) {
                setBillingSettings(JSON.parse(e.newValue));
            }
            if (e.key === 'waterwise_penalty_settings' && e.newValue) {
                setPenaltySettings(JSON.parse(e.newValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [clients, bills]);

    // Bill Actions
    const payBills = (billIds, penaltiesMap = {}) => {
        setBills(prevBills => prevBills.map(bill =>
            billIds.includes(bill.id)
                ? {
                    ...bill,
                    status: 'paid',
                    paidDate: new Date().toISOString(),
                    penaltyPaid: penaltiesMap[bill.id] || 0
                }
                : bill
        ));
    };

    // Client Actions
    const addClient = (client) => {
        setClients(prev => [...prev, client]);
    };

    const deleteClient = (id) => {
        setClients(prev => prev.filter(c => c.id !== id));
        // Also delete their bills
        setBills(prev => prev.filter(b => b.clientId !== id));
    };

    const addBill = (bill) => {
        setBills(prev => [bill, ...prev]);
    };

    return (
        <DataContext.Provider value={{
            clients,
            bills,
            billingSettings,
            setBillingSettings,
            penaltySettings,
            setPenaltySettings,
            payBills,
            addClient,
            deleteClient,
            addBill,
            lastUpdated
        }}>
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
