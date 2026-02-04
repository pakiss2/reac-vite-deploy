import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
    User,
    Bell,
    Shield,
    Monitor,
    Save,
    Key,
    Database,
    Clock,
    Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency, calculateBillAmount, calculatePenalty, calculateConsumptionFromAmount } from '../lib/billing';
import { Check } from 'lucide-react';

export default function Settings() {
    const { user, updateUser } = useAuth();
    const {
        billingSettings,
        setBillingSettings,
        penaltySettings,
        setPenaltySettings
    } = useData();

    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Local state for forms
    const [subTab, setSubTab] = useState('rates');
    const [localBilling, setLocalBilling] = useState(billingSettings);
    const [localPenalty, setLocalPenalty] = useState(penaltySettings);
    const [localProfile, setLocalProfile] = useState({
        name: user?.name || '',
        username: user?.username || '',
        avatar: user?.avatar || ''
    });

    // Update local state when context changes (e.g. from other tabs)
    // and when the user switches to the billing tab to ensure they see the latest
    useEffect(() => {
        if (activeTab === 'billing') {
            setLocalBilling(billingSettings);
            setLocalPenalty(penaltySettings);
        }
    }, [billingSettings, penaltySettings, activeTab]);

    // Sync local profile when user object changes (e.g., cross-tab updates)
    useEffect(() => {
        if (user) {
            setLocalProfile({
                name: user.name || '',
                username: user.username || '',
                avatar: user.avatar || ''
            });
        }
    }, [user]);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'system', label: 'System', icon: Monitor },
        ...(user?.role === 'superadmin' ? [{ id: 'billing', label: 'Billing Rules', icon: Zap }] : []),
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    const handleSave = () => {
        setIsSaving(true);
        if (activeTab === 'billing') {
            setBillingSettings(localBilling);
            setPenaltySettings(localPenalty);
        } else if (activeTab === 'profile') {
            updateUser({
                name: localProfile.name,
                avatar: localProfile.avatar
            });
        }

        setTimeout(() => {
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 800);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate size (800KB)
            if (file.size > 800 * 1024) {
                setError('Image is too large. Max size is 800KB.');
                setTimeout(() => setError(null), 5000);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalProfile(prev => ({ ...prev, avatar: reader.result }));
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = () => {
        setLocalProfile(prev => ({ ...prev, avatar: '' }));
    };

    return (
        <DashboardLayout title="Settings">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 z-50">
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                    </div>
                    <p className="font-semibold text-sm">Settings saved successfully!</p>
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div className="fixed bottom-8 right-8 bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 z-50">
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                        <Save size={14} className="text-white" />
                    </div>
                    <p className="font-semibold text-sm">{error}</p>
                </div>
            )}
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Sidebar Tabs */}
                <div className="lg:w-64 flex flex-row lg:flex-col gap-1 overflow-x-auto pb-4 lg:pb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-blue-900 text-white shadow-md shadow-blue-900/20"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'billing' && user?.role === 'superadmin' ? (
                        <div className="space-y-6">
                            {/* Sub-tabs like the image */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setSubTab('rates')}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                        subTab === 'rates' ? "bg-white border border-slate-200 text-slate-800 shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    Billing Rates
                                </button>
                                <button
                                    onClick={() => setSubTab('penalty')}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                        subTab === 'penalty' ? "bg-white border border-slate-200 text-slate-800 shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    Penalty Rules
                                </button>
                            </div>

                            {subTab === 'rates' && (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* Residential Rates Card */}
                                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-800">Residential Rates</h3>
                                            <p className="text-sm text-slate-500 mt-1">Set the billing structure for residential clients.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Base Rate (≤ {localBilling.residential.minConsumption} m³)</label>
                                                <input
                                                    type="number"
                                                    value={localBilling.residential.minRate}
                                                    onChange={e => setLocalBilling(prev => ({ ...prev, residential: { ...prev.residential, minRate: parseFloat(e.target.value) } }))}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-900/5 focus:border-blue-900 transition-all text-slate-700"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Tier 1 Rate (&gt; {localBilling.residential.minConsumption}m³ to ≤ {localBilling.residential.tier1Limit}m³)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={localBilling.residential.tier1Rate}
                                                    onChange={e => setLocalBilling(prev => ({ ...prev, residential: { ...prev.residential, tier1Rate: parseFloat(e.target.value) } }))}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-900/5 focus:border-blue-900 transition-all text-slate-700"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Tier 2 Rate (&gt; {localBilling.residential.tier1Limit} m³)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={localBilling.residential.tier2Rate}
                                                    onChange={e => setLocalBilling(prev => ({ ...prev, residential: { ...prev.residential, tier2Rate: parseFloat(e.target.value) } }))}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-900/5 focus:border-blue-900 transition-all text-slate-700"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Commercial Rates Card */}
                                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-800">Commercial Rates</h3>
                                            <p className="text-sm text-slate-500 mt-1">Set the billing structure for commercial clients.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Base Rate (Minimum)</label>
                                                <input
                                                    type="number"
                                                    value={localBilling.commercial.minRate}
                                                    onChange={e => setLocalBilling(prev => ({ ...prev, commercial: { ...prev.commercial, minRate: parseFloat(e.target.value) } }))}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-900/5 focus:border-blue-900 transition-all text-slate-700"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Tier 1 Rate (up to ≤ {localBilling.commercial.tier1Limit}m³)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={localBilling.commercial.tier1Rate}
                                                    onChange={e => setLocalBilling(prev => ({ ...prev, commercial: { ...prev.commercial, tier1Rate: parseFloat(e.target.value) } }))}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-900/5 focus:border-blue-900 transition-all text-slate-700"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Tier 2 Rate (&gt; {localBilling.commercial.tier1Limit} m³)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={localBilling.commercial.tier2Rate}
                                                    onChange={e => setLocalBilling(prev => ({ ...prev, commercial: { ...prev.commercial, tier2Rate: parseFloat(e.target.value) } }))}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-900/5 focus:border-blue-900 transition-all text-slate-700"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {subTab === 'penalty' && (
                                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-slate-800">Penalty Rules</h3>
                                        <p className="text-sm text-slate-500 mt-1">Configure automated late payment charges.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Monthly Increment (e.g. 0.02)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={localPenalty.ratePerMonth}
                                                onChange={e => setLocalPenalty(prev => ({ ...prev, ratePerMonth: parseFloat(e.target.value) }))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-900/5 focus:border-blue-900 transition-all text-slate-700"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Maximum Penalty Rate (e.g. 0.36)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={localPenalty.maxRate}
                                                onChange={e => setLocalPenalty(prev => ({ ...prev, maxRate: parseFloat(e.target.value) }))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-900/5 focus:border-blue-900 transition-all text-slate-700"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Grace period / Max months</label>
                                            <input
                                                type="number"
                                                value={localPenalty.maxMonths}
                                                onChange={e => setLocalPenalty(prev => ({ ...prev, maxMonths: parseInt(e.target.value) }))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-900/5 focus:border-blue-900 transition-all text-slate-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3 text-orange-700 text-sm">
                                        <Clock size={20} className="flex-shrink-0 mt-0.5" />
                                        <p>Nagcarlan specific: Penalty increases every month overdue. Step 1 is 2%, Step 2 is 4%, etc. capped at 36%.</p>
                                    </div>
                                </div>
                            )}

                            {/* Global Save Button at the bottom left like the image */}
                            <div className="pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-8 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8">
                                {activeTab === 'profile' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-1">Public Profile</h3>
                                            <p className="text-sm text-slate-500">Manage your account information and identity.</p>
                                        </div>
                                        <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                                            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-slate-100">
                                                {localProfile.avatar ? (
                                                    <img src={localProfile.avatar} alt="Avatar" className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-blue-600 text-2xl font-bold">
                                                        {user?.name?.substring(0, 2).toUpperCase() || 'ID'}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <input
                                                    type="file"
                                                    id="avatar-upload"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleAvatarChange}
                                                />
                                                <button
                                                    onClick={() => document.getElementById('avatar-upload').click()}
                                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
                                                >
                                                    Change Avatar
                                                </button>
                                                {localProfile.avatar && (
                                                    <button
                                                        onClick={handleRemoveAvatar}
                                                        className="ml-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                                                    >
                                                        Remove Photo
                                                    </button>
                                                )}
                                                <p className="text-xs text-slate-400 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={localProfile.name}
                                                    onChange={e => setLocalProfile(prev => ({ ...prev, name: e.target.value }))}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={localProfile.username}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
                                                    disabled
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-semibold text-slate-700">Role</label>
                                                <div className="px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-blue-700 font-mono text-sm capitalize">
                                                    {user?.role}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'system' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-1">System Preferences</h3>
                                            <p className="text-sm text-slate-500">Global settings for your dashboard experience.</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                                        <Database size={18} className="text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">Auto-Refill Mock Data</p>
                                                        <p className="text-xs text-slate-500">Reset bills when they run out.</p>
                                                    </div>
                                                </div>
                                                <div className="h-6 w-11 bg-blue-600 rounded-full flex items-center px-1">
                                                    <div className="h-4 w-4 bg-white rounded-full translate-x-5" />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                                        <Clock size={18} className="text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">Timezone</p>
                                                        <p className="text-xs text-slate-500">Currently: (GMT+08:00) Manila</p>
                                                    </div>
                                                </div>
                                                <select className="bg-white border border-slate-200 text-sm rounded-lg px-2 py-1 outline-none">
                                                    <option>Manila</option>
                                                    <option>Tokyo</option>
                                                    <option>UTC</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-1">Security & Access</h3>
                                            <p className="text-sm text-slate-500">Manage credentials and authentication layers.</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                                        <Key size={18} className="text-red-600" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-800">Change Password</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <input type="password" placeholder="Current Password" className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 outline-none" />
                                                    <input type="password" placeholder="New Password" className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 outline-none" />
                                                </div>
                                                <button className="text-sm text-blue-700 font-semibold hover:underline">Request Reset</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-70"
                                >
                                    <Save size={18} />
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
