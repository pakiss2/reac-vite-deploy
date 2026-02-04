import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { calculateConsumptionFromAmount, calculateBillAmount } from '../lib/billing';
import {
    Plus,
    Search,
    Trash2,
    ChevronRight,
    MoreHorizontal,
    X
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Clients() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { clients, addClient, deleteClient, addBill, bills, billingSettings, penaltySettings } = useData();
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({
        firstName: '',
        lastName: '',
        address: '',
        contactNo: '',
        email: '',
        accountNo: '',
        type: 'Residential',
        paymentSchedule: 'Monthly',
        initialAmount: ''
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const filterType = searchParams.get('filter'); // 'overdue' or null

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.meterNo.toLowerCase().includes(search.toLowerCase());

        if (filterType === 'overdue') {
            const clientBills = bills.filter(b => b.clientId === c.id && b.status === 'unpaid');
            const hasOverdue = clientBills.length > 0;
            return matchesSearch && hasOverdue;
        }

        return matchesSearch;
    });

    const clearFilter = () => {
        setSearchParams({});
    };


    const handleAddClient = (e) => {
        e.preventDefault();
        // Use provided Account No or generate one
        const accountNo = newClient.accountNo || `A${1000 + clients.length}`;

        const client = {
            id: Date.now(), // Simple unique ID
            meterNo: accountNo,
            name: `${newClient.firstName} ${newClient.lastName}`,
            type: newClient.type.toLowerCase(),
            address: newClient.address,
            status: 'active', // Default status
            email: newClient.email,
            contactNo: newClient.contactNo,
            paymentSchedule: newClient.paymentSchedule
        };

        addClient(client);

        // Auto-generate initial bill if amount is provided
        if (newClient.initialAmount && parseFloat(newClient.initialAmount) > 0) {
            const amount = parseFloat(newClient.initialAmount);
            const consumption = calculateConsumptionFromAmount(newClient.type.toLowerCase(), amount, billingSettings);

            const now = new Date();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
            const monthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const billId = `B-${client.id}-${monthId}`;

            addBill({
                id: billId,
                clientId: client.id,
                date: `${monthId}-01`,
                month: monthLabel,
                dueDate: `${monthId}-15`,
                prevReading: 0,
                currReading: consumption,
                consumption: consumption,
                amount: amount,
                status: 'unpaid',
                paidAmount: 0,
                paidDate: null
            });
        }

        setIsAddModalOpen(false);
        setNewClient({
            firstName: '',
            lastName: '',
            address: '',
            contactNo: '',
            email: '',
            accountNo: '',
            type: 'Residential',
            paymentSchedule: 'Monthly'
        });
    };

    return (
        <DashboardLayout title="Clients">
            {/* Filter Banner */}
            {filterType === 'overdue' && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <Trash2 size={16} /> {/* Using Trash as a placeholder icon for 'debt', or use AlertCircle */}
                        </div>
                        <div>
                            <p className="font-bold text-orange-800 text-sm">Showing Overdue Clients</p>
                            <p className="text-xs text-orange-600">Displaying {filteredClients.length} clients with outstanding balances.</p>
                        </div>
                    </div>
                    <button
                        onClick={clearFilter}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-orange-200 shadow-sm rounded-lg text-xs font-bold text-orange-700 hover:bg-orange-50 transition-colors"
                    >
                        <X size={14} />
                        Clear Filter
                    </button>
                </div>
            )}

            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    />
                </div>
                {user?.role === 'teller' && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-[#1a2332] text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        <span>Add New Client</span>
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-medium text-slate-600 text-sm">Account No.</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Client Name</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Address</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Contact No.</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Type</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Last Billing</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Balance</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Status</th>
                            <th className="p-4 font-medium text-slate-600 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.map((client) => (
                            <tr
                                key={client.id}
                                onClick={() => navigate(`/admin/clients/${client.id}`)}
                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
                            >
                                <td className="p-4 text-sm font-mono text-slate-500">{client.meterNo}</td>
                                <td className="p-4 text-sm font-medium text-slate-800">{client.name}</td>
                                <td className="p-4 text-sm text-slate-500">{client.address}</td>
                                <td className="p-4 text-sm text-slate-500">{client.contactNo || '-'}</td>
                                <td className="p-4 pt-5">
                                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                                        client.type === 'commercial' ? "bg-indigo-900 text-white" : "bg-slate-200 text-slate-700"
                                    )}>
                                        {client.type}
                                    </span>
                                </td>
                                <td className="p-4 pt-5 text-sm text-slate-600">
                                    {(() => {
                                        const clientBills = bills.filter(b => b.clientId === client.id);
                                        const latest = [...clientBills].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                                        return latest ? latest.month : 'None';
                                    })()}
                                </td>
                                <td className="p-4 pt-5 text-sm font-bold text-slate-800">
                                    {(() => {
                                        const clientBills = bills.filter(b => b.clientId === client.id && b.status === 'unpaid');
                                        const balance = clientBills.reduce((sum, b) => sum + b.amount, 0);
                                        return `₱${balance.toLocaleString()}`;
                                    })()}
                                </td>
                                <td className="p-4 pt-5 text-sm">
                                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                                        client.status === 'active' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                    )}>
                                        {client.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <ChevronRight size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredClients.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        No clients found.
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in fade-in duration-200">
                        <div className="p-6 pb-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-xl text-slate-800">Add New Client</h3>
                                    <p className="text-sm text-slate-500 mt-1">Enter the details for the new client.</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAddClient} className="p-6 space-y-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-medium text-slate-700 text-right">First Name</label>
                                <input
                                    required
                                    type="text"
                                    className="col-span-3 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={newClient.firstName}
                                    onChange={e => setNewClient({ ...newClient, firstName: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-medium text-slate-700 text-right">Last Name</label>
                                <input
                                    required
                                    type="text"
                                    className="col-span-3 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={newClient.lastName}
                                    onChange={e => setNewClient({ ...newClient, lastName: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-medium text-slate-700 text-right">Address</label>
                                <input
                                    required
                                    type="text"
                                    className="col-span-3 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={newClient.address}
                                    onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-medium text-slate-700 text-right">Contact No.</label>
                                <input
                                    type="text"
                                    className="col-span-3 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={newClient.contactNo}
                                    onChange={e => setNewClient({ ...newClient, contactNo: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-medium text-slate-700 text-right">Email</label>
                                <input
                                    type="email"
                                    className="col-span-3 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={newClient.email}
                                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-medium text-slate-700 text-right">Account No.</label>
                                <input
                                    type="text"
                                    placeholder="Auto-generated if empty"
                                    className="col-span-3 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={newClient.accountNo}
                                    onChange={e => setNewClient({ ...newClient, accountNo: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-medium text-slate-700 text-right">Type</label>
                                <div className="col-span-3 relative">
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none bg-white"
                                        value={newClient.type}
                                        onChange={e => setNewClient({ ...newClient, type: e.target.value })}
                                    >
                                        <option>Residential</option>
                                        <option>Commercial</option>
                                    </select>
                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-sm font-medium text-slate-700 text-right">Payment Schedule</label>
                                <div className="col-span-3 relative">
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none bg-white"
                                        value={newClient.paymentSchedule}
                                        onChange={e => setNewClient({ ...newClient, paymentSchedule: e.target.value })}
                                    >
                                        <option>Monthly</option>
                                        <option>Weekly</option>
                                        <option>Daily</option>
                                    </select>
                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4 border-t border-slate-100 pt-4">
                                <label className="text-sm font-bold text-blue-600 text-right">Initial Bill Amount</label>
                                <div className="col-span-3">
                                    <input
                                        type="number"
                                        placeholder="PHP (Optional)"
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-blue-50/30"
                                        value={newClient.initialAmount}
                                        onChange={e => setNewClient({ ...newClient, initialAmount: e.target.value })}
                                    />
                                    {newClient.initialAmount && parseFloat(newClient.initialAmount) > 0 && (
                                        <div className="mt-2 p-2 bg-blue-50 rounded-lg flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-200">
                                            <span className="text-[11px] text-blue-600 font-medium">Resulting Consumption:</span>
                                            <span className="text-[11px] text-blue-800 font-bold">
                                                {calculateConsumptionFromAmount(newClient.type.toLowerCase(), parseFloat(newClient.initialAmount), billingSettings).toFixed(2)} m³
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-1">If provided, an initial unpaid bill will be generated automatically.</p>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#1E3A8A] text-white hover:bg-blue-900 rounded-lg font-medium shadow-sm transition-colors"
                                >
                                    Add Client
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
