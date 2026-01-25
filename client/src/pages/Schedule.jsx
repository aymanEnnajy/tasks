import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Plus, Clock, Bell
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTaskHover } from '../context/TaskHoverContext';
import { TaskService } from '../services/taskService';

const Schedule = () => {
    const { user, dbUserId, role } = useAuth();
    const { setHoveredTaskId } = useTaskHover();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        if (dbUserId) fetchData();
    }, [dbUserId, role]);

    const fetchData = async () => {
        const { data } = await TaskService.getTasks(dbUserId, role);
        if (data) setTasks(data);
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    return (
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl lg:text-6xl font-black text-white mb-4 tracking-tighter"
                    >
                        Time <span className="text-blue-500 italic">Grid.</span>
                    </motion.h2>
                    <div className="flex items-center gap-4">
                        <button onClick={prevMonth} className="p-2 glass-card rounded-xl text-slate-400 hover:text-white transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <h3 className="text-2xl font-black text-white italic tracking-tight w-48 text-center">
                            {format(currentDate, 'MMMM yyyy')}
                        </h3>
                        <button onClick={nextMonth} className="p-2 glass-card rounded-xl text-slate-400 hover:text-white transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="glass-panel rounded-[50px] border-white/5 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-white/5 bg-slate-900/50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-[3px]">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {calendarDays.map((day, i) => {
                        const dayTasks = tasks.filter(t => isSameDay(new Date(t.date || t.created_at), day));
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={i}
                                className={`min-h-[140px] p-4 border-r border-b border-white/5 transition-all hover:bg-white/[0.02] ${!isCurrentMonth ? 'opacity-20' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-sm font-black ${isToday ? 'text-blue-500' : 'text-slate-500'}`}>
                                        {format(day, 'd')}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {dayTasks.slice(0, 3).map(task => (
                                        <motion.div 
                                            key={task.id} 
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setHoveredTaskId(task.id);
                                                navigate('/tasks');
                                                // Scroll to task after navigation
                                                setTimeout(() => {
                                                    const element = document.getElementById(`task-${task.id}`);
                                                    if (element) {
                                                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        element.classList.add('highlight-task');
                                                        setTimeout(() => element.classList.remove('highlight-task'), 2000);
                                                    }
                                                }, 100);
                                            }}
                                            className="text-[9px] font-black text-white bg-slate-800/50 p-2 rounded-lg truncate border border-white/5 hover:border-blue-500 hover:bg-blue-500/20 cursor-pointer transition-all"
                                            title={task.title}
                                        >
                                            {task.title}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
};

export default Schedule;
