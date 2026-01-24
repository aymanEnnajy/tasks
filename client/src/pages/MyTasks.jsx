import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CheckSquare, Search, Filter, Plus,
    Loader2, Trash2, CheckCircle2, Clock, Globe, Layout
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
                            placeholder="Filter database..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-6 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-bold text-sm text-white"
                        />
                    </div>
                    <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 p-3.5 rounded-2xl shadow-xl shadow-blue-600/30 active:scale-95 transition-all depth-button group"
                    >
                        <Plus size={24} className="text-white group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
            </header>

            <div className="space-y-4">
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                        <p className="font-black uppercase tracking-[6px] text-[10px] text-slate-600">Accessing Data Stream</p>
                    </div>
                ) : filteredTasks.length > 0 ? (
                    filteredTasks.map((task, idx) => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            index={idx}
                            onToggle={() => handleToggleTask(task.id, task.completed)}
                            onDelete={() => handleDeleteTask(task.id)}
                        />
                    ))
                ) : (
                    <div className="py-32 text-center border-[3px] border-dashed border-white/[0.03] rounded-[50px] bg-slate-900/10">
                        <CheckSquare size={48} className="mx-auto mb-6 text-slate-800" />
                        <p className="font-black italic text-2xl text-slate-600">No matching records found.</p>
                    </div>
                )}
            </div>

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
        </main>
    );
};

const TaskRow = ({ task, onToggle, onDelete, index }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.03 }}
        className={`group flex items-center gap-6 p-6 rounded-[30px] glass-panel border-white/5 hover:border-blue-500/30 transition-all ${task.completed ? 'bg-blue-600/[0.02]' : 'bg-white/[0.01]'}`}
    >
        <button
            onClick={onToggle}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${task.completed ? 'bg-blue-600 text-white' : 'border-2 border-slate-800 hover:border-blue-500'}`}
        >
            {task.completed && <CheckCircle2 size={20} />}
        </button>

        <div className="flex-1 min-w-0">
            <h4 className={`text-lg font-black tracking-tight mb-2 ${task.completed ? 'line-through text-slate-700' : 'text-white'}`}>{task.title}</h4>
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
            className="p-3 text-slate-800 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
        >
            <Trash2 size={18} />
        </button>
    </motion.div>
);

export default MyTasks;
