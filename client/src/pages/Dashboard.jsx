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
                const now = new Date().toISOString();
                setTasks(prev => prev.map(t => t.id === id ? { 
                    ...t, 
                    completed: !completed, 
                    completed_at: !completed ? now : null 
                } : t));
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

    // Helper for task classification
    const getTaskStatus = (task) => {
        const today = new Date().toISOString().split('T')[0];
        const deadline = task.end_day;

        if (task.completed) {
            const completedDate = task.completed_at ? task.completed_at.split('T')[0] : null;
            if (deadline && completedDate && completedDate > deadline) {
                return 'COMPLETED_LATE';
            }
            return 'COMPLETED_ON_TIME';
        }

        if (deadline) {
            if (deadline < today) return 'LATE';
            if (deadline === today) return 'DUE_TODAY';
            return 'UPCOMING';
        }
        return 'UPCOMING'; // No deadline
    };

    // Apply filters and sorting (ONLY PENDING TASKS FOR DASHBOARD)
    const filteredTasks = tasks
        .filter(t => {
            // Hard filter: only show pending tasks on Dashboard
            if (t.completed) return false;

            // Status filter (mostly redundant now but kept for consistency)
            const matchesStatus = filters.status === 'all' || 
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
        })
        .sort((a, b) => {
            const statusA = getTaskStatus(a);
            const statusB = getTaskStatus(b);

            const priority = {
                'LATE': 1,
                'DUE_TODAY': 2,
                'UPCOMING': 3,
                'COMPLETED_ON_TIME': 4,
                'COMPLETED_LATE': 5
            };

            if (priority[statusA] !== priority[statusB]) {
                return priority[statusA] - priority[statusB];
            }

            // Secondary sort: deadline ascending for pending tasks
            if (a.end_day && b.end_day && !a.completed && !b.completed) {
                return a.end_day.localeCompare(b.end_day);
            }

            // Default: newest first
            return new Date(b.created_at) - new Date(a.created_at);
        });

    const completedTasksList = tasks.filter(t => t.completed);
    const completedTasks = completedTasksList.length;
    const pendingTasks = tasks.length - completedTasks;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // KPI - Deadline Respect %
    const onTimeCompleted = completedTasksList.filter(t => getTaskStatus(t) === 'COMPLETED_ON_TIME').length;
    const deadlineRespect = completedTasks > 0 ? Math.round((onTimeCompleted / completedTasks) * 100) : 0;

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
                        Dashboard <span className="text-zinc-400 italic">Live.</span>
                    </motion.h2>
                    <div className="flex items-center gap-4 font-black text-zinc-500 text-[10px] uppercase tracking-widest bg-zinc-900 px-3 py-1.5 rounded-lg border border-white/5">
                        <Calendar size={14} className="text-zinc-400" />
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div className="glass-panel p-5 rounded-3xl min-w-[140px] border-zinc-500/10">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Pending</p>
                        <div className="text-3xl font-black text-white tracking-tight">{loading ? '...' : pendingTasks}</div>
                    </div>
                    <div className="glass-panel p-5 rounded-3xl min-w-[140px] border-emerald-500/10">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Completed</p>
                        <div className="text-3xl font-black text-emerald-400 tracking-tight">{loading ? '...' : completedTasks}</div>
                    </div>
                </div>
            </div>

            {/* KPI Section (Now at the top) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                <div className="glass-panel p-6 sm:p-10 rounded-[30px] sm:rounded-[50px] border-zinc-500/10 bg-gradient-to-br from-zinc-600/10 via-transparent to-transparent relative overflow-hidden group">
                    <div className="relative z-10">
                        <h4 className="font-black text-zinc-600 uppercase tracking-[3px] text-[10px] mb-6 sm:mb-8">Overall Productivity</h4>
                        <div className="flex items-end justify-between mb-4">
                            <span className="text-4xl sm:text-6xl font-black text-white tracking-tighter">{completionRate}%</span>
                            <TrendingUp className="text-zinc-500 mb-2 animate-bounce" size={24} />
                        </div>
                        <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden mb-6 sm:mb-8 border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${completionRate}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-zinc-500 shadow-[0_0_20px_rgba(113,113,122,0.6)]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 sm:pt-8">
                            <div>
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Success</p>
                                <p className="text-xl font-black text-emerald-500 italic">{completedTasks}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Remaining</p>
                                <p className="text-xl font-black text-zinc-500 italic">{pendingTasks}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 sm:p-10 rounded-[30px] sm:rounded-[50px] border-emerald-500/10 bg-gradient-to-br from-emerald-600/10 via-transparent to-transparent relative overflow-hidden group">
                    <div className="relative z-10">
                        <h4 className="font-black text-zinc-600 uppercase tracking-[3px] text-[10px] mb-6 sm:mb-8">Deadline Respect KPI</h4>
                        <div className="flex items-end justify-between mb-4">
                            <span className={`text-4xl sm:text-6xl font-black tracking-tighter ${deadlineRespect >= 80 ? 'text-emerald-400' : deadlineRespect >= 50 ? 'text-zinc-300' : 'text-rose-400'}`}>
                                {deadlineRespect}%
                            </span>
                            <Target className="text-emerald-500 mb-2" size={24} />
                        </div>
                        <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden mb-6 sm:mb-8 border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${deadlineRespect}%` }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                                className={`h-full shadow-[0_0_20px_rgba(113,113,122,0.6)] ${deadlineRespect >= 80 ? 'bg-emerald-500' : deadlineRespect >= 50 ? 'bg-zinc-500' : 'bg-rose-500'}`}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 sm:pt-8">
                            <div>
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">On Time</p>
                                <p className="text-xl font-black text-emerald-500 italic">{onTimeCompleted}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Completed Late</p>
                                <p className="text-xl font-black text-rose-500 italic">{completedTasks - onTimeCompleted}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 space-y-8">
                    {/* Filter controls were here, let's keep them accessible or move them */}
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-black text-white italic tracking-tight uppercase">Operational Stream</h3>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsTaskModalOpen(true)}
                                className="bg-zinc-700 hover:bg-zinc-600 p-2 rounded-xl shadow-lg shadow-zinc-700/20 active:scale-95 transition-all"
                            >
                                <Plus size={18} className="text-white" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-zinc-500 mb-4" size={32} />
                                <p className="font-black uppercase tracking-[6px] text-[10px] text-zinc-600">Accessing Cloud</p>
                            </div>
                        ) : filteredTasks.length > 0 ? (
                            <div className="space-y-4">
                                {paginatedTasks.map((task, idx) => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        index={idx}
                                        status={getTaskStatus(task)}
                                        onToggle={() => handleToggleTask(task.id, task.completed)}
                                        onDelete={() => handleDeleteClick(task.id)}
                                        onEdit={() => handleEditTask(task)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-32 text-center border-[3px] border-dashed border-white/[0.03] rounded-[50px] bg-zinc-900/10">
                                <p className="font-black italic text-2xl text-zinc-400">Inventory Empty.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Categories & Environment Sidebar */}
                <div className="space-y-8">
                    <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-zinc-950/20">
                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[3px] mb-8">Classification</h4>
                        <div className="space-y-4">
                            <button
                                onClick={() => setFilters({ ...filters, category: 'all' })}
                                className={`w-full text-left p-4 rounded-2xl transition-all border ${filters.category === 'all' ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">All Domains</span>
                                    <span className="text-[10px] font-black">{tasks.length}</span>
                                </div>
                            </button>
                            {categories.map((cat) => {
                                const Icon = IconMap[cat.icon] || Briefcase;
                                const count = tasks.filter(t => t.category_id === cat.id).length;
                                const isSelected = filters.category === cat.id.toString();
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setFilters({ ...filters, category: cat.id.toString() })}
                                        className={`w-full text-left p-4 rounded-2xl transition-all border group ${isSelected ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr ${cat.color_gradient || 'from-zinc-600 to-zinc-800'}`}>
                                                    <Icon size={16} className="text-white" />
                                                </div>
                                                <span className="font-bold">{cat.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black">{count}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-8 glass-card rounded-[40px] border-white/5">
                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[3px] mb-6">Network Nodes</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                            <span className="text-xs font-bold text-zinc-400 font-mono tracking-tight">Supabase: Linked</span>
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


const TaskRow = ({ task, status, onToggle, onDelete, onEdit, index }) => {
    const StatusBadge = () => {
        switch (status) {
            case 'LATE':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Late</span>
                    </div>
                );
            case 'DUE_TODAY':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Due Today</span>
                    </div>
                );
            case 'UPCOMING':
                return task.end_day ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-500/10 border border-zinc-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Upcoming</span>
                    </div>
                ) : null;
            case 'COMPLETED_LATE':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 border border-white/5 rounded-full">
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Late Completion</span>
                    </div>
                );
            case 'COMPLETED_ON_TIME':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">On Time</span>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ x: 10 }}
            className={`group flex items-center gap-6 p-7 rounded-[40px] glass-panel border-white/5 hover:border-zinc-500/30 transition-all ${task.completed ? 'bg-zinc-700/[0.02]' : 'bg-white/[0.01]'}`}
        >
            <button
                onClick={onToggle}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${task.completed ? 'bg-zinc-700 text-white shadow-[0_0_15px_rgba(113,113,122,0.5)] scale-110' : 'border-[3px] border-zinc-800 hover:border-zinc-500 hover:scale-105'}`}
            >
                {task.completed && <CheckCircle2 size={20} />}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                    <h4 className={`text-xl font-black tracking-tight ${task.completed ? 'line-through text-slate-700' : 'text-white'}`}>{task.title}</h4>
                    <StatusBadge />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-500/10 px-2 py-0.5 rounded-md">
                        {task.sites?.name || 'Private'}
                    </span>
                    <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        {task.categories?.name || 'Uncategorized'}
                    </span>
                    {task.end_day && (
                        <>
                            <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                            <div className="flex items-center gap-1">
                                <Clock size={10} className="text-slate-600" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    {task.end_day}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onEdit}
                    className="p-3 text-zinc-700 hover:text-zinc-400 hover:bg-zinc-500/10 rounded-2xl transition-all"
                >
                    <Edit2 size={20} />
                </button>
                <button
                    onClick={onDelete}
                    className="p-3 text-zinc-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </motion.div>
    );
};

export default Dashboard;
