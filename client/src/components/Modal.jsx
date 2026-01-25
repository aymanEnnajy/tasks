import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 40, rotateX: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 40, rotateX: -10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-4xl glass-panel p-8 sm:p-12 rounded-[50px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border-white/[0.05] overflow-hidden"
                    >
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px]"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-blue-500 font-black text-[10px] uppercase tracking-[4px]">
                                        <Sparkles size={12} /> Pro Interface
                                    </div>
                                    <h2 className="text-4xl font-black text-white italic tracking-tighter leading-none">{title}</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 glass-card rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all active:scale-90"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="custom-scrollbar max-h-[70vh] overflow-y-auto pr-2">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
