import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Calendar, CheckSquare, Clock,
    LayoutDashboard, LogOut, Plus, Settings,
    Briefcase, GraduationCap, Trophy, Apple,
    Search, Bell, Download, Filter, Menu, X,
    TrendingUp, Users, Target, Rocket, Trash2, CheckCircle2, Loader2, Edit2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TaskService } from '../services/taskService';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';

// ⚠️ CHANGE THIS NUMBER TO 10 FOR PRODUCTION (Currently 2 for testing)
const TASKS_PER_PAGE = 10;

const Dashboard = () => {
    const { user, dbUserId, role } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, taskId: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ status: 'all', category: 'all', hasDeadline: 'all', dateFrom: '', dateTo: '' });

    useEffect(() => {
        if (dbUserId) fetchData();
    }, [dbUserId, role]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, taskRes] = await Promise.all([
                TaskService.getCategories(dbUserId),
                TaskService.getTasks(dbUserId, role)
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

    const handleDeleteClick = (id) => {
        setDeleteConfirmation({ isOpen: true, taskId: id });
    };

    const handleConfirmDelete = async () => {
        const { taskId } = deleteConfirmation;
        setDeleteConfirmation({ isOpen: false, taskId: null });

        try {
            const { error } = await TaskService.deleteTask(taskId);
            if (!error) {
                setTasks(prev => prev.filter(t => t.id !== taskId));
                toast.success('Task removed');
            }
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const IconMap = { Briefcase, GraduationCap, Trophy, Apple };

    // Apply filters
    const filteredTasks = tasks.filter(t => {
        // Status filter
        const matchesStatus = filters.status === 'all' || 
            (filters.status === 'completed' && t.completed) ||
            (filters.status === 'pending' && !t.completed);
        
        // Category filter
        const matchesCategory = filters.category === 'all' || t.category_id === parseInt(filters.category);
        
        // Deadline filter
        const matchesDeadline = filters.hasDeadline === 'all' ||
            (filters.hasDeadline === 'hasDeadline' && t.end_day) ||
            (filters.hasDeadline === 'noDeadline' && !t.end_day);
        
        // Date range filter
        let matchesDateRange = true;
        if (filters.dateFrom || filters.dateTo) {
            const taskDate = new Date(t.created_at);
            if (filters.dateFrom) {
                const fromDate = new Date(filters.dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                matchesDateRange = matchesDateRange && taskDate >= fromDate;
            }
            if (filters.dateTo) {
                const toDate = new Date(filters.dateTo);
                toDate.setHours(23, 59, 59, 999);
                matchesDateRange = matchesDateRange && taskDate <= toDate;
            }
        }
        
        return matchesStatus && matchesCategory && matchesDeadline && matchesDateRange;
    });

    const completedTasks = filteredTasks.filter(t => t.completed).length;
    const pendingTasks = filteredTasks.length - completedTasks;
    const completionRate = filteredTasks.length > 0 ? Math.round((completedTasks / filteredTasks.length) * 100) : 0;

    // Pagination logic
    const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
    const paginatedTasks = filteredTasks.slice(
        (currentPage - 1) * TASKS_PER_PAGE,
        currentPage * TASKS_PER_PAGE
    );

    return (
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

            {/* Filter Panel */}
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: showFilters ? 1 : 0, height: showFilters ? 'auto' : 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`overflow-hidden ${showFilters ? 'block' : 'hidden'}`}
            >
                <div className="glass-panel rounded-[40px] border-white/5 p-8">
                    <h3 className="text-xl font-bold text-white mb-6">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Status Filter */}
                        <div>
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider block mb-3">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => {
                                    setFilters({ ...filters, status: e.target.value });
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 px-4 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                            >
                                <option value="all">All Tasks</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider block mb-3">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => {
                                    setFilters({ ...filters, category: e.target.value });
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 px-4 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Deadline Filter */}
                        <div>
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider block mb-3">Deadline</label>
                            <select
                                value={filters.hasDeadline}
                                onChange={(e) => {
                                    setFilters({ ...filters, hasDeadline: e.target.value });
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 px-4 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                            >
                                <option value="all">All Tasks</option>
                                <option value="hasDeadline">Has Deadline</option>
                                <option value="noDeadline">No Deadline</option>
                            </select>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="mt-6">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider block mb-3">Created Date Range</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 block mb-2">From</label>
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => {
                                        setFilters({ ...filters, dateFrom: e.target.value });
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 px-4 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-2">To</label>
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => {
                                        setFilters({ ...filters, dateTo: e.target.value });
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 px-4 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reset Filters Button */}
                    <div className="mt-6 flex gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setFilters({ status: 'all', category: 'all', hasDeadline: 'all', dateFrom: '', dateTo: '' });
                                setCurrentPage(1);
                            }}
                            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                        >
                            Reset Filters
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Filter Toggle Button */}
            <div className="flex gap-4 items-center">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-6 py-3 font-bold rounded-2xl transition-all flex items-center gap-2 border ${
                        showFilters
                            ? 'bg-blue-600 text-white border-blue-500/50'
                            : 'bg-slate-800/50 text-slate-400 border-white/10 hover:text-white'
                    }`}
                >
                    <Filter size={20} />
                    <span className="text-sm">Filters</span>
                    {Object.values(filters).some(f => f !== 'all') && (
                        <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                            {Object.values(filters).filter(f => f !== 'all').length}
                        </span>
                    )}
                </motion.button>
                <p className="text-slate-500 text-sm font-bold">
                    Showing {filteredTasks.length} of {tasks.length} tasks
                </p>
            </div>

            {/* Task List Section */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-black text-white italic tracking-tight uppercase">Database Flow</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                Synced: <span className="text-blue-500">{filteredTasks.length}</span>
                            </span>
                            <button
                                onClick={() => setIsTaskModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-500 p-2 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                            >
                                <Plus size={18} className="text-white" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                                <p className="font-black uppercase tracking-[6px] text-[10px] text-slate-600">Accessing Cloud</p>
                            </div>
                        ) : tasks.length > 0 ? (
                            <>
                                <div className="space-y-4">
                                    {paginatedTasks.map((task, idx) => (
                                        <TaskRow
                                            key={task.id}
                                            task={task}
                                            index={idx}
                                            onToggle={() => handleToggleTask(task.id, task.completed)}
                                            onDelete={() => handleDeleteClick(task.id)}
                                            onEdit={() => handleEditTask(task)}
                                        />
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Page {currentPage} of {totalPages} • Showing {paginatedTasks.length} of {filteredTasks.length} tasks
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="p-2 glass-card rounded-lg hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronLeft className="text-slate-400" size={18} />
                                            </button>
                                            <div className="flex gap-1">
                                                {Array.from({ length: totalPages }).map((_, i) => (
                                                    <button
                                                        key={i + 1}
                                                        onClick={() => setCurrentPage(i + 1)}
                                                        className={`w-8 h-8 rounded-lg font-bold text-[10px] transition-all ${
                                                            currentPage === i + 1
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-2 glass-card rounded-lg hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronRight className="text-slate-400" size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
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
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                            <span className="text-xs font-bold text-slate-400 font-mono tracking-tight">Supabase: Connected</span>
                        </div>
                    </div>
                </div>
            </section>

            <Modal
                isOpen={isTaskModalOpen}
                onClose={() => {
                    setIsTaskModalOpen(false);
                    setEditingTask(null);
                }}
                title={editingTask ? "Refactor Object" : "Register Data Row"}
            >
                <TaskForm
                    categories={categories}
                    task={editingTask}
                    onSuccess={() => {
                        setIsTaskModalOpen(false);
                        setEditingTask(null);
                        fetchData();
                    }}
                />
            </Modal>

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmation({ isOpen: false, taskId: null })}
                isDangerous={true}
            />
        </div>
    );
};

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

const TaskRow = ({ task, onToggle, onDelete, onEdit, index }) => (
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

        <div className="flex items-center gap-2">
            <button
                onClick={onEdit}
                className="p-3 text-slate-700 hover:text-blue-500 hover:bg-blue-500/10 rounded-2xl transition-all"
            >
                <Edit2 size={20} />
            </button>
            <button
                onClick={onDelete}
                className="p-3 text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
            >
                <Trash2 size={20} />
            </button>
        </div>
    </motion.div>
);

export default Dashboard;
