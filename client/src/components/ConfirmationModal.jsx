import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, isDangerous = true }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                        <div className="bg-slate-800 border border-white/10 rounded-3xl shadow-2xl p-8 max-w-md w-full">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl ${isDangerous ? 'bg-rose-500/20' : 'bg-blue-500/20'}`}>
                                        <AlertCircle size={24} className={isDangerous ? 'text-rose-500' : 'text-blue-500'} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{title}</h3>
                                </div>
                                <button
                                    onClick={onCancel}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Message */}
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{message}</p>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 px-4 py-3 font-bold rounded-xl transition-colors text-white ${
                                        isDangerous
                                            ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30'
                                            : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30'
                                    }`}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
