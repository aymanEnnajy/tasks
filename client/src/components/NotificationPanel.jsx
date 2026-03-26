import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';

const NotificationPanel = ({ isOpen, onClose, tasks = [] }) => {
    // Filter tasks with end_day and sort by date
    const upcomingTasks = tasks
        .filter(t => t.end_day && !t.completed)
        .sort((a, b) => new Date(a.end_day) - new Date(b.end_day))
        .slice(0, 10); // Show only first 10

    const isOverdue = (endDay) => new Date(endDay) < new Date();
    const isDueSoon = (endDay) => {
        const daysLeft = Math.floor((new Date(endDay) - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft >= 0 && daysLeft <= 1;
    };

    const getDaysLeft = (endDay) => {
        const daysLeft = Math.floor((new Date(endDay) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return 'Overdue';
        if (daysLeft === 0) return 'Today';
        if (daysLeft === 1) return 'Tomorrow';
        return `${daysLeft} days left`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20, x: 20 }}
                        className="fixed top-20 right-4 left-4 lg:absolute lg:top-24 lg:right-6 lg:left-auto z-50 w-auto lg:w-96 glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[70vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-zinc-600/10 to-zinc-800/10 border-b border-white/10 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="text-zinc-400" size={20} />
                                <h3 className="font-black text-white tracking-tight">Upcoming Deadlines</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-zinc-500 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="custom-scrollbar max-h-[calc(70vh-120px)] overflow-y-auto flex-1">
                            {upcomingTasks.length > 0 ? (
                                upcomingTasks.map((task, idx) => {
                                    const overdue = isOverdue(task.end_day);
                                    const dueSoon = isDueSoon(task.end_day);

                                    return (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                                                overdue ? 'bg-white/5' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Status Icon */}
                                                <div className={`mt-1 p-2 rounded-lg flex-shrink-0 bg-zinc-800`}>
                                                    <Clock className="text-zinc-400" size={16} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-white text-sm truncate mb-1">
                                                        {task.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${
                                                            overdue 
                                                                ? 'bg-white/20 text-white' 
                                                                : 'bg-white/10 text-zinc-300'
                                                        }`}>
                                                            {getDaysLeft(task.end_day)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-500">
                                                        {new Date(task.end_day).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="p-12 text-center">
                                    <CheckCircle2 className="mx-auto text-zinc-500 mb-3 opacity-50" size={32} />
                                    <p className="text-zinc-500 font-bold text-sm">All caught up!</p>
                                    <p className="text-zinc-600 text-[10px] mt-1">No upcoming deadlines</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationPanel;
