import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Save, Loader2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const Account = () => {
    const { user, dbUserId, role, updateUserMetadata } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: user?.user_metadata?.username || '',
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || '',
    });

    const handleSave = async (e) => {
        e.preventDefault();
        if (!dbUserId) return toast.error('User identification failed');

        setLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ username: formData.username })
                .eq('id', dbUserId);

            if (error) throw error;

            // Update local context state
            updateUserMetadata({ username: formData.username });

            toast.success('System architecture updated!');
        } catch (err) {
            console.error("Profile update error:", err);
            toast.error('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar">
            <header>
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl lg:text-6xl font-black text-white mb-4 tracking-tighter"
                >
                    My <span className="text-blue-500 italic">Account.</span>
                </motion.h2>
                <p className="text-slate-500 font-black uppercase tracking-[3px] text-[10px]">Manage your profile and security</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2">
                    <form onSubmit={handleSave} className="glass-panel p-10 rounded-[50px] border-white/5 space-y-8">
                        <div className="flex items-center gap-8 mb-12">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-white/10 overflow-hidden shadow-2xl transition-all group-hover:border-blue-500/50">
                                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email}`} alt="Avatar" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">{formData.username || 'Engineer'}</h3>
                                <p className="text-blue-500 font-bold text-sm">System Role: {role || 'Standard User'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] ml-1">Username</label>
                                <div className="relative group">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500" size={18} />
                                    <input
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-blue-500 focus:bg-slate-950 outline-none transition-all text-white font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] ml-1">Email Address</label>
                                <div className="relative opacity-60">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    <input
                                        value={formData.email}
                                        disabled
                                        className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 outline-none text-slate-400 font-bold cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center gap-3 active:scale-95 text-[10px] uppercase tracking-widest mt-8"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Persist Changes
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default Account;
