import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, Save, Loader2, Camera, Eye, EyeOff, Trash2, Lock, AlertTriangle, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const Account = () => {
    const { user, dbUserId, role, updateUserMetadata, changePassword, scheduleAccountDeletion, cancelAccountDeletion, signOut } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [dbUserData, setDbUserData] = useState(null);
    const [deletionCountdown, setDeletionCountdown] = useState(null);
    
    const [formData, setFormData] = useState({
        username: user?.user_metadata?.username || '',
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || '',
    });

    // Password change state
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [confirmDeletePassword, setConfirmDeletePassword] = useState('');
    const [showDeletePassword, setShowDeletePassword] = useState(false);

    // Fetch user data and check deletion status
    useEffect(() => {
        const fetchUserData = async () => {
            if (!dbUserId) return;
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('deletion_scheduled_at')
                    .eq('id', dbUserId)
                    .maybeSingle();

                if (error) throw error;
                if (data) {
                    setDbUserData(data);
                    if (data.deletion_scheduled_at) {
                        calculateDeletionCountdown(data.deletion_scheduled_at);
                    }
                }
            } catch (err) {
                console.error("Fetch user data error:", err);
            }
        };

        fetchUserData();
    }, [dbUserId]);

    // Calculate countdown timer
    const calculateDeletionCountdown = (scheduledDate) => {
        const now = new Date();
        const scheduled = new Date(scheduledDate);
        const deletionDate = new Date(scheduled.getTime() + 10 * 24 * 60 * 60 * 1000);
        const diff = deletionDate - now;

        if (diff <= 0) {
            setDeletionCountdown({ days: 0, hours: 0, minutes: 0 });
        } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setDeletionCountdown({ days, hours, minutes });
        }
    };

    // Update countdown every minute
    useEffect(() => {
        if (!dbUserData?.deletion_scheduled_at) return;

        const interval = setInterval(() => {
            calculateDeletionCountdown(dbUserData.deletion_scheduled_at);
        }, 60000);

        return () => clearInterval(interval);
    }, [dbUserData?.deletion_scheduled_at]);

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

    const handleChangePassword = async (e) => {
        e.preventDefault();

        // Validation
        if (!passwordForm.currentPassword) return toast.error('Enter current password');
        if (!passwordForm.newPassword) return toast.error('Enter new password');
        if (passwordForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
        if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match');

        setPasswordLoading(true);
        try {
            const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            if (result.error) {
                toast.error(result.error.message || 'Password change failed');
            } else {
                toast.success('🔐 Password changed successfully!');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowPasswordSection(false);
            }
        } catch (err) {
            console.error("Change password error:", err);
            toast.error('Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleScheduleAccountDeletion = async () => {
        if (!confirmDeletePassword) return toast.error('Enter your password to confirm');

        setDeleteLoading(true);
        try {
            // First verify password is correct
            const { data: userData, error: verifyError } = await supabase
                .from('users')
                .select('password_hash')
                .eq('id', dbUserId)
                .maybeSingle();

            if (verifyError || !userData || userData.password_hash !== confirmDeletePassword) {
                toast.error('❌ Password is incorrect');
                setDeleteLoading(false);
                return;
            }

            const result = await scheduleAccountDeletion();
            if (result.error) {
                toast.error('Failed to schedule account deletion');
            } else {
                // Update deletion countdown
                calculateDeletionCountdown(result.data.scheduledAt);
                setDbUserData({ ...dbUserData, deletion_scheduled_at: result.data.scheduledAt });
                toast.success('⏰ Account deletion scheduled for 10 days from now');
                setShowDeleteModal(false);
                setConfirmDeletePassword('');
            }
        } catch (err) {
            console.error("Schedule deletion error:", err);
            toast.error('Failed to schedule account deletion');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCancelDeletion = async () => {
        try {
            const result = await cancelAccountDeletion();
            if (result.error) {
                toast.error('Failed to cancel account deletion');
            } else {
                setDeletionCountdown(null);
                setDbUserData({ ...dbUserData, deletion_scheduled_at: null });
                toast.success('✅ Account deletion cancelled');
            }
        } catch (err) {
            console.error("Cancel deletion error:", err);
            toast.error('Failed to cancel account deletion');
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
                <div className="xl:col-span-2 space-y-8">
                    {/* Profile Section */}
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
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center gap-3 active:scale-95 text-[10px] uppercase tracking-widest disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Persist Changes
                        </button>
                    </form>

                    {/* Password Change Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-panel p-10 rounded-[50px] border-white/5 space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Lock size={24} className="text-blue-500" />
                                <h3 className="text-xl font-black text-white">Password Security</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPasswordSection(!showPasswordSection)}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-[10px] uppercase tracking-widest"
                            >
                                {showPasswordSection ? 'Cancel' : 'Change Password'}
                            </button>
                        </div>

                        <AnimatePresence>
                            {showPasswordSection && (
                                <motion.form
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    onSubmit={handleChangePassword}
                                    className="space-y-6 pt-6 border-t border-white/5"
                                >
                                    {/* Current Password */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] ml-1">Current Password</label>
                                        <div className="relative group">
                                            <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500" size={18} />
                                            <input
                                                type={showPasswords.current ? 'text' : 'password'}
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                placeholder="Enter your current password"
                                                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-14 focus:ring-2 focus:ring-blue-500 focus:bg-slate-950 outline-none transition-all text-white font-bold placeholder:text-slate-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 transition-colors"
                                            >
                                                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] ml-1">New Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500" size={18} />
                                            <input
                                                type={showPasswords.new ? 'text' : 'password'}
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                placeholder="Enter new password (min. 6 characters)"
                                                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-14 focus:ring-2 focus:ring-blue-500 focus:bg-slate-950 outline-none transition-all text-white font-bold placeholder:text-slate-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 transition-colors"
                                            >
                                                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] ml-1">Confirm New Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500" size={18} />
                                            <input
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                placeholder="Confirm new password"
                                                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-14 focus:ring-2 focus:ring-blue-500 focus:bg-slate-950 outline-none transition-all text-white font-bold placeholder:text-slate-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 transition-colors"
                                            >
                                                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center gap-3 active:scale-95 text-[10px] uppercase tracking-widest disabled:opacity-50 w-full justify-center"
                                    >
                                        {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                                        Update Password
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Account Deletion Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`glass-panel p-10 rounded-[50px] border-white/5 space-y-8 ${dbUserData?.deletion_scheduled_at ? 'border-red-500/30 bg-red-950/20' : ''}`}
                    >
                        {dbUserData?.deletion_scheduled_at ? (
                            <>
                                <div className="flex items-center gap-3 text-red-500">
                                    <AlertTriangle size={24} />
                                    <h3 className="text-xl font-black">Account Deletion Pending</h3>
                                </div>

                                <div className="bg-red-950/40 border border-red-500/30 rounded-3xl p-6 space-y-4">
                                    <p className="text-slate-300 font-bold text-sm">Your account is scheduled for deletion. You have the following time to cancel:</p>
                                    
                                    {deletionCountdown && (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-slate-900/80 rounded-2xl p-4 text-center">
                                                <div className="text-3xl font-black text-red-500">{deletionCountdown.days}</div>
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mt-1">Days</div>
                                            </div>
                                            <div className="bg-slate-900/80 rounded-2xl p-4 text-center">
                                                <div className="text-3xl font-black text-red-500">{deletionCountdown.hours}</div>
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mt-1">Hours</div>
                                            </div>
                                            <div className="bg-slate-900/80 rounded-2xl p-4 text-center">
                                                <div className="text-3xl font-black text-red-500">{deletionCountdown.minutes}</div>
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mt-1">Minutes</div>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-slate-400 text-sm font-bold mt-4">⚠️ All your tasks, articles, and account data will be permanently deleted after the countdown expires.</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCancelDeletion}
                                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-green-500/20 transition-all flex items-center gap-3 active:scale-95 text-[10px] uppercase tracking-widest w-full justify-center"
                                >
                                    <Check size={16} />
                                    Cancel Account Deletion
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Trash2 size={24} />
                                    <h3 className="text-xl font-black text-white">Danger Zone</h3>
                                </div>

                                <p className="text-slate-400 text-sm font-bold">
                                    Permanently delete your account and all associated data. This action schedules deletion for 10 days from now, giving you time to reconsider.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(true)}
                                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-red-500/20 transition-all flex items-center gap-3 active:scale-95 text-[10px] uppercase tracking-widest"
                                >
                                    <Trash2 size={16} />
                                    Delete Account
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Delete Account Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setConfirmDeletePassword(''); }} title="Confirm Account Deletion">
                <div className="space-y-6">
                    <div className="bg-red-950/50 border border-red-500/30 rounded-3xl p-6 space-y-3">
                        <div className="flex items-center gap-2 text-red-500 font-black">
                            <AlertTriangle size={20} />
                            PERMANENT ACTION
                        </div>
                        <p className="text-slate-300 font-bold text-sm">
                            All your tasks, articles, and account data will be permanently deleted in 10 days. You can cancel this deletion anytime within the 10-day period.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-slate-400 font-bold text-sm">To proceed, enter your password to confirm:</p>

                        <div className="space-y-3">
                            <div className="relative group">
                                <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-red-500" size={18} />
                                <input
                                    type={showDeletePassword ? 'text' : 'password'}
                                    value={confirmDeletePassword}
                                    onChange={(e) => setConfirmDeletePassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-14 focus:ring-2 focus:ring-red-500 focus:bg-slate-950 outline-none transition-all text-white font-bold placeholder:text-slate-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-500 transition-colors"
                                >
                                    {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => { setShowDeleteModal(false); setConfirmDeletePassword(''); }}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 text-[10px] uppercase tracking-widest"
                        >
                            <X size={16} />
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleScheduleAccountDeletion}
                            disabled={deleteLoading || !confirmDeletePassword}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 text-[10px] uppercase tracking-widest disabled:opacity-50"
                        >
                            {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            {deleteLoading ? 'Processing...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>
        </main>
    );
};

export default Account;
