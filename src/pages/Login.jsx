import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate network delay for effect
        await new Promise(resolve => setTimeout(resolve, 800));

        const success = login(username, password);
        if (success) {
            navigate('/admin');
        } else {
            setError('Invalid username or password');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300 min-h-[500px]">

                {/* Left Side - Branding (Dark Blue) */}
                <div className="md:w-1/2 bg-[#0f172a] p-12 text-white flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-500 rounded-full blur-[100px]" />
                        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-cyan-500 rounded-full blur-[100px]" />
                    </div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-white/10 backdrop-blur-sm mb-8 border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white">
                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold mb-4">Nagcarlan Water</h1>
                        <p className="text-blue-200/80 text-lg leading-relaxed">
                            Advanced Billing & Analytics System for precise tracking and seamless management.
                        </p>
                    </div>

                    <div className="mt-12 relative z-10">
                        <div className="flex -space-x-2 overflow-hidden mb-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`inline-block h-8 w-8 rounded-full ring-2 ring-[#0f172a] bg-blue-${i * 200 + 200}`} style={{ backgroundColor: i === 1 ? '#60a5fa' : i === 2 ? '#3b82f6' : '#2563eb' }} />
                            ))}
                        </div>
                        <p className="text-sm text-blue-300">Used by trusted tellers</p>
                    </div>
                </div>

                {/* Right Side - Form (White) */}
                <div className="md:w-1/2 bg-white p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
                        <p className="text-slate-500 text-sm mt-1">Please enter your details to sign in.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                                <span className="block w-1.5 h-1.5 rounded-full bg-red-600" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-300 text-blue-900 focus:ring-blue-900" />
                                Remember me
                            </label>
                            <button type="button" className="text-sm font-semibold text-blue-900 hover:text-blue-700">
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#0f172a] text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl mt-6 active:scale-[0.98]"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
