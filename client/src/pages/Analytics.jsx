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

    const completedTasksList = tasks.filter(t => t.completed);
    const completedTasks = completedTasksList.length;
    const pendingTasks = tasks.length - completedTasks;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const isLate = (task) => {
        if (!task.end_day) return false;
        const deadline = new Date(task.end_day);
        const today = new Date();
        if (!task.completed && deadline < today) return true;
        if (task.completed && task.completed_at && new Date(task.completed_at) > deadline) return true;
        return false;
    };

    const deadlineRespect = tasks.length > 0 
        ? Math.round(((tasks.length - tasks.filter(isLate).length) / tasks.length) * 100) 
        : 100;

    // Calculate real analytics by category
    const categoryAnalytics = tasks.reduce((acc, task) => {
        const categoryName = task.categories?.name || 'Uncategorized';
        if (!acc[categoryName]) {
            acc[categoryName] = { total: 0, completed: 0 };
        }
        acc[categoryName].total++;
        if (task.completed) acc[categoryName].completed++;
        return acc;
    }, {});

    // Convert to array and calculate percentages, sorted by task count
    const productivityData = Object.entries(categoryAnalytics)
        .map(([name, data]) => ({
            label: name,
            completedCount: data.completed,
            totalCount: data.total,
            percentage: Math.round((data.completed / data.total) * 100)
        }))
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, 5); // Show top 5 categories

    return (
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar pb-32">
            <header>
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl sm:text-6xl font-black text-white mb-4 tracking-tighter"
                >
                    Project <span className="text-zinc-400 italic">Metrics.</span>
                </motion.h2>
                <p className="text-zinc-500 font-black uppercase tracking-[3px] text-[10px]">Real-time performance analytics</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <StatCard icon={<TrendingUp className="text-zinc-400" />} label="Success Rate" value={`${completionRate}%`} color="zinc" />
                <StatCard icon={<Target className="text-zinc-500" />} label="Deadline Respect" value={`${deadlineRespect}%`} color="zinc" />
                <StatCard icon={<CheckCircle2 className="text-white" />} label="Completed" value={completedTasks} color="zinc" />
                <StatCard icon={<Clock className="text-zinc-600" />} label="Pending" value={pendingTasks} color="zinc" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="glass-panel p-6 sm:p-10 rounded-[30px] sm:rounded-[50px] border-white/5 bg-gradient-to-br from-zinc-600/5 to-transparent">
                    <h3 className="text-lg sm:text-xl font-black text-white italic mb-8 uppercase tracking-widest">Productivity Flow</h3>
                    {productivityData.length > 0 ? (
                        <div className="space-y-6">
                            {productivityData.map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-zinc-500">{item.label}</span>
                                        <span className="text-white">{item.percentage}% ({item.completedCount}/{item.totalCount})</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.percentage}%` }}
                                            transition={{ duration: 1, delay: i * 0.1 }}
                                            className={`h-full bg-gradient-to-r ${
                                                item.percentage === 100 ? 'from-white to-zinc-400' :
                                                item.percentage >= 75 ? 'from-zinc-400 to-zinc-600' :
                                                item.percentage >= 50 ? 'from-zinc-600 to-zinc-800' :
                                                'from-zinc-800 to-black'
                                            } shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-zinc-500 font-bold">No tasks yet. Create some to see analytics!</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className={`glass-panel p-6 sm:p-8 rounded-[30px] sm:rounded-[40px] border-white/5 relative overflow-hidden group`}>
        <div className="relative z-10">
            <div className="mb-4">{icon}</div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] mb-1">{label}</p>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tighter">{value}</div>
        </div>
    </div>
);

export default Analytics;
