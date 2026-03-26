import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CheckSquare, Search, Filter, Plus,
    Loader2, Trash2, CheckCircle2, Clock, Globe, Layout, Edit2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useTaskHover } from '../context/TaskHoverContext';
import { TaskService } from '../services/taskService';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';

// ⚠️ CHANGE THIS NUMBER TO 10 FOR PRODUCTION (Currently 2 for testing)
const TASKS_PER_PAGE = 10;

const MyTasks = () => {
    const { user, dbUserId, role } = useAuth();
    const { globalSearchQuery, setGlobalSearchQuery } = useSearch();
    const { hoveredTaskId, setHoveredTaskId } = useTaskHover();
    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, taskId: null, deleteAll: false });
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ status: 'all', category: 'all', hasDeadline: 'all', dateFrom: '', dateTo: '' });

    useEffect(() => {
        if (globalSearchQuery) {
            setSearchTerm(globalSearchQuery);
        }
    }, [globalSearchQuery]);

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
            toast.error('Sync failure');
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
            toast.error('Sync failed');
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirmation({ isOpen: true, taskId: id });
    };

    const handleConfirmDelete = async () => {
        const { taskId, deleteAll } = deleteConfirmation;
        setDeleteConfirmation({ isOpen: false, taskId: null, deleteAll: false });

        try {
            if (deleteAll) {
                // Delete all tasks on current page
                for (const task of paginatedTasks) {
                    await TaskService.deleteTask(task.id);
                }
                setTasks(prev => prev.filter(t => !paginatedTasks.find(pt => pt.id === t.id)));
                toast.success(`${paginatedTasks.length} records purged`);
            } else {
                // Delete single task
                const { error } = await TaskService.deleteTask(taskId);
                if (!error) {
                    setTasks(prev => prev.filter(t => t.id !== taskId));
                    toast.success('Record purged');
                }
            }
        } catch (error) {
            toast.error('Deletion failed');
        }
    };

    const handleDeleteAllPage = () => {
        setDeleteConfirmation({ isOpen: true, taskId: null, deleteAll: true });
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const filteredTasks = tasks.filter(t => {
        // Search filter
        const matchesSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase());
        
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
        
        return matchesSearch && matchesStatus && matchesCategory && matchesDeadline && matchesDateRange;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
    const paginatedTasks = filteredTasks.slice(
        (currentPage - 1) * TASKS_PER_PAGE,
        currentPage * TASKS_PER_PAGE
    );

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl lg:text-6xl font-black text-white mb-4 tracking-tighter"
                    >
                        Task <span className="text-zinc-400 italic">Inventory.</span>
                    </motion.h2>
                    <p className="text-zinc-500 font-black uppercase tracking-[3px] text-[10px]">Total Records: {tasks.length}</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" size={18} />
                        <input
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => {
                                const query = e.target.value;
                                setSearchTerm(query);
                                setGlobalSearchQuery(query);
                            }}
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-6 focus:ring-2 focus:ring-zinc-500/50 outline-none transition-all font-bold text-sm text-white"
                        />
                    </div>
                    {paginatedTasks.length > 0 && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDeleteAllPage}
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-600/40 transition-all flex items-center gap-2 border border-red-500/50 group"
                        >
                            <Trash2 size={20} className="group-hover:animate-pulse" />
                            <span className="text-sm">Delete Page</span>
                        </motion.button>
                    )}
                    <button
                        onClick={() => {
                            setEditingTask(null);
                            setIsTaskModalOpen(true);
                        }}
                        className="bg-zinc-700 hover:bg-zinc-600 p-3.5 rounded-2xl shadow-xl shadow-zinc-700/30 active:scale-95 transition-all depth-button group"
                    >
                        <Plus size={24} className="text-white group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
            </header>

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
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider block mb-3">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => {
                                    setFilters({ ...filters, status: e.target.value });
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-zinc-800/50 border border-white/10 rounded-xl py-2 px-4 text-white font-bold text-sm focus:ring-2 focus:ring-zinc-500/50 outline-none"
                            >
                                <option value="all">All Tasks</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider block mb-3">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => {
                                    setFilters({ ...filters, category: e.target.value });
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-zinc-800/50 border border-white/10 rounded-xl py-2 px-4 text-white font-bold text-sm focus:ring-2 focus:ring-zinc-500/50 outline-none"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Deadline Filter */}
                        <div>
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider block mb-3">Deadline</label>
                            <select
                                value={filters.hasDeadline}
                                onChange={(e) => {
                                    setFilters({ ...filters, hasDeadline: e.target.value });
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-zinc-800/50 border border-white/10 rounded-xl py-2 px-4 text-white font-bold text-sm focus:ring-2 focus:ring-zinc-500/50 outline-none"
                            >
                                <option value="all">All Tasks</option>
                                <option value="hasDeadline">Has Deadline</option>
                                <option value="noDeadline">No Deadline</option>
                            </select>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="mt-6">
                        <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider block mb-3">Created Date Range</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-zinc-500 block mb-2">From</label>
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => {
                                        setFilters({ ...filters, dateFrom: e.target.value });
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl py-2 px-4 text-white font-bold text-sm focus:ring-2 focus:ring-zinc-500/50 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 block mb-2">To</label>
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => {
                                        setFilters({ ...filters, dateTo: e.target.value });
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl py-2 px-4 text-white font-bold text-sm focus:ring-2 focus:ring-zinc-500/50 outline-none"
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
                                setFilters({ status: 'all', category: 'all', hasDeadline: 'all' });
                                setCurrentPage(1);
                            }}
                            className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-xl transition-colors"
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
                            ? 'bg-zinc-700 text-white border-zinc-500/50'
                            : 'bg-zinc-800/50 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                >
                    <Filter size={20} />
                    <span className="text-sm">Filters</span>
                    {Object.values(filters).some(f => f !== 'all') && (
                        <span className="ml-2 px-2 py-1 bg-zinc-500 text-white text-xs font-bold rounded">
                            {Object.values(filters).filter(f => f !== 'all').length}
                        </span>
                    )}
                </motion.button>
                <p className="text-zinc-500 text-sm font-bold">
                    Showing {filteredTasks.length} of {tasks.length} tasks
                </p>
            </div>

            <div className="glass-panel rounded-[40px] border-white/5 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[80px] text-center">Status</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[200px]">Task Detail</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[180px]">Description</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[120px]">Category</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[120px]">Site</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[140px]">Deadline</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[140px]">Created</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[120px] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-32 text-center text-zinc-500">Loading dynamic data...</td>
                                </tr>
                            ) : filteredTasks.length > 0 ? (
                                paginatedTasks.map((task, idx) => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        index={idx}
                                        isHighlighted={hoveredTaskId === task.id}
                                        onToggle={() => handleToggleTask(task.id, task.completed)}
                                        onDelete={() => handleDeleteClick(task.id)}
                                        onEdit={() => handleEditTask(task)}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="py-32 text-center text-zinc-500 font-bold italic text-2xl">No records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden divide-y divide-white/5">
                    {loading ? (
                        <div className="p-10 text-center text-zinc-500">Syncing...</div>
                    ) : filteredTasks.length > 0 ? (
                        paginatedTasks.map((task, idx) => (
                            <div key={task.id} className="p-6 space-y-4 bg-zinc-900/40">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-bold text-white mb-1 ${task.completed ? 'line-through opacity-50' : ''}`}>{task.title}</h4>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase bg-zinc-400/10 px-2 py-0.5 rounded-md">
                                                {task.categories?.name || 'Global'}
                                            </span>
                                            {task.sites && (
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                    @{task.sites.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleTask(task.id, task.completed)}
                                        className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${task.completed ? 'bg-zinc-700 text-white' : 'border border-zinc-700'}`}
                                    >
                                        <CheckCircle2 size={18} />
                                    </button>
                                </div>
                                {task.description && (
                                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{task.description}</p>
                                )}
                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex items-center gap-3 text-zinc-500">
                                        {task.end_day && (
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} className={new Date(task.end_day) < new Date() && !task.completed ? 'text-rose-500' : ''} />
                                                <span className="text-[10px] font-bold font-mono">{new Date(task.end_day).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEditTask(task)} className="p-2.5 text-zinc-600 hover:text-white bg-white/5 rounded-xl">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteClick(task.id)} className="p-2.5 text-zinc-600 hover:text-rose-400 bg-white/5 rounded-xl">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center text-zinc-700 italic font-bold">No results</div>
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            {filteredTasks.length > 0 && (
                <div className="flex items-center justify-center gap-6 pb-10">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/10 hover:border-zinc-500/50"
                    >
                        <ChevronLeft size={20} className="text-white" />
                    </button>

                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                                    currentPage === page
                                        ? 'bg-zinc-700 text-white shadow-lg shadow-zinc-700/50'
                                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/10 hover:border-zinc-500/50"
                    >
                        <ChevronRight size={20} className="text-white" />
                    </button>

                    <span className="text-zinc-500 font-bold ml-4">
                        Page {currentPage} of {totalPages} • Showing {paginatedTasks.length} of {filteredTasks.length} tasks
                    </span>
                </div>
            )}

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
                title={deleteConfirmation.deleteAll ? "Delete All Tasks on Page" : "Delete Task"}
                message={deleteConfirmation.deleteAll ? `Are you sure you want to delete all ${paginatedTasks.length} tasks on this page? This action cannot be undone.` : "Are you sure you want to delete this task? This action cannot be undone."}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmation({ isOpen: false, taskId: null, deleteAll: false })}
                isDangerous={true}
            />
        </main>
    );
};

const TaskRow = ({ task, onToggle, onDelete, onEdit, index, isHighlighted }) => {
    // Helper for task classification
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = !task.completed && task.end_day && task.end_day < today;
    const isDueToday = !task.completed && task.end_day && task.end_day === today;
    
    // Completed late check
    const isCompletedLate = task.completed && task.end_day && task.completed_at && task.completed_at.split('T')[0] > task.end_day;

    return (
        <motion.tr
            id={`task-${task.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`group border-b border-white/5 hover:bg-white/[0.02] transition-all ${task.completed ? 'opacity-50' : ''} ${
                isHighlighted ? 'bg-zinc-500/20 border-zinc-500/50' : ''
            }`}
            onMouseLeave={() => {
                // Automatically remove highlight after a delay
            }}
        >
            <td className="p-6 text-center">
                <button
                    onClick={onToggle}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all mx-auto ${task.completed ? 'bg-zinc-700 text-white' : 'border border-zinc-700 hover:border-zinc-500'}`}
                >
                    {task.completed && <CheckCircle2 size={16} />}
                </button>
            </td>
            <td className="p-6">
                <div className="max-w-[300px]">
                    <h4 className={`text-sm font-bold tracking-tight mb-1 ${task.completed ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>{task.title}</h4>
                </div>
            </td>
            <td className="p-6">
                <div className="max-w-[250px]">
                    {task.description ? (
                        <p className="text-[10px] text-zinc-400 line-clamp-3 leading-relaxed">{task.description}</p>
                    ) : (
                        <p className="text-[10px] text-zinc-700 italic">No description</p>
                    )}
                </div>
            </td>
            <td className="p-6">
                <div className="flex items-center gap-2">
                    {task.categories?.icon && (
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${task.categories.color_gradient || 'from-zinc-600 to-zinc-500'}`}></div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-300">{task.categories?.name || 'Uncategorized'}</span>
                        {task.sub_categories?.name && (
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">{task.sub_categories.name}</span>
                        )}
                    </div>
                </div>
            </td>
            <td className="p-6">
                {task.sites ? (
                    <span className="text-[10px] font-black text-zinc-400/80 uppercase tracking-widest bg-zinc-400/10 px-2 py-1 rounded-lg">
                        {task.sites.name}
                    </span>
                ) : (
                    <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Private</span>
                )}
            </td>
            <td className="p-6">
                {task.end_day ? (
                    <div className={`flex items-center gap-2 ${isOverdue || isCompletedLate ? 'text-rose-500' : isDueToday ? 'text-amber-500' : 'text-zinc-400'}`}>
                        <Clock size={14} />
                        <span className="text-xs font-bold font-mono">
                            {new Date(task.end_day).toLocaleDateString()}
                            {isCompletedLate && " (Late)"}
                        </span>
                    </div>
                ) : (
                    <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">-</span>
                )}
            </td>
            <td className="p-6">
                <div className="text-xs font-bold text-zinc-400">
                    {task.created_at ? new Date(task.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }) : '-'}
                </div>
            </td>
            <td className="p-6">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEdit}
                        className="p-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-400/10 rounded-lg transition-all"
                        title="Edit Task"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete Task"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </motion.tr>
    );
};

export default MyTasks;
