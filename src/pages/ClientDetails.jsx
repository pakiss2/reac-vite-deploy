import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { MOCK_CLIENTS, MOCK_BILLS } from '../lib/mockData';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../lib/billing';

// Mock Mock Data for Graph if not enough in MOCK_BILLS
const GRAPH_DATA = [
    { month: 'Jan', consumption: 12 },
    { month: 'Feb', consumption: 15 },
    { month: 'Mar', consumption: 18 },
    { month: 'Apr', consumption: 22 },
    { month: 'May', consumption: 20 },
    { month: 'Jun', consumption: 25 },
];

export default function ClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const client = MOCK_CLIENTS.find(c => c.id === parseInt(id)) || MOCK_CLIENTS[0];

    // Mock Bills for this view (merging with generic mock data)
    const [bills, setBills] = useState([
        { id: 'B-101', month: 'June 2026', consumption: 25, amount: 62.50, status: 'unpaid', dueDate: '2026-06-15' },
        { id: 'B-102', month: 'May 2026', consumption: 20, amount: 50.00, status: 'unpaid', dueDate: '2026-05-15' },
        { id: 'B-103', month: 'April 2026', consumption: 22, amount: 55.00, status: 'paid', dueDate: '2026-04-15' },
        { id: 'B-104', month: 'March 2026', consumption: 18, amount: 45.00, status: 'paid', dueDate: '2026-03-15' },
    ]);

    const [showReceipt, setShowReceipt] = useState(false);
    const [lastPayment, setLastPayment] = useState(null);

    const [selectedBills, setSelectedBills] = useState([]);

    const toggleBillSelection = (billId) => {
        if (selectedBills.includes(billId)) {
            setSelectedBills(selectedBills.filter(id => id !== billId));
        } else {
            setSelectedBills([...selectedBills, billId]);
        }
    };

    const totalToPay = bills
        .filter(b => selectedBills.includes(b.id))
        .reduce((sum, b) => sum + b.amount, 0);

    const handlePayment = () => {
        if (selectedBills.length === 0) return;
        if (confirm(`Confirm payment of ${formatCurrency(totalToPay)}?`)) {
            const paidBills = bills.filter(b => selectedBills.includes(b.id));
            setBills(bills.map(b =>
                selectedBills.includes(b.id) ? { ...b, status: 'paid' } : b
            ));

            // Prepare Receipt Data
            setLastPayment({
                date: new Date().toLocaleDateString(),
                amount: totalToPay,
                transactionId: `TRX-${Date.now()}`,
                bills: paidBills
            });

            setSelectedBills([]);
            setShowReceipt(true);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <DashboardLayout title="Client Details">
            <button
                onClick={() => navigate('/admin/clients')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors print:hidden"
            >
                <ArrowLeft size={18} /> Back to Clients
            </button>

            {/* Top Grid: Info & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:hidden">

                {/* Client Info Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{client.name}</h2>
                            <p className="text-sm text-slate-500 font-mono mt-1">{client.meterNo}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {client.status}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-semibold">Address</label>
                            <p className="text-slate-700">{client.address}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-semibold">Type</label>
                            <p className="text-slate-700 capitalize">{client.type}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-semibold">Contact</label>
                            <p className="text-slate-700">{client.contact || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Consumption Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Monthly Consumption Trend</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={GRAPH_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    tickFormatter={(value) => `${value}m³`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="consumption"
                                    fill="#1E40AF"
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Billing Statement Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden print:hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Billing Statement</h3>
                    {selectedBills.length > 0 && (
                        <div className="flex items-center gap-4">
                            <span className="text-slate-600 font-medium">
                                Total: <span className="text-slate-900 font-bold text-lg">{formatCurrency(totalToPay)}</span>
                            </span>
                            <button
                                onClick={handlePayment}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
                            >
                                Pay Selected
                            </button>
                        </div>
                    )}
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 w-12 text-slate-600">
                                {/* Checkbox Header could go here */}
                            </th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Billing Month</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Due Date</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Consumption</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Amount</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bills.map((bill) => (
                            <tr key={bill.id} className={`border-b border-slate-100 transition-colors ${bill.status === 'unpaid' ? 'hover:bg-blue-50/50' : ''}`}>
                                <td className="p-4">
                                    {bill.status === 'unpaid' && (
                                        <input
                                            type="checkbox"
                                            checked={selectedBills.includes(bill.id)}
                                            onChange={() => toggleBillSelection(bill.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    )}
                                </td>
                                <td className="p-4 font-medium text-slate-800">{bill.month}</td>
                                <td className="p-4 text-sm text-slate-500">{bill.dueDate}</td>
                                <td className="p-4 text-sm text-slate-600">{bill.consumption} m³</td>
                                <td className="p-4 font-mono font-medium text-slate-700">{formatCurrency(bill.amount)}</td>
                                <td className="p-4">
                                    {bill.status === 'paid' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 capitalize">
                                            <Check size={12} /> Paid
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 capitalize">
                                            <AlertCircle size={12} /> Unpaid
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Receipt Modal */}
            {showReceipt && lastPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:static print:bg-white print:p-0">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in fade-in duration-200 print:shadow-none print:w-full print:max-w-none">
                        <div className="p-8 text-center border-b-2 border-dashed border-slate-200">
                            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest">OFFICIAL RECEIPT</h3>
                            <p className="text-xs text-slate-500 mt-1">Nagcarlan Water Billing Analytics</p>
                            <p className="text-xs text-slate-500">Nagcarlan, Laguna</p>
                        </div>

                        <div className="p-8 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Date:</span>
                                <span className="font-mono">{lastPayment.date}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Transaction ID:</span>
                                <span className="font-mono text-xs">{lastPayment.transactionId}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Billed To:</span>
                                <span className="font-medium">{client.name}</span>
                            </div>

                            <div className="border-t border-slate-100 my-4 pt-4">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Payment Details</p>
                                {lastPayment.bills.map(b => (
                                    <div key={b.id} className="flex justify-between text-sm mb-1">
                                        <span>Bill {b.month}</span>
                                        <span className="font-mono">{formatCurrency(b.amount)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t-2 border-slate-900 pt-4 flex justify-between items-center">
                                <span className="font-bold text-lg">TOTAL PAID</span>
                                <span className="font-bold text-xl font-mono">{formatCurrency(lastPayment.amount)}</span>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 flex gap-3 print:hidden">
                            <button
                                onClick={() => setShowReceipt(false)}
                                className="flex-1 py-3 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex-1 py-3 bg-blue-900 text-white hover:bg-blue-800 rounded-lg font-medium shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
