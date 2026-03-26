import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Loader2, Sparkles, ChevronRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        password: false,
        confirmPassword: false
    });
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }

        setLoading(true);
        try {
            const { error } = await signUp(formData.email, formData.password, {
                username: formData.username
            });
            if (error) throw error;
            toast.success('Account created! Welcome onboard. 🚀');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.message || 'Failed to initialize account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black overflow-hidden relative font-sans">
            <div className="absolute top-[20%] right-[-5%] w-[50%] h-[50%] bg-zinc-800/10 rounded-full blur-[120px] animate-mesh"></div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-[480px] z-10"
            >
                <div className="glass-panel p-10 rounded-[40px]">
                    <div className="mb-10">
                        <h1 className="text-4xl font-black text-white mb-3 tracking-tighter">
                            Create <span className="text-zinc-400 italic">Account.</span>
                        </h1>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Start your premium experience</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Identity</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-zinc-500/50 outline-none transition-all text-white font-medium"
                                    placeholder="Full Name"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-zinc-500/50 outline-none transition-all text-white font-medium"
                                    placeholder="name@mail.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Security</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type={showPasswords.password ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-zinc-500/50 outline-none transition-all text-white font-medium text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, password: !showPasswords.password })}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {showPasswords.password ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Confirm</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type={showPasswords.confirmPassword ? 'text' : 'password'}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-zinc-500/50 outline-none transition-all text-white font-medium text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, confirmPassword: !showPasswords.confirmPassword })}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {showPasswords.confirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 rounded-2xl shadow-2xl shadow-white/10 transition-all flex items-center justify-center gap-3 depth-button active:scale-[0.98] mt-6"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    Create Account
                                    <UserPlus size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center text-sm font-bold">
                        <span className="text-zinc-500">Member already?</span>{' '}
                        <Link to="/login" className="text-white hover:text-zinc-400 transition-colors uppercase tracking-widest text-[10px] ml-2 underline underline-offset-4">
                            Switch to Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
