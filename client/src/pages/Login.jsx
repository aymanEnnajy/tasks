import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Rocket, Mail, Lock, ChevronRight, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-black overflow-hidden relative font-sans">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-800/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
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
                            className="w-16 h-16 bg-gradient-to-tr from-white to-zinc-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-zinc-700/20"
                        >
                            <Rocket className="text-black" size={32} />
                        </motion.div>
                        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
                            Sign <span className="text-zinc-400 italic">In.</span>
                        </h1>
                        <p className="text-zinc-400 font-medium">Elevate your daily productivity.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-[2px] ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-zinc-500/50 focus:bg-zinc-900 outline-none transition-all text-white font-medium"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-[2px]">Password</label>
                                <button 
                                    type="button" 
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-xs text-zinc-400 hover:text-white font-bold"
                                >
                                    Forgot?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-14 focus:ring-2 focus:ring-zinc-500/50 focus:bg-zinc-900 outline-none transition-all text-white font-medium"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 rounded-2xl shadow-2xl shadow-white/10 transition-all flex items-center justify-center gap-3 depth-button active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    Connect Now
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-zinc-500 font-medium">
                        <span>New here?</span>
                        <Link to="/register" className="text-white hover:text-zinc-400 flex items-center gap-1 transition-colors">
                            Join the elite <Sparkles size={14} className="text-white" />
                        </Link>
                    </div>
                </div>
            </motion.div>

            <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />
        </div>
    );
};

export default Login;
