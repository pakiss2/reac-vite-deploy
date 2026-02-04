import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Download, Calendar, RefreshCw, Activity, Search } from 'lucide-react';
import { formatCurrency, calculatePenalty } from '../lib/billing';
import { downloadCSV } from '../lib/csv';

export default function Reports() {
    const { user } = useAuth();
    const { bills: contextBills, clients: contextClients, penaltySettings, lastUpdated } = useData();
    const MOCK_BILLS = Array.isArray(contextBills) ? contextBills : [];
    const MOCK_CLIENTS = Array.isArray(contextClients) ? contextClients : [];

    // Default to current year-month
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const filterType = searchParams.get('filter'); // 'unpaid'

    // Visual feedback for updates
    useEffect(() => {
        setIsSyncing(true);
        const timer = setTimeout(() => setIsSyncing(false), 800);
        return () => clearTimeout(timer);
    }, [lastUpdated]);

    // 1. Join Bills with Client Data
    const joinedBills = useMemo(() => {
        return MOCK_BILLS.map(bill => {
            const client = MOCK_CLIENTS.find(c => c.id === bill.clientId);
            const penalty = bill.status === 'unpaid' ? calculatePenalty(bill.amount, bill.dueDate, penaltySettings) : 0;
            return {
                ...bill,
                penalty,
                total: bill.amount + penalty,
                clientName: client ? client.name : 'Unknown Client',
                clientAddress: client ? client.address : 'Unknown Address',
                meterNo: client ? client.meterNo : 'N/A'
            };
        });
    }, [MOCK_BILLS, MOCK_CLIENTS, penaltySettings]);

    // 2. Filter by Month and Search
    const filteredBills = useMemo(() => {
        return joinedBills.filter(bill => {
            const matchesMonth = filterType === 'unpaid' ? true : bill.date.startsWith(selectedMonth);
            const matchesStatus = filterType === 'unpaid' ? bill.status === 'unpaid' : true;
            const matchesSearch = bill.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bill.clientAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bill.meterNo.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesMonth && matchesStatus && matchesSearch;
        });
    }, [joinedBills, selectedMonth, searchTerm, filterType]);

    const handleExport = () => {
        const exportData = filteredBills.map(bill => ({
            'Client Name': bill.clientName,
            'Address': bill.clientAddress,
            'Meter No': bill.meterNo,
            'Bill Date': bill.date,
            'Due Date': bill.dueDate,
            'Consumption (m³)': bill.consumption,
            'Amount (PHP)': bill.amount,
            'Penalty (PHP)': bill.penalty,
            'Total (PHP)': bill.total,
            'Status': bill.status,
            'Paid Time': bill.status === 'paid' && bill.paidDate ? new Date(bill.paidDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
        }));

        downloadCSV(exportData, `billing-report-${selectedMonth}.csv`);
    };

    // 3. Calc Totals
    const totalAmount = filteredBills.reduce((sum, b) => sum + b.total, 0);
    const totalCollected = filteredBills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount + (b.penaltyPaid || 0), 0);
    const totalUnpaid = filteredBills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.amount + b.penalty, 0);
    const totalConsumption = filteredBills.reduce((sum, b) => sum + (parseFloat(b.consumption) || 0), 0);

    const paidCount = filteredBills.filter(b => b.status === 'paid').length;
    const unpaidCount = filteredBills.filter(b => b.status === 'unpaid').length;

    return (
        <DashboardLayout title="Reports">

            {/* Header / Status Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Monthly Billing Summary</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`h-2 w-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase tracking-tighter">
                            {isSyncing ? 'Processing Update...' : 'Live System Connectivity'}
                            <span className="mx-1 opacity-30">•</span>
                            Sync Ref: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <Calendar size={16} className="text-blue-600" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => {
                                setSelectedMonth(e.target.value);
                                if (searchParams.get('filter')) setSearchParams({});
                            }}
                            className="outline-none text-slate-700 text-sm font-bold bg-transparent"
                        />
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search name or address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-48 transition-all focus:w-64"
                        />
                    </div>

                    {user?.role !== 'superadmin' && (
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-all text-sm font-bold shadow-sm hover:shadow-md active:scale-95"
                        >
                            <Download size={16} /> Export CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SummaryCard
                    label="Total Billed"
                    value={formatCurrency(totalAmount)}
                    subtext={`${filteredBills.length} invoices generated`}
                    color="text-slate-800"
                    isUpdating={isSyncing}
                />

                <SummaryCard
                    label="Collected Amount"
                    value={formatCurrency(totalCollected)}
                    subtext={`${paidCount} payments received`}
                    color="text-green-600"
                    isUpdating={isSyncing}
                />

                <SummaryCard
                    label="Outstanding Balance"
                    value={formatCurrency(totalUnpaid)}
                    subtext={`${unpaidCount} pending payments`}
                    color="text-red-500"
                    isUpdating={isSyncing}
                />

                <SummaryCard
                    label="Total Consumption"
                    value={`${totalConsumption.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³`}
                    subtext="Total volume utilized"
                    color="text-blue-600"
                    isUpdating={isSyncing}
                />
            </div>

            {/* Report Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <th className="p-4">Client Detail</th>
                                <th className="p-4 text-center">Bill Date</th>
                                <th className="p-4 text-center">Due Date</th>
                                <th className="p-4 text-center">Consumption</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Updated At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBills.length > 0 ? filteredBills.map((bill) => (
                                <tr key={bill.id} className="border-b border-slate-50 hover:bg-blue-50/40 transition-all group animate-in fade-in duration-500">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 group-hover:text-blue-900 transition-colors text-sm">{bill.clientName}</div>
                                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{bill.clientAddress}</div>
                                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{bill.meterNo}</div>
                                    </td>
                                    <td className="p-4 text-xs text-slate-500 text-center font-mono">{bill.date}</td>
                                    <td className="p-4 text-xs text-slate-500 text-center font-mono">{bill.dueDate}</td>
                                    <td className="p-4 text-xs text-slate-600 text-center font-bold">
                                        {(parseFloat(bill.consumption) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        <span className="text-[9px] font-normal text-slate-400 ml-1">m³</span>
                                    </td>
                                    <td className="p-4 font-mono font-black text-slate-700 text-right text-xs">{formatCurrency(bill.amount)}</td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${bill.status === 'paid'
                                            ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20'
                                            : 'bg-red-100 text-red-700 ring-1 ring-red-600/20'
                                            }`}>
                                            <div className={`h-1.5 w-1.5 rounded-full ${bill.status === 'paid' ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
                                            {bill.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-slate-500 font-bold font-mono text-right">
                                        {bill.status === 'paid' && bill.paidDate
                                            ? new Date(bill.paidDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : '--:--'
                                        }
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-400">
                                            <RefreshCw size={48} className="animate-spin opacity-10" />
                                            <div className="space-y-1">
                                                <p className="font-black text-xl text-slate-300 uppercase tracking-tighter">No live records found</p>
                                                <p className="text-sm">New payments for {selectedMonth} will appear here instantly.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}

function SummaryCard({ label, value, subtext, color, isUpdating }) {
    return (
        <div className={`bg-white p-6 rounded-xl border border-slate-100 shadow-sm transition-all duration-500 overflow-hidden relative group ${isUpdating ? 'scale-[1.02] shadow-xl border-blue-400/30' : ''}`}>
            {isUpdating && (
                <div className="absolute top-0 right-0 p-2">
                    <Activity size={16} className="text-blue-400 animate-pulse" />
                </div>
            )}
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</h3>
            <div className="relative mt-3">
                <p className={`text-3xl font-black tracking-tighter transition-all duration-700 ${color} ${isUpdating ? 'translate-y-[-2px] blur-[0.5px]' : ''}`}>
                    {value}
                </p>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider group-hover:text-slate-600 transition-colors">{subtext}</span>
            </div>
        </div>
    );
}
