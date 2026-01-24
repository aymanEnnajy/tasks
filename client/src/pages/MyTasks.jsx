import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CheckSquare, Search, Filter, Plus,
    Loader2, Trash2, CheckCircle2, Clock, Globe, Layout, Edit2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TaskService } from '../services/taskService';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import toast from 'react-hot-toast';

const MyTasks = () => {
    const { user, dbUserId, role } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

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
                setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));
                toast.success(completed ? 'Task reopened' : 'Task completed! ✨');
            }
        } catch (error) {
            toast.error('Sync failed');
        }
    };

    const handleDeleteTask = async (id) => {
        try {
            const { error } = await TaskService.deleteTask(id);
            if (!error) {
                setTasks(prev => prev.filter(t => t.id !== id));
                toast.success('Record purged');
            }
        } catch (error) {
            toast.error('Deletion failed');
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const filteredTasks = tasks.filter(t =>
        t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl lg:text-6xl font-black text-white mb-4 tracking-tighter"
                    >
                        Task <span className="text-blue-500 italic">Inventory.</span>
                    </motion.h2>
                    <p className="text-slate-500 font-black uppercase tracking-[3px] text-[10px]">Total Records: {tasks.length}</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-6 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-bold text-sm text-white"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingTask(null);
                            setIsTaskModalOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 p-3.5 rounded-2xl shadow-xl shadow-blue-600/30 active:scale-95 transition-all depth-button group"
                    >
                        <Plus size={24} className="text-white group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
            </header>

            <div className="glass-panel rounded-[40px] border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[3px] w-20 text-center">Status</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Task Detail</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Category</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Site</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Deadline</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-32 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                                            <p className="font-black uppercase tracking-[6px] text-[10px] text-slate-600">Accessing Data Stream</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTasks.length > 0 ? (
                                filteredTasks.map((task, idx) => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        index={idx}
                                        onToggle={() => handleToggleTask(task.id, task.completed)}
                                        onDelete={() => handleDeleteTask(task.id)}
                                        onEdit={() => handleEditTask(task)}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-32 text-center">
                                        <CheckSquare size={48} className="mx-auto mb-6 text-slate-800" />
                                        <p className="font-black italic text-2xl text-slate-600">No matching records found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
        </main>
    );
};

const TaskRow = ({ task, onToggle, onDelete, onEdit, index }) => {
    // Helper to check if task is overdue
    const isOverdue = task.end_day && new Date(task.end_day) < new Date() && !task.completed;
    const isDueSoon = task.end_day && new Date(task.end_day) <= new Date(new Date().setDate(new Date().getDate() + 1)) && !task.completed;

    return (
        <motion.tr
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`group border-b border-white/5 hover:bg-white/[0.02] transition-colors ${task.completed ? 'opacity-50' : ''}`}
        >
            <td className="p-6 text-center">
                <button
                    onClick={onToggle}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all mx-auto ${task.completed ? 'bg-blue-600 text-white' : 'border border-slate-700 hover:border-blue-500'}`}
                >
                    {task.completed && <CheckCircle2 size={16} />}
                </button>
            </td>
            <td className="p-6">
                <div className="max-w-[300px]">
                    <h4 className={`text-sm font-bold tracking-tight mb-1 ${task.completed ? 'line-through text-slate-600' : 'text-slate-200'}`}>{task.title}</h4>
                    {task.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{task.description}</p>
                    )}
                </div>
            </td>
            <td className="p-6">
                <div className="flex items-center gap-2">
                    {task.categories?.icon && (
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${task.categories.color_gradient || 'from-slate-600 to-slate-500'}`}></div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300">{task.categories?.name || 'Uncategorized'}</span>
                        {task.sub_categories?.name && (
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">{task.sub_categories.name}</span>
                        )}
                    </div>
                </div>
            </td>
            <td className="p-6">
                {task.sites ? (
                    <span className="text-[10px] font-black text-blue-500/80 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-lg">
                        {task.sites.name}
                    </span>
                ) : (
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Private</span>
                )}
            </td>
            <td className="p-6">
                {task.end_day ? (
                    <div className={`flex items-center gap-2 ${isOverdue ? 'text-rose-500' : isDueSoon ? 'text-amber-500' : 'text-slate-400'}`}>
                        <Clock size={14} />
                        <span className="text-xs font-bold font-mono">
                            {new Date(task.end_day).toLocaleDateString()}
                        </span>
                    </div>
                ) : (
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">-</span>
                )}
            </td>
            <td className="p-6">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEdit}
                        className="p-2 text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                        title="Edit Task"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
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
