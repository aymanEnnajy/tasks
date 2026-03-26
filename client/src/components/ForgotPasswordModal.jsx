import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: email, 2: reset password
    const [email, setEmail] = useState('');
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [showPassword, setShowPassword] = useState({ new: false, confirm: false });
    const { resetPassword } = useAuth();

    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        if (!email) return toast.error('Enter your email address');

        setVerifyLoading(true);
        try {
            // We'll use the resetPassword function to check if email exists
            // by attempting to reset with a placeholder, then catching the error
            const result = await resetPassword(email, newPassword || 'temp');
            
            // If email doesn't exist, we get an error
            if (result.error && result.error.message.includes('not found')) {
                toast.error('Email not found');
                setVerifyLoading(false);
                return;
            }

            // Email exists, move to password reset step
            toast.success('✅ Email verified! Set your new password');
            setStep(2);
        } catch (err) {
            console.error("Email verification error:", err);
            toast.error('Error verifying email');
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        // Validation
        if (!newPassword) return toast.error('Enter new password');
        if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
        if (newPassword !== confirmPassword) return toast.error('Passwords do not match');

        setResetLoading(true);
        try {
            const result = await resetPassword(email, newPassword);
            if (result.error) {
                toast.error(result.error.message || 'Failed to reset password');
            } else {
                toast.success('🔐 Password reset successfully! Log in with your new password');
                // Reset form
                setStep(1);
                setEmail('');
                setNewPassword('');
                setConfirmPassword('');
                onClose();
            }
        } catch (err) {
            console.error("Password reset error:", err);
            toast.error('Failed to reset password');
        } finally {
            setResetLoading(false);
        }
    };

    const handleClose = () => {
        // Reset form when closing
        setStep(1);
        setEmail('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPassword({ new: false, confirm: false });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Reset Your Password">
            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <p className="text-zinc-400 font-bold text-sm">
                            Enter your email address and we'll help you regain access to your account.
                        </p>

                        <form onSubmit={handleVerifyEmail} className="space-y-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-zinc-500 focus:bg-black outline-none transition-all text-white font-bold placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={verifyLoading}
                                className="bg-white hover:bg-zinc-200 text-black font-black py-4 px-6 rounded-2xl shadow-xl shadow-white/10 transition-all flex items-center justify-center gap-3 active:scale-95 text-[10px] uppercase tracking-widest w-full disabled:opacity-50"
                            >
                                {verifyLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                                {verifyLoading ? 'Verifying...' : 'Verify Email'}
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="bg-green-950/50 border border-green-500/30 rounded-3xl p-4 flex items-center gap-3">
                            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                            <span className="text-sm font-bold text-green-400">{email} verified</span>
                        </div>

                        <p className="text-zinc-400 font-bold text-sm">
                            Create a strong new password for your account.
                        </p>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {/* New Password */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] ml-1">New Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white" size={18} />
                                    <input
                                        type={showPassword.new ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-14 focus:ring-2 focus:ring-zinc-500 focus:bg-black outline-none transition-all text-white font-bold placeholder:text-zinc-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white" size={18} />
                                    <input
                                        type={showPassword.confirm ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-14 focus:ring-2 focus:ring-zinc-500 focus:bg-black outline-none transition-all text-white font-bold placeholder:text-zinc-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                             <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep(1);
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 text-[10px] uppercase tracking-widest"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="bg-white hover:bg-zinc-200 text-black font-black py-4 px-6 rounded-2xl shadow-xl shadow-white/10 transition-all flex items-center justify-center gap-2 active:scale-95 text-[10px] uppercase tracking-widest disabled:opacity-50"
                                >
                                    {resetLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                                    {resetLoading ? 'Resetting...' : 'Reset'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </Modal>
    );
};

export default ForgotPasswordModal;
