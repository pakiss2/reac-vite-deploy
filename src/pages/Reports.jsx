import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { MOCK_BILLS, MOCK_CLIENTS } from '../lib/mockData';
import { Download, Filter, Calendar } from 'lucide-react';
import { formatCurrency } from '../lib/billing';

export default function Reports() {
    const [selectedMonth, setSelectedMonth] = useState('2026-06'); // Default to latest mock date

    // 1. Join Bills with Client Data
    const joinedBills = MOCK_BILLS.map(bill => {
        const client = MOCK_CLIENTS.find(c => c.id === bill.clientId);
        return {
            ...bill,
            clientName: client ? client.name : 'Unknown Client'
        };
    });

    // 2. Filter by Month
    const filteredBills = joinedBills.filter(bill => {
        // bill.date format is YYYY-MM-DD. We check if it starts with the selected YYYY-MM
        return bill.date.startsWith(selectedMonth);
    });

    // 3. Calc Totals
    const totalAmount = filteredBills.reduce((sum, b) => sum + b.amount, 0);
    const paidCount = filteredBills.filter(b => b.status === 'paid').length;
    const unpaidCount = filteredBills.filter(b => b.status === 'unpaid').length;

    return (
        <DashboardLayout title="Reports">

            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 px-2 text-slate-500">
                        <Calendar size={18} />
                        <span className="text-sm font-medium">Month:</span>
                    </div>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="outline-none text-slate-700 font-medium bg-transparent"
                    />
                </div>

                <button className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm shadow-sm">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Billed</h3>
                    <p className="text-2xl font-bold text-slate-800 mt-2">{formatCurrency(totalAmount)}</p>
                    <div className="mt-2 text-xs text-slate-400">{filteredBills.length} bills generated</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collected</h3>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                        {formatCurrency(filteredBills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0))}
                    </p>
                    <div className="mt-2 text-xs text-slate-400">{paidCount} paid bills</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unpaid / Overdue</h3>
                    <p className="text-2xl font-bold text-red-500 mt-2">
                        {formatCurrency(filteredBills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.amount, 0))}
                    </p>
                    <div className="mt-2 text-xs text-slate-400">{unpaidCount} unpaid bills</div>
                </div>
            </div>

            {/* Report Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-medium text-slate-600 text-sm">Client Name</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Bill Date</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Due Date</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Consumption</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Amount</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBills.length > 0 ? filteredBills.map((bill) => (
                            <tr key={bill.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium text-slate-800">{bill.clientName}</td>
                                <td className="p-4 text-sm text-slate-500">{bill.date}</td>
                                <td className="p-4 text-sm text-slate-500">{bill.dueDate}</td>
                                <td className="p-4 text-sm text-slate-600">{bill.consumption} m³</td>
                                <td className="p-4 font-mono font-medium text-slate-700">{formatCurrency(bill.amount)}</td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${bill.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {bill.status}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-400">
                                    No records found for this month.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
