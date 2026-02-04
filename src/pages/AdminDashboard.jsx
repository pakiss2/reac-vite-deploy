import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import {
    FileText,
    DollarSign,
    Droplets,
    AlertCircle,
    Users,
    Activity,
    Calendar // Added Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { formatCurrency, calculatePenalty } from '../lib/billing';
import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { bills: contextBills, clients: contextClients, penaltySettings, lastUpdated } = useData();
    const bills = Array.isArray(contextBills) ? contextBills : [];
    const clients = Array.isArray(contextClients) ? contextClients : [];
    const [isSyncing, setIsSyncing] = useState(false);

    // Default to current month
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        setIsSyncing(true);
        const timer = setTimeout(() => setIsSyncing(false), 800);
        return () => clearTimeout(timer);
    }, [lastUpdated, selectedMonth]);

    // 1. Calculate Statistics based on Selected Month
    const {
        thisMonthBills,
        prevMonthBills,
        revenue,
        revenueTrend,
        totalConsumption,
        consumptionTrend,
        overdueBills,
        overdueAmount,
        monthlyCollections,
        chartData,
        topConsumers,
        recentActivities,
        displayMonth
    } = useMemo(() => {
        // Helper to get previous month string
        const [y, m] = selectedMonth.split('-').map(Number);
        const prevDate = new Date(y, m - 1 - 1); // Subtract 1 month
        const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

        // Get Display Month Name (e.g., "December 2026")
        const dateObj = new Date(y, m - 1);
        const displayMonthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

        // Filter Bills
        const currentBills = bills.filter(b => b.date.startsWith(selectedMonth));
        const previousBills = bills.filter(b => b.date.startsWith(prevMonthStr));

        // Revenue (Total Billed)
        const calcRevenue = (billList) => billList.reduce((sum, b) => {
            const penalty = b.status === 'paid' ? (b.penaltyPaid || 0) : calculatePenalty(b.amount, b.dueDate, penaltySettings);
            return sum + b.amount + penalty;
        }, 0);

        const currentRevenue = calcRevenue(currentBills);
        const previousRevenue = calcRevenue(previousBills);
        const revTrendVal = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        const revTrendStr = previousRevenue > 0 ? `${revTrendVal.toFixed(1)}%` : 'New';

        // Consumption
        const currentConsumption = currentBills.reduce((sum, b) => sum + (parseFloat(b.consumption) || 0), 0);
        const previousConsumption = previousBills.reduce((sum, b) => sum + (parseFloat(b.consumption) || 0), 0);
        const consTrendVal = previousConsumption > 0 ? ((currentConsumption - previousConsumption) / previousConsumption) * 100 : 0;
        const consTrendStr = previousConsumption > 0 ? `${consTrendVal.toFixed(1)}%` : 'New';

        // Overdue (Bills from this month that are unpaid)
        const overdue = currentBills.filter(b => b.status === 'unpaid');
        const overdueAmt = overdue.reduce((sum, b) => {
            const penalty = calculatePenalty(b.amount, b.dueDate, penaltySettings);
            return sum + b.amount + penalty;
        }, 0);

        // Collections (Payments made in the selected month)
        const collections = bills.filter(b => {
            if (b.status !== 'paid' || !b.paidDate) return false;
            return b.paidDate.startsWith(selectedMonth);
        }).reduce((sum, b) => sum + b.amount + (b.penaltyPaid || 0), 0);

        // Chart Data (Show 6 month window ending at selected month)
        const chartDataMap = {};
        const rangeMonths = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(y, m - 1 - i);
            rangeMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        bills.forEach(bill => {
            const monthKey = bill.date.substring(0, 7);
            if (!rangeMonths.includes(monthKey)) return;

            const monthLabel = bill.month;
            if (!chartDataMap[monthKey]) {
                chartDataMap[monthKey] = { label: monthLabel, revenue: 0, consumption: 0, date: new Date(bill.date) };
            }
            const penalty = bill.status === 'paid' ? (bill.penaltyPaid || 0) : calculatePenalty(bill.amount, bill.dueDate, penaltySettings);
            chartDataMap[monthKey].revenue += (bill.amount + penalty);
            chartDataMap[monthKey].consumption += (parseFloat(bill.consumption) || 0);
        });

        const chart = rangeMonths.map(key => {
            const d = chartDataMap[key];
            if (d) {
                return {
                    name: d.label,
                    revenue: d.revenue,
                    consumption: d.consumption
                };
            }
            const [yr, mo] = key.split('-').map(Number);
            const label = new Date(yr, mo - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
            return { name: label, revenue: 0, consumption: 0 };
        });

        // Top Consumers (In selected month)
        const top = clients.map(client => {
            const clientBills = currentBills.filter(b => b.clientId === client.id);
            const total = clientBills.reduce((sum, b) => sum + (parseFloat(b.consumption) || 0), 0);
            return { ...client, totalConsumption: total };
        })
            .filter(c => c.totalConsumption > 0)
            .sort((a, b) => b.totalConsumption - a.totalConsumption)
            .slice(0, 5);

        // Recent Activities (In selected month)
        const activities = bills
            .filter(b => b.status === 'paid' && b.paidDate && b.paidDate.startsWith(selectedMonth))
            .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
            .slice(0, 5)
            .map(b => {
                const client = clients.find(c => c.id === b.clientId);
                return {
                    id: b.id,
                    client: client ? client.name : 'Unknown',
                    amount: b.amount + (b.penaltyPaid || 0),
                    date: b.paidDate,
                    type: 'Payment Received'
                };
            });

        return {
            thisMonthBills: currentBills,
            prevMonthBills: previousBills,
            revenue: currentRevenue,
            revenueTrend: revTrendStr,
            totalConsumption: currentConsumption,
            consumptionTrend: consTrendStr,
            overdueBills: overdue,
            overdueAmount: overdueAmt,
            monthlyCollections: collections,
            chartData: chart,
            topConsumers: top,
            recentActivities: activities,
            displayMonth: displayMonthName
        };

    }, [bills, clients, selectedMonth, penaltySettings]);


    return (
        <DashboardLayout title="Dashboard">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Operational Overview</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]'}`} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {isSyncing ? 'Syncing...' : 'Live System'}
                            <span className="mx-1 opacity-20">•</span>
                            {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Calendar size={14} className="text-slate-500" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700 font-bold text-[10px] uppercase tracking-wider">
                        <Activity size={14} className={isSyncing ? 'animate-pulse' : ''} />
                        Real-time Active
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                <StatCard
                    title={`Collected (${displayMonth})`}
                    value={formatCurrency(monthlyCollections)}
                    trend="Based on payment date"
                    trendUp={true}
                    icon={DollarSign}
                    onClick={() => navigate('/admin/reports')}
                />
                <StatCard
                    title={`Consumption of ${displayMonth}`}
                    value={`${totalConsumption.toLocaleString()} m³`}
                    trend={consumptionTrend.includes('-') ? `${consumptionTrend} from last month` : `+${consumptionTrend} from last month`}
                    trendUp={!consumptionTrend.includes('-')}
                    icon={Droplets}
                    onClick={() => navigate('/admin/reports')}
                />
                <StatCard
                    title={`Overdue (${displayMonth})`}
                    value={overdueBills.length}
                    trend={`Totaling ${formatCurrency(overdueAmount)}`}
                    icon={AlertCircle}
                    onClick={() => navigate('/admin/reports?filter=unpaid')}
                />
                <StatCard
                    title="Total Clients"
                    value={clients.length.toLocaleString()}
                    trend="System Wide"
                    trendUp={true}
                    icon={Users}
                    onClick={() => navigate('/admin/clients')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Analysis</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 11 }}
                                    tickFormatter={(value) => `₱${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value, name) => [
                                        name === 'revenue' ? formatCurrency(value) : `${value} m³`,
                                        name.charAt(0).toUpperCase() + name.slice(1)
                                    ]}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="#1E40AF"
                                    radius={[6, 6, 0, 0]}
                                    barSize={20}
                                    name="Revenue (₱)"
                                />
                                <Bar
                                    dataKey="consumption"
                                    fill="#94A3B8"
                                    radius={[6, 6, 0, 0]}
                                    barSize={20}
                                    name="Consumption (m³)"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Side Items: Recent Activity & Top Consumers */}
                <div className="space-y-6">
                    {/* Top Consumers */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 font-mono tracking-tight">Top Consumers</h3>
                        <div className="space-y-4">
                            {topConsumers.map((consumer, idx) => (
                                <div key={consumer.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 line-clamp-1">{consumer.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono uppercase">{consumer.meterNo}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-blue-700">{consumer.totalConsumption.toFixed(1)} <span className="text-[10px] font-medium text-slate-400">m³</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 font-mono tracking-tight">Recent Activity</h3>
                        <div className="space-y-4">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="flex flex-col gap-1 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-bold text-slate-800">{activity.client}</p>
                                        <p className="text-sm font-bold text-green-600">{formatCurrency(activity.amount)}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold">
                                        <span>{activity.type}</span>
                                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ title, value, trend, trendUp, icon: Icon, onClick }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-[140px] transition-all hover:shadow-md",
                onClick && "cursor-pointer hover:border-blue-200 hover:ring-2 hover:ring-blue-500/10 active:scale-[0.98]"
            )}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{title}</h3>
                    <div key={value} className="animate-in fade-in zoom-in-95 duration-500">
                        <p className="text-2xl font-black text-slate-800 mt-2">{value}</p>
                    </div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Icon size={18} />
                </div>
            </div>
            <p className={cn(
                "text-[10px] font-bold uppercase tracking-tight",
                trend === 'New' || trend === 'Updated in real-time' ? "text-slate-400" : (trendUp ? "text-green-600" : "text-red-600")
            )}>
                {trend}
            </p>
        </div>
    )
}

function ActivityItem({ icon: Icon, bgColor, iconColor, title, desc, time }) {
    return (
        <div className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", bgColor)}>
                <Icon size={18} className={iconColor} />
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">{time}</span>
        </div>
    )
}
