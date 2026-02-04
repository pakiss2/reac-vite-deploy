import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
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
import { X } from 'lucide-react';
// This replacement handles the import update
import { formatCurrency, numberToWords, calculateBillAmount, calculatePenalty, calculateConsumptionFromAmount } from '../lib/billing';


export default function ClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        clients,
        bills: MOCK_BILLS,
        payBills,
        addBill,
        billingSettings,
        penaltySettings
    } = useData();

    const client = clients.find(c => c.id === parseInt(id)) || clients[0];
    const clientBills = MOCK_BILLS.filter(b => b.clientId === client.id);

    const [showReceipt, setShowReceipt] = useState(false);
    const [showAddBillModal, setShowAddBillModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastPayment, setLastPayment] = useState(null);

    const [newBill, setNewBill] = useState({
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        prevReading: 0,
        currReading: '',
        consumption: '',
        targetAmount: ''
    });

    // Extract latest reading for pre-fill
    const latestBill = [...clientBills].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const defaultPrevReading = latestBill ? latestBill.currReading : (client.prevReading || 0);

    // Prepare dynamic chart data from client bills
    const chartData = [...clientBills]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(b => ({
            month: b.month.split(' ')[0].substring(0, 3),
            consumption: b.consumption
        }));

    // Show chart if there's any data
    const showChart = chartData.length > 0;

    const calculatedConsumption = newBill.targetAmount !== ''
        ? parseFloat(calculateConsumptionFromAmount(client.type, parseFloat(newBill.targetAmount) || 0, billingSettings).toFixed(2))
        : newBill.consumption !== ''
            ? parseFloat(parseFloat(newBill.consumption).toFixed(2))
            : parseFloat(Math.max(0, (parseFloat(newBill.currReading) || 0) - (parseFloat(newBill.prevReading) || 0)).toFixed(2));

    const calculatedAmount = newBill.targetAmount !== ''
        ? (parseFloat(newBill.targetAmount) || 0)
        : calculateBillAmount(client.type, calculatedConsumption, billingSettings);

    const [selectedBills, setSelectedBills] = useState([]);
    const [selectedPayBillId, setSelectedPayBillId] = useState('');

    const toggleBillSelection = (billId) => {
        if (selectedBills.includes(billId)) {
            setSelectedBills(selectedBills.filter(id => id !== billId));
        } else {
            setSelectedBills([...selectedBills, billId]);
        }
    };

    const totalToPay = clientBills
        .filter(b => selectedBills.includes(b.id))
        .reduce((sum, b) => {
            const penalty = b.status === 'unpaid' ? calculatePenalty(b.amount, b.dueDate, penaltySettings) : 0;
            return sum + b.amount + penalty;
        }, 0);

    const handlePayment = () => {
        if (selectedBills.length === 0) return;
        if (confirm(`Confirm payment of ${formatCurrency(totalToPay)}?`)) {
            const paidBills = clientBills.filter(b => selectedBills.includes(b.id));

            // Create penalty map for tracking
            const penaltiesMap = {};
            paidBills.forEach(b => {
                penaltiesMap[b.id] = calculatePenalty(b.amount, b.dueDate, penaltySettings);
            });

            payBills(selectedBills, penaltiesMap);

            // Prepare Receipt Data with penalties
            const billsWithPenalties = paidBills.map(b => {
                const penalty = calculatePenalty(b.amount, b.dueDate, penaltySettings);
                return { ...b, penalty, total: b.amount + penalty };
            });

            // Get payment history (all paid bills for this client)
            const paymentHistory = clientBills
                .filter(b => b.status === 'paid' || selectedBills.includes(b.id))
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            // Get most recent payment before this one
            const prevPaidBills = clientBills.filter(b => b.status === 'paid');
            const latestPrevPayment = prevPaidBills.length > 0
                ? [...prevPaidBills].sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))[0]
                : null;

            setLastPayment({
                date: new Date().toLocaleDateString(),
                amount: totalToPay,
                transactionId: `TRX-${Date.now()}`,
                bills: billsWithPenalties,
                recentPayment: latestPrevPayment,
                history: paymentHistory
            });

            setSelectedBills([]);
            setShowReceipt(true);
        }
    };

    const handleQuickPay = () => {
        if (!selectedPayBillId) return;
        const billToPay = clientBills.find(b => b.id === selectedPayBillId);
        if (!billToPay) return;

        const penalty = calculatePenalty(billToPay.amount, billToPay.dueDate, penaltySettings);
        const total = billToPay.amount + penalty;

        if (confirm(`Confirm payment of ${formatCurrency(total)} (incl. ${formatCurrency(penalty)} penalty) for ${billToPay.month}?`)) {
            payBills([selectedPayBillId], { [selectedPayBillId]: penalty });

            // Get payment history
            const paymentHistory = clientBills
                .filter(b => b.status === 'paid' || b.id === selectedPayBillId)
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            // Get most recent payment before this one
            const prevPaidBills = clientBills.filter(b => b.status === 'paid');
            const latestPrevPayment = prevPaidBills.length > 0
                ? [...prevPaidBills].sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))[0]
                : null;

            setLastPayment({
                date: new Date().toLocaleDateString(),
                amount: total,
                transactionId: `TRX-${Date.now()}`,
                bills: [{ ...billToPay, penalty, total }],
                recentPayment: latestPrevPayment,
                history: paymentHistory
            });

            setSelectedPayBillId('');
            setShowReceipt(true);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleAddBill = (e) => {
        e.preventDefault();
        const billId = `B-${client.id}-${newBill.month}`;

        // Check if bill for this month already exists
        if (clientBills.find(b => b.month.includes(newBill.month))) {
            alert("A bill for this month already exists!");
            return;
        }

        const billDate = `${newBill.month}-01`;
        const dueDate = `${newBill.month}-15`;

        // Format month label: "June 2026"
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const [year, month] = newBill.month.split('-');
        const monthLabel = `${monthNames[parseInt(month) - 1]} ${year}`;

        addBill({
            id: billId,
            clientId: client.id,
            date: billDate,
            month: monthLabel,
            dueDate: dueDate,
            prevReading: parseFloat(newBill.prevReading),
            currReading: parseFloat(newBill.currReading),
            consumption: calculatedConsumption,
            amount: calculatedAmount,
            status: 'unpaid',
            paidAmount: 0,
            paidDate: null
        });

        // Auto-select the new bill for payment
        setSelectedBills(prev => [...prev, billId]);

        // Feedback & Advancement
        setShowAddBillModal(false);
        setNewBill(prev => {
            const [year, month] = prev.month.split('-');
            const date = new Date(parseInt(year), parseInt(month), 1); // This naturally rolls to next month
            const nextMonth = date.toISOString().slice(0, 7);
            return {
                ...prev,
                month: nextMonth,
                currReading: '',
                consumption: '',
                targetAmount: ''
            };
        });

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const openAddBillModal = () => {
        setNewBill(prev => ({
            ...prev,
            prevReading: parseFloat(defaultPrevReading).toFixed(2)
        }));
        setShowAddBillModal(true);
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
                            <h2 className="text-xl font-bold text-slate-800">{client.address}</h2>
                            <p className="text-sm text-slate-500 font-mono mt-1">{client.meterNo}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {client.status}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-semibold">Account Holder</label>
                            <p className="text-slate-700">{client.name}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-semibold">Type</label>
                            <p className="text-slate-700 capitalize">{client.type}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-semibold">Contact No.</label>
                            <p className="text-slate-700">{client.contactNo || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-semibold">Email Address</label>
                            <p className="text-slate-700">{client.email || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-semibold">Payment Schedule</label>
                            <p className="text-slate-700">{client.paymentSchedule || 'Monthly'}</p>
                        </div>
                    </div>
                </div>

                {/* Consumption Chart - Only shown for clients with history */}
                {showChart ? (
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-500">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Monthly Consumption Trend</h3>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
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
                ) : (
                    <div className="lg:col-span-2 bg-white p-8 rounded-xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <BarChart className="text-slate-300" size={24} />
                        </div>
                        <h3 className="font-bold text-slate-700">No Consumption Data Yet</h3>
                        <p className="text-sm text-slate-400 mt-1 max-w-[280px]">Consumption trends will automatically appear here once more billing history is recorded.</p>
                    </div>
                )}
            </div>

            {/* Billing Statement Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden print:hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Billing Statement <span className="text-sm font-normal text-slate-500">({client.paymentSchedule || 'Monthly'})</span></h3>

                    <div className="flex items-center gap-4">
                        {selectedBills.length > 0 ? (
                            <>
                                <span className="text-slate-600 font-medium">
                                    Total: <span className="text-slate-900 font-bold text-lg">{formatCurrency(totalToPay)}</span>
                                </span>
                                {user?.role !== 'superadmin' && (
                                    <button
                                        onClick={handlePayment}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
                                    >
                                        Pay Selected
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedPayBillId}
                                    onChange={(e) => setSelectedPayBillId(e.target.value)}
                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                >
                                    <option value="">Select unpaid month...</option>
                                    {clientBills.filter(b => b.status === 'unpaid').map(b => {
                                        const penalty = calculatePenalty(b.amount, b.dueDate, penaltySettings);
                                        return (
                                            <option key={b.id} value={b.id}>
                                                {b.month} - {formatCurrency(b.amount + penalty)}
                                            </option>
                                        );
                                    })}
                                </select>
                                {user?.role !== 'superadmin' && (
                                    <>
                                        <button
                                            onClick={handleQuickPay}
                                            disabled={!selectedPayBillId}
                                            className="bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
                                        >
                                            Pay This Bill
                                        </button>
                                        <button
                                            onClick={openAddBillModal}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
                                        >
                                            Generate New Bill
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
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
                            <th className="p-4 font-medium text-slate-600 text-sm">Penalty</th>
                            <th className="p-4 font-medium text-slate-600 text-sm text-right">Total</th>
                            <th className="p-4 font-medium text-slate-600 text-sm">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientBills.map((bill) => {
                            const penalty = bill.status === 'unpaid' ? calculatePenalty(bill.amount, bill.dueDate, penaltySettings) : 0;
                            const totalAmount = bill.amount + penalty;

                            return (
                                <tr key={bill.id} className={`border-b border-slate-100 transition-colors ${bill.status === 'unpaid' ? 'hover:bg-blue-50/50' : ''}`}>
                                    <td className="p-4">
                                        {bill.status === 'unpaid' && user?.role !== 'superadmin' && (
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
                                    <td className="p-4 text-sm text-slate-600">
                                        {(parseFloat(bill.consumption) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">{formatCurrency(bill.amount)}</td>
                                    <td className="p-4 text-sm text-red-500 font-medium">
                                        {penalty > 0 ? formatCurrency(penalty) : '-'}
                                    </td>
                                    <td className="p-4 font-mono font-bold text-slate-700 text-right">{formatCurrency(totalAmount)}</td>
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
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Receipt Modal */}
            {showReceipt && lastPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:static print:bg-white print:p-0">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in fade-in duration-200 print:shadow-none print:w-full print:max-w-none print:overflow-visible">

                        <div className="p-8 print:p-0 font-serif text-slate-900">
                            {/* Main Border Box */}
                            <div className="border-2 border-black h-full flex flex-col">

                                {/* Header */}
                                <div className="flex border-b-2 border-black min-h-[140px]">
                                    {/* Left Seal/Text Area */}
                                    <div className="w-[40%] border-r-2 border-black p-2 flex flex-col justify-between">
                                        <p className="text-[10px]">Accountable Form No. 51-C<br />Revised January, 1992</p>
                                        <div className="flex justify-center items-center flex-1">
                                            {/* Placeholder for Seal */}
                                            <div className="w-16 h-16 rounded-full border border-slate-300 flex items-center justify-center text-[8px] text-center text-slate-400">
                                                (Official Seal)
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Header Area */}
                                    <div className="w-[60%] flex flex-col">
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
                                            <h4 className="font-bold text-sm">Official Receipt<br />of the<br />Republic of the Philippines</h4>
                                        </div>
                                        <div className="border-t-2 border-black flex">
                                            <div className="w-16 border-r-2 border-black flex items-center justify-center font-bold text-xl p-1 bg-slate-50">
                                                No
                                            </div>
                                            <div className="flex-1 p-2 font-mono text-xl text-red-600 font-bold flex items-center justify-center">
                                                {/* Mock Receipt No. derived from Trans ID or random */}
                                                3863{lastPayment.transactionId.slice(-3)} E
                                            </div>
                                        </div>
                                        <div className="border-t-2 border-black flex">
                                            <div className="w-16 border-r-2 border-black text-xs p-1 flex items-center">Date</div>
                                            <div className="flex-1 p-1 pl-2 font-mono">{new Date(lastPayment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Agency / Fund */}
                                <div className="flex border-b-2 border-black text-xs">
                                    <div className="w-[15%] p-1 border-r border-black">Agency</div>
                                    <div className="w-[50%] p-1 border-r border-black font-bold uppercase text-center">NAGCARLAN WATER DISTRICT</div>
                                    <div className="w-[10%] p-1 border-r border-black">Fund</div>
                                    <div className="w-[25%] p-1">General</div>
                                </div>

                                {/* Payor */}
                                <div className="flex border-b-2 border-black text-xs">
                                    <div className="w-[15%] p-1 border-r border-black">Payor</div>
                                    <div className="flex-1 p-1 uppercase font-bold pl-4">{client.name}</div>
                                </div>

                                {/* Table Header */}
                                <div className="flex border-b-2 border-black text-center text-xs font-bold bg-slate-50">
                                    <div className="w-[50%] p-1 border-r border-black">Nature of Collection</div>
                                    <div className="w-[20%] p-1 border-r border-black">Account Code</div>
                                    <div className="w-[30%] p-1">Amount</div>
                                </div>

                                {/* Table Body */}
                                <div className="flex-1 min-h-[200px] flex text-xs relative">
                                    {/* Col 1 */}
                                    <div className="w-[50%] border-r border-black p-2 space-y-1">
                                        {lastPayment.bills.map(b => (
                                            <div key={b.id} className="space-y-1">
                                                <div className="flex justify-between font-bold">
                                                    <span>Water Bill - {b.month}</span>
                                                </div>
                                                <div className="text-[10px] grid grid-cols-2 gap-x-2 text-slate-700 bg-slate-50 p-1 rounded">
                                                    <span>Prev: {b.prevReading}</span>
                                                    <span>Curr: {b.currReading}</span>
                                                    <span className="col-span-2 font-semibold">
                                                        Total Cons: {(parseFloat(b.consumption) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³
                                                    </span>
                                                </div>
                                                {b.penalty > 0 && (
                                                    <div className="flex justify-between text-[10px] text-red-600 italic pl-1">
                                                        <span>• Penalty ({b.month})</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Col 2 */}
                                    <div className="w-[20%] border-r border-black p-2 text-center space-y-1">
                                        {lastPayment.bills.map(b => (
                                            <div key={b.id} className="space-y-1">
                                                <div>606</div>
                                                {b.penalty > 0 && <div className="text-[10px]">607</div>}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Col 3 */}
                                    <div className="w-[30%] flex relative">
                                        <div className="w-8 border-r border-black h-full flex items-start justify-center pt-2">P</div>
                                        <div className="flex-1 p-2 text-right space-y-1">
                                            {lastPayment.bills.map(b => (
                                                <div key={b.id} className="space-y-1">
                                                    <div>{formatCurrency(b.amount).replace('₱', '')}</div>
                                                    {b.penalty > 0 && <div className="text-[10px]">{formatCurrency(b.penalty).replace('₱', '')}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Total Line Absolute Positioned at Bottom */}
                                    <div className="absolute bottom-0 w-full flex border-t border-black h-8 items-center">
                                        <div className="w-[70%] text-center font-bold border-r border-black h-full flex items-center justify-center">TOTAL</div>
                                        <div className="w-[30%] flex h-full">
                                            <div className="w-8 border-r border-black h-full flex items-center justify-center">P</div>
                                            <div className="flex-1 pr-2 text-right flex items-center justify-end font-bold">
                                                {formatCurrency(lastPayment.amount).replace('₱', '')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount in words */}
                                <div className="border-t-2 border-black min-h-[40px] flex flex-col text-xs">
                                    <div className="p-1 pl-2 font-semibold">Amount in Words</div>
                                    <div className="flex-1 flex items-center justify-center font-bold italic px-4 text-center">
                                        {numberToWords(lastPayment.amount)}
                                    </div>
                                </div>

                                {/* Summary of Monthly Payments & Recent Payment */}
                                <div className="border-t-2 border-black flex text-[9px]">
                                    <div className="w-[60%] border-r border-black p-1">
                                        <p className="font-bold border-b border-black mb-1 text-[10px]">MONTHLY PAYMENT RECORD</p>
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-black">
                                                    <th>Month</th>
                                                    <th>Date Paid</th>
                                                    <th>Consumption</th>
                                                    <th className="text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lastPayment.history.slice(0, 4).map(h => (
                                                    <tr key={h.id}>
                                                        <td>{h.month.split(' ')[0].substring(0, 3)} {h.month.split(' ')[1]}</td>
                                                        <td>{h.paidDate || h.date}</td>
                                                        <td>{(parseFloat(h.consumption) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}m³</td>
                                                        <td className="text-right">{formatCurrency(h.amount + (h.penalty || 0)).replace('₱', '')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="w-[40%] p-1 flex flex-col justify-center">
                                        <p className="font-bold text-[10px] mb-1">RECENT PAYMENT INFO</p>
                                        {lastPayment.recentPayment ? (
                                            <div className="space-y-1 bg-slate-50 p-1 rounded">
                                                <div className="flex justify-between">
                                                    <span>Last Date:</span>
                                                    <span className="font-mono">{lastPayment.recentPayment.paidDate || lastPayment.recentPayment.date}</span>
                                                </div>
                                                <div className="flex justify-between font-bold">
                                                    <span>Last Amount:</span>
                                                    <span>{formatCurrency(lastPayment.recentPayment.amount + (lastPayment.recentPayment.penalty || 0))}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="italic text-slate-500">No previous payment.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Footer (Checkboxes / Bank / Signature) */}
                                <div className="border-t-2 border-black min-h-[100px] flex">
                                    {/* Left Side */}
                                    <div className="w-[50%] border-r-2 border-black p-2 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border border-black flex items-center justify-center text-[10px]">✓</div>
                                            <span className="text-xs">Cash</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border border-black"></div>
                                            <span className="text-xs">Check</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border border-black"></div>
                                            <span className="text-xs">Money Order</span>
                                        </div>
                                    </div>

                                    {/* Right Side */}
                                    <div className="w-[50%] flex flex-col">
                                        <div className="flex-1 border-b border-black p-2 text-xs">
                                            Received the amount stated above.
                                        </div>
                                        <div className="h-16 flex flex-col items-center justify-end p-2">
                                            <div className="w-full border-b border-black"></div>
                                            <div className="text-xs pt-1">Collecting Officer</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Note */}
                                <div className="border-t-2 border-black p-1 text-[9px] text-center">
                                    NOTE: Write the number and date of this receipt on the back of check or money order received.
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 bg-slate-50 flex gap-3 print:hidden">
                            <button
                                onClick={() => setShowReceipt(false)}
                                className="flex-1 py-3 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                            {user?.role !== 'superadmin' && (
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 py-3 bg-blue-900 text-white hover:bg-blue-800 rounded-lg font-medium shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    Print Receipt
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Add Bill Modal */}
            {showAddBillModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in fade-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-slate-800">Generate New Bill</h3>
                            <button onClick={() => setShowAddBillModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddBill} className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Billing Month</label>
                                <input
                                    required
                                    type="month"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={newBill.month}
                                    onChange={e => setNewBill({ ...newBill, month: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Previous Reading</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 outline-none"
                                        value={newBill.prevReading}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setNewBill(prev => ({
                                                ...prev,
                                                prevReading: val,
                                                currReading: prev.consumption !== '' ? ((parseFloat(val) || 0) + (parseFloat(prev.consumption) || 0)).toFixed(2) : prev.currReading
                                            }));
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Current Reading</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={newBill.currReading}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setNewBill(prev => ({
                                                ...prev,
                                                currReading: val,
                                                consumption: '', // Reset direct inputs
                                                targetAmount: ''
                                            }));
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Direct Consumption (m³)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Consumption..."
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                        value={newBill.consumption}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setNewBill(prev => ({
                                                ...prev,
                                                consumption: val,
                                                targetAmount: '',
                                                currReading: val !== '' ? ((parseFloat(prev.prevReading) || 0) + (parseFloat(val) || 0)).toFixed(2) : ''
                                            }));
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Target Amount (PHP)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Amount..."
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                        value={newBill.targetAmount}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const cons = val !== '' ? calculateConsumptionFromAmount(client.type, parseFloat(val) || 0, billingSettings) : '';
                                            setNewBill(prev => ({
                                                ...prev,
                                                targetAmount: val,
                                                consumption: '',
                                                currReading: cons !== '' ? ((parseFloat(prev.prevReading) || 0) + parseFloat(cons)).toFixed(2) : ''
                                            }));
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-blue-600">Consumption:</span>
                                    <span className="font-bold text-blue-900">{calculatedConsumption.toFixed(2)} m³</span>
                                </div>
                                <div className="flex justify-between text-base">
                                    <span className="text-blue-600 font-medium">Total Amount:</span>
                                    <span className="font-bold text-blue-900">{formatCurrency(calculatedAmount)}</span>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddBillModal(false)}
                                    className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={calculatedConsumption < 0}
                                    className="flex-1 py-2 bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium shadow-sm transition-colors"
                                >
                                    Generate Bill
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Success Notification */}
            {showSuccess && (
                <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 z-50">
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                    </div>
                    <p className="font-semibold text-sm">Bill generated successfully!</p>
                </div>
            )}
        </DashboardLayout>
    );
}
