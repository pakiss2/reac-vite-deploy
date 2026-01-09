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
    UserPlus,
    Users as UsersIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import DashboardLayout from '../components/DashboardLayout';
import { MOCK_BILLS, MOCK_CLIENTS } from '../lib/mockData';
import { formatCurrency } from '../lib/billing';

export default function AdminDashboard() {
    // 1. Calculate Statistics
    const currentMonth = 'June 2026';

    // Revenue
    const thisMonthBills = MOCK_BILLS.filter(b => b.month === currentMonth);
    const revenue = thisMonthBills
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + b.amount, 0);

    // Active Clients
    const activeClients = MOCK_CLIENTS.filter(c => c.status === 'active').length;
    const newClients = MOCK_CLIENTS.filter(c => c.id > 1020).length; // Mock "new" metric

    // Consumption
    const totalConsumption = thisMonthBills.reduce((sum, b) => sum + b.consumption, 0);

    // Overdue
    const overdueBills = MOCK_BILLS.filter(b => b.status === 'unpaid');
    const overdueAmount = overdueBills.reduce((sum, b) => sum + b.amount, 0);

    // 2. Prepare Chart Data (Group by Month)
    const chartDataMap = {};
    MOCK_BILLS.forEach(bill => {
        const month = bill.month.split(' ')[0]; // "June" from "June 2026"
        if (!chartDataMap[month]) {
            chartDataMap[month] = 0;
        }
        chartDataMap[month] += bill.consumption;
    });

    // Sort broadly by know month order or just use keys if simple
    const monthOrder = { 'April': 1, 'May': 2, 'June': 3 };
    const chartData = Object.keys(chartDataMap)
        .sort((a, b) => monthOrder[a] - monthOrder[b])
        .map(month => ({
            name: month,
            consumption: chartDataMap[month]
        }));

    // 3. Recent Activities (Paid Bills)
    const recentPayments = MOCK_BILLS
        .filter(b => b.status === 'paid' && b.paidDate)
        .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
        .slice(0, 5)
        .map(bill => {
            const client = MOCK_CLIENTS.find(c => c.id === bill.clientId);
            return {
                title: `Payment Received - ${client?.name || 'Unknown'}`,
                desc: `Paid bill for ${bill.month}`,
                amount: bill.amount,
                time: bill.paidDate,
                type: 'payment'
            };
        });

    return (
        <DashboardLayout title="Dashboard">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Revenue (June)"
                    value={formatCurrency(revenue)}
                    trend="+8.2% from last month"
                    icon={DollarSign}
                />
                <StatCard
                    title="Active Clients"
                    value={activeClients}
                    trend={`+${newClients} new this month`}
                    icon={UsersIcon}
                />
                <StatCard
                    title="Total Consumption"
                    value={`${totalConsumption} m³`}
                    trend="Average 24 m³ / client"
                    icon={Droplets}
                />
                <StatCard
                    title="Overdue Bills"
                    value={overdueBills.length}
                    trend={`Totaling ${formatCurrency(overdueAmount)}`}
                    icon={AlertCircle}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Total Consumption Overview</h3>
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
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    tickFormatter={(value) => `${value} m³`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="consumption"
                                    fill="#1E40AF"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activities</h3>
                    <div className="space-y-6">
                        {recentPayments.map((activity, i) => (
                            <ActivityItem
                                key={i}
                                icon={DollarSign}
                                bgColor="bg-blue-100"
                                iconColor="text-blue-600"
                                title={activity.title}
                                desc={activity.desc}
                                time={activity.time}
                            />
                        ))}
                        <ActivityItem
                            icon={UserPlus}
                            bgColor="bg-indigo-100"
                            iconColor="text-indigo-600"
                            title="New Client Registered"
                            desc="System Generated"
                            time="2026-06-05"
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ title, value, trend, icon: Icon }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-slate-500 text-xs font-medium uppercase tracking-wider">{title}</h3>
                    <p className="text-2xl font-bold text-slate-800 mt-2">{value}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Icon size={18} />
                </div>
            </div>
            <p className="text-xs text-slate-400">{trend}</p>
        </div>
    )
}

function ActivityItem({ icon: Icon, bgColor, iconColor, title, desc, time }) {
    return (
        <div className="flex gap-4">
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
