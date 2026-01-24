import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, Target,
    CheckCircle2, Clock, Zap, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TaskService } from '../services/taskService';

const Analytics = () => {
    const { user, dbUserId, role } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (dbUserId) fetchData();
    }, [dbUserId, role]);

    const fetchData = async () => {
        setLoading(true);
        const { data } = await TaskService.getTasks(dbUserId, role);
        if (data) setTasks(data);
        setLoading(false);
    };

    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.length - completedTasks;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return (
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar pb-32">
            <header>
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl lg:text-6xl font-black text-white mb-4 tracking-tighter"
                >
                    Project <span className="text-blue-500 italic">Metrics.</span>
                </motion.h2>
                <p className="text-slate-500 font-black uppercase tracking-[3px] text-[10px]">Real-time performance analytics</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<TrendingUp className="text-blue-500" />} label="Success Rate" value={`${completionRate}%`} color="blue" />
                <StatCard icon={<CheckCircle2 className="text-emerald-500" />} label="Completed" value={completedTasks} color="emerald" />
                <StatCard icon={<Clock className="text-rose-500" />} label="Pending" value={pendingTasks} color="rose" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-gradient-to-br from-blue-600/5 to-transparent">
                    <h3 className="text-xl font-black text-white italic mb-8 uppercase tracking-widest">Productivity Flow</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Development', value: 85, color: 'bg-blue-500' },
                            { label: 'System Design', value: 62, color: 'bg-indigo-500' },
                            { label: 'Optimization', value: 45, color: 'bg-emerald-500' },
                            { label: 'Documentation', value: 20, color: 'bg-slate-700' },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500">{item.label}</span>
                                    <span className="text-white">{item.value}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.value}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`h-full ${item.color} shadow-[0_0_10px_rgba(59,130,246,0.3)]`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className={`glass-panel p-8 rounded-[40px] border-white/5 relative overflow-hidden group`}>
        <div className="relative z-10">
            <div className="mb-4">{icon}</div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-1">{label}</p>
            <div className="text-4xl font-black text-white tracking-tighter">{value}</div>
        </div>
    </div>
);

export default Analytics;
