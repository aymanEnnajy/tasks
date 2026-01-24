import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Rocket, Mail, Lock, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            toast.success('Ready for takeoff! 🚀');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.message || 'Check your credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 overflow-hidden relative font-sans">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-[440px] z-10"
            >
                <div className="glass-panel p-10 rounded-[40px] relative overflow-hidden group">
                    {/* Header */}
                    <div className="mb-10 text-center">
                        <motion.div
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                            className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20"
                        >
                            <Rocket className="text-white" size={32} />
                        </motion.div>
                        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
                            Sign <span className="text-blue-500 italic">In.</span>
                        </h1>
                        <p className="text-slate-400 font-medium">Elevate your daily productivity.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-[2px] ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-blue-500/50 focus:bg-slate-900 outline-none transition-all text-white font-medium"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-[2px]">Password</label>
                                <button type="button" className="text-xs text-blue-500 hover:text-blue-400 font-bold">Forgot?</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-blue-500/50 focus:bg-slate-900 outline-none transition-all text-white font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-2xl shadow-blue-600/40 transition-all flex items-center justify-center gap-3 depth-button active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    Connect Now
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-slate-500 font-medium">
                        <span>New here?</span>
                        <Link to="/register" className="text-white hover:text-blue-500 flex items-center gap-1 transition-colors">
                            Join the elite <Sparkles size={14} className="text-amber-400" />
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
