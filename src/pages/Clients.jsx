import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { MOCK_CLIENTS } from '../lib/mockData';
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
    const navigate = useNavigate();
    const [clients, setClients] = useState(MOCK_CLIENTS);
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({
        firstName: '',
        lastName: '',
        address: '',
        contactNo: '',
        email: '',
        accountNo: '',
        type: 'Residential'
    });

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.meterNo.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this client?')) {
            setClients(clients.filter(c => c.id !== id));
        }
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
            contactNo: newClient.contactNo
        };

        setClients([...clients, client]);
        setIsAddModalOpen(false);
        setNewClient({
            firstName: '',
            lastName: '',
            address: '',
            contactNo: '',
            email: '',
            accountNo: '',
            type: 'Residential'
        });
    };

    return (
        <DashboardLayout title="Clients">
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
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-[#1a2332] text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span>Add New Client</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-medium text-slate-600 text-sm">Account No.</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Name</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Type</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Status</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Address</th>
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
                                <td className="p-4">
                                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                                        client.type === 'commercial' ? "bg-indigo-900 text-white" : "bg-slate-200 text-slate-700"
                                    )}>
                                        {client.type}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                                        client.status === 'active' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                    )}>
                                        {client.status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-500">{client.address}</td>
                                <td className="p-4 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDelete(client.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Client"
                                    >
                                        <Trash2 size={16} />
                                    </button>
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
