import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Calendar, CheckSquare, Clock,
    LayoutDashboard, LogOut, Plus, Settings,
    Briefcase, GraduationCap, Trophy, Apple,
    Search, Bell, Download, Filter, Menu, X,
    TrendingUp, Users, Target, Rocket, Trash2, CheckCircle2, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TaskService } from '../services/taskService';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { user, signOut, role } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchData();
    }, [user, role]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, taskRes] = await Promise.all([
                TaskService.getCategories(),
                TaskService.getTasks(user.id, role)
            ]);

            if (catRes.data) setCategories(catRes.data);
            if (taskRes.data) setTasks(taskRes.data);
        } catch (err) {
            console.error("Fetch failed:", err);
            toast.error('Sync issue with Supabase');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (id, completed) => {
        try {
            const { error } = await TaskService.toggleTask(id, completed);
            if (!error) {
                setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));
                toast.success(completed ? 'Task reopened' : 'Task completed! ✨');
            }
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const handleDeleteTask = async (id) => {
        try {
            const { error } = await TaskService.deleteTask(id);
            if (!error) {
                setTasks(prev => prev.filter(t => t.id !== id));
                toast.success('Task removed');
            }
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const IconMap = { Briefcase, GraduationCap, Trophy, Apple };
    const userName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.length - completedTasks;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return (
        <div className="flex min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30 font-sans">

            {/* Mobile Navbar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="fixed inset-0 z-50 lg:hidden glass-panel !bg-[#020617]/95 flex flex-col p-8"
                    >
                        <div className="flex justify-between items-center mb-12">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                    <Rocket size={24} className="text-white" />
                                </div>
                                <span className="text-2xl font-black italic text-white uppercase tracking-tighter">DAILY<span className="text-blue-500">TASK</span></span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 glass-card rounded-xl text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <nav className="space-y-4 flex-1">
                            <MobileLink icon={<LayoutDashboard />} label="Overview" active onClick={() => setIsMobileMenuOpen(false)} />
                            <MobileLink icon={<CheckSquare />} label="Tasks" onClick={() => setIsMobileMenuOpen(false)} />
                            <MobileLink icon={<BarChart3 />} label="Analytics" onClick={() => setIsMobileMenuOpen(false)} />
                            <MobileLink icon={<Settings />} label="Settings" onClick={() => setIsMobileMenuOpen(false)} />
                        </nav>
                        <button onClick={() => signOut()} className="flex items-center gap-3 text-rose-500 font-bold p-4">
                            <LogOut size={20} /> Logout
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 bg-[#020617] border-r border-white/[0.03] p-8 space-y-12 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30">
                        <Rocket size={24} className="text-white" />
                    </div>
                    <div>
                        <span className="block text-2xl font-black text-white italic tracking-tighter uppercase leading-none">TASK<span className="text-blue-500">PRO</span></span>
                        <span className="text-[10px] uppercase font-black text-slate-700 tracking-[3px] ml-1">Live Sync</span>
                    </div>
                </div>

                <nav className="space-y-3 flex-1">
                    <SidebarLink icon={<LayoutDashboard size={20} />} label="Overview" active />
                    <SidebarLink icon={<CheckSquare size={20} />} label="My Tasks" />
                    <SidebarLink icon={<BarChart3 size={20} />} label="Analytics" />
                    <SidebarLink icon={<Calendar size={20} />} label="Schedule" />
                </nav>

                <div className="mt-auto space-y-6 pt-12 border-t border-white/5">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-white/10 overflow-hidden shadow-xl">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email}`} alt="User" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white truncate">{userName}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{role || 'User'}</p>
                        </div>
                        <button onClick={() => signOut()} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="flex items-center justify-between p-6 lg:px-10 border-b border-white/[0.03] z-20 bg-[#020617]/50 backdrop-blur-3xl shrink-0">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-3 glass-card rounded-2xl text-white">
                        <Menu size={24} />
                    </button>

                    <div className="flex-1 max-w-xl mx-8 hidden sm:block">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                placeholder="Search live database..."
                                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-6 focus:ring-2 focus:ring-blue-500/50 focus:bg-slate-900 focus:border-blue-500 outline-none transition-all font-medium text-sm text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="hidden sm:flex items-center gap-2 px-5 py-3 glass-card rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-blue-500/50 hover:bg-white/5 text-white transition-all">
                            <Download size={16} className="text-blue-500" /> Export Data
                        </button>
                        <div className="w-[1px] h-6 bg-white/10 mx-2 hidden sm:block"></div>
                        <button className="p-3.5 glass-card rounded-2xl relative text-white">
                            <Bell size={20} />
                            <span className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_#f43f5e]"></span>
                        </button>
                        <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 p-3.5 rounded-2xl shadow-xl shadow-blue-600/30 active:scale-95 transition-all depth-button group"
                        >
                            <Plus size={24} className="text-white group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar pb-32">

                    {/* Hero Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                        <section>
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl lg:text-6xl font-black text-white mb-4 tracking-tighter"
                            >
                                Dashboard <span className="text-blue-500 italic">Live.</span>
                            </motion.h2>
                            <div className="flex items-center gap-4 font-black text-slate-500 text-[10px] uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-lg border border-white/5">
                                <Calendar size={14} className="text-blue-500" />
                                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                        </section>

                        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                            <div className="glass-panel p-5 rounded-3xl min-w-[140px] border-blue-500/10">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Pending</p>
                                <div className="text-3xl font-black text-white tracking-tight">{loading ? '...' : pendingTasks}</div>
                            </div>
                            <div className="glass-panel p-5 rounded-3xl min-w-[140px] border-emerald-500/10">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Completed</p>
                                <div className="text-3xl font-black text-emerald-400 tracking-tight">{loading ? '...' : completedTasks}</div>
                            </div>
                        </div>
                    </div>

                    {/* Categories Grid */}
                    <section>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {categories.map((cat, i) => {
                                const Icon = IconMap[cat.icon] || Briefcase;
                                const catTasksCount = tasks.filter(t => t.category_id === cat.id).length;
                                return (
                                    <CategoryCard
                                        key={cat.id}
                                        icon={Icon}
                                        name={cat.name}
                                        tasks={catTasksCount}
                                        color={cat.color_gradient || 'from-blue-600 to-indigo-700'}
                                        index={i}
                                    />
                                );
                            })}
                        </div>
                    </section>

                    {/* Task List Section */}
                    <section className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                        <div className="xl:col-span-2 space-y-8">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-2xl font-black text-white italic tracking-tight uppercase">Database Flow</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                        Synced: <span className="text-blue-500">{tasks.length}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="py-32 flex flex-col items-center justify-center">
                                        <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                                        <p className="font-black uppercase tracking-[6px] text-[10px] text-slate-600">Accessing Cloud</p>
                                    </div>
                                ) : tasks.length > 0 ? (
                                    tasks.map((task, idx) => (
                                        <TaskRow
                                            key={task.id}
                                            task={task}
                                            index={idx}
                                            onToggle={() => handleToggleTask(task.id, task.completed)}
                                            onDelete={() => handleDeleteTask(task.id)}
                                        />
                                    ))
                                ) : (
                                    <div className="py-32 text-center border-[3px] border-dashed border-white/[0.03] rounded-[50px] bg-slate-900/10 active:scale-95 transition-all cursor-pointer" onClick={() => setIsTaskModalOpen(true)}>
                                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600 border border-white/5">
                                            <CheckSquare size={32} />
                                        </div>
                                        <p className="font-black italic text-2xl text-slate-400">Database is Empty.</p>
                                        <p className="text-[10px] font-black uppercase tracking-[3px] mt-4 text-blue-500/60">Tap to start syncing tasks</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Performance Score Section */}
                        <div className="space-y-8">
                            <div className="glass-panel p-10 rounded-[50px] border-blue-500/10 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h4 className="font-black text-slate-600 uppercase tracking-[3px] text-[10px] mb-8">Performance</h4>
                                    <div className="flex items-end justify-between mb-4">
                                        <span className="text-6xl font-black text-white tracking-tighter">{completionRate}%</span>
                                        <TrendingUp className="text-blue-500 mb-2 animate-bounce" size={32} />
                                    </div>
                                    <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden mb-8 border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${completionRate}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-8">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Success</p>
                                            <p className="text-xl font-black text-emerald-500 italic">{completedTasks}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Remaining</p>
                                            <p className="text-xl font-black text-blue-500 italic">{pendingTasks}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all duration-700"></div>
                            </div>

                            <div className="p-8 glass-card rounded-[40px] border-white/5">
                                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[3px] mb-6">Environment</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                                        <span className="text-xs font-bold text-slate-400 font-mono tracking-tight">Supabase: Connected</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Pop up Pro - Modals */}
            <Modal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                title="Register Data Row"
            >
                <TaskForm
                    categories={categories}
                    onSuccess={() => {
                        setIsTaskModalOpen(false);
                        fetchData();
                    }}
                />
            </Modal>

        </div>
    );
};

const SidebarLink = ({ icon, label, active = false }) => (
    <button className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all duration-300 group ${active ? 'bg-blue-600/10 text-white border border-blue-500/20' : 'text-slate-500 hover:bg-white/[0.02] hover:text-slate-300'
        }`}>
        <span className={`${active ? 'text-blue-500 scale-110' : 'group-hover:scale-110 transition-transform'}`}>{icon}</span>
        <span className={`font-black tracking-tighter text-sm uppercase ${active ? 'opacity-100' : 'opacity-30'}`}>{label}</span>
    </button>
);

const MobileLink = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-6 rounded-3xl ${active ? 'bg-blue-600 text-white border border-white/20' : 'glass-card text-slate-500 border-white/5'}`}>
        {icon} <span className="text-xl font-black italic tracking-tighter">{label}</span>
    </button>
);

const CategoryCard = ({ icon: Icon, name, tasks, color, index }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className={`glass-card group p-8 rounded-[40px] border-white/5 relative overflow-hidden cursor-pointer hover:border-blue-500/30`}
    >
        <div className="relative z-10 flex flex-col gap-8">
            <div className={`w-16 h-16 bg-gradient-to-tr ${color} rounded-2xl flex items-center justify-center shadow-2xl`}>
                <Icon className="text-white" size={32} />
            </div>
            <div>
                <h3 className="text-3xl font-black text-white italic tracking-tighter mb-2">{name}</h3>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[2px]">{tasks} Synced</p>
            </div>
        </div>
        <div className={`absolute -right-10 -bottom-10 w-32 h-32 bg-gradient-to-br ${color} opacity-[0.02] rounded-full blur-[40px] group-hover:opacity-10 transition-opacity`}></div>
    </motion.div>
);

const TaskRow = ({ task, onToggle, onDelete, index }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ x: 10 }}
        className={`group flex items-center gap-6 p-7 rounded-[40px] glass-panel border-white/5 hover:border-blue-500/30 transition-all ${task.completed ? 'bg-blue-600/[0.02]' : 'bg-white/[0.01]'}`}
    >
        <button
            onClick={onToggle}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${task.completed ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110' : 'border-[3px] border-slate-800 hover:border-blue-500 hover:scale-105'}`}
        >
            {task.completed && <CheckCircle2 size={20} />}
        </button>

        <div className="flex-1 min-w-0">
            <h4 className={`text-xl font-black tracking-tight mb-2 ${task.completed ? 'line-through text-slate-700' : 'text-white'}`}>{task.title}</h4>
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-[9px] font-black text-blue-500/80 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md">
                    {task.sites?.name || 'Private'}
                </span>
                <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    {task.categories?.name || 'Uncategorized'}
                </span>
            </div>
        </div>

        <button
            onClick={onDelete}
            className="p-3 text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
        >
            <Trash2 size={20} />
        </button>
    </motion.div>
);

export default Dashboard;
