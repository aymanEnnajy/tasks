import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, CheckSquare, BarChart3,
    Calendar, LogOut, Rocket, Menu, X,
    Search, Download, Bell, User, BookMarked
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { TaskService } from '../services/taskService';
import NotificationPanel from './NotificationPanel';
import ExportModal from './ExportModal';

const Layout = ({ children }) => {
    const { user, signOut, role, dbUserId } = useAuth();
    const { globalSearchQuery, setGlobalSearchQuery } = useSearch();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            if (dbUserId) {
                try {
                    const { data: tasksData } = await TaskService.getTasks(dbUserId, role);
                    const { data: categoriesData } = await TaskService.getCategories(dbUserId);
                    if (tasksData) setTasks(tasksData);
                    if (categoriesData) setCategories(categoriesData);
                } catch (err) {
                    console.error('Failed to fetch data for export');
                }
            }
        };
        
        fetchTasks();
        // Refresh every 30 seconds
        const interval = setInterval(fetchTasks, 30000);
        return () => clearInterval(interval);
    }, [dbUserId, role]);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setGlobalSearchQuery(query);
        if (location.pathname !== '/tasks' && query.trim()) {
            navigate('/tasks');
        }
    };

    const userName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/dashboard' },
        { icon: <CheckSquare size={20} />, label: 'My Tasks', path: '/tasks' },
        { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/analytics' },
        { icon: <Calendar size={20} />, label: 'Schedule', path: '/schedule' },
        { icon: <BookMarked size={20} />, label: 'Articles', path: '/articles' },
        { icon: <User size={20} />, label: 'Account', path: '/account' },
    ];

    return (
        <div className="flex h-screen bg-black text-zinc-200 selection:bg-zinc-500/30 font-sans overflow-hidden">
            {/* Mobile Navbar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="fixed inset-0 z-50 lg:hidden bg-black flex flex-col p-8 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-12 flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-zinc-800/30">
                                    <Rocket size={24} className="text-white" />
                                </div>
                                <div>
                                    <span className="block text-2xl font-black text-white italic tracking-tighter uppercase leading-none">TASK<span className="text-zinc-400">PRO</span></span>
                                    <span className="text-[10px] uppercase font-black text-zinc-700 tracking-[3px] ml-1">Live Sync</span>
                                </div>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 glass-card rounded-xl text-white flex-shrink-0">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scrollable Navigation */}
                        <nav className="space-y-3 flex-1 overflow-y-auto pr-2">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all duration-300 group ${location.pathname === item.path ? 'bg-zinc-800/20 text-white border border-zinc-500/20' : 'text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300'}`}
                                >
                                    <span className={`${location.pathname === item.path ? 'text-white scale-110' : 'group-hover:scale-110 transition-transform'}`}>{item.icon}</span>
                                    <span className={`font-black tracking-tighter text-sm uppercase ${location.pathname === item.path ? 'opacity-100' : 'opacity-30'}`}>{item.label}</span>
                                </Link>
                            ))}
                        </nav>

                        {/* Footer with User Info */}
                        <div className="mt-auto space-y-6 pt-12 border-t border-white/5 flex-shrink-0">
                            <div className="flex items-center gap-3 px-2">
                                <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 flex-1 min-w-0 group/profile">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden shadow-xl group-hover/profile:border-zinc-500/50 transition-colors">
                                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email}`} alt="User" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-white truncate group-hover/profile:text-zinc-300 transition-colors">{userName}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{role || 'User'}</p>
                                    </div>
                                </Link>
                                <button onClick={() => signOut()} className="p-2 text-zinc-500 hover:text-white transition-colors">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 bg-black border-r border-white/[0.03] p-8 space-y-12 shrink-0 h-screen sticky top-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-zinc-800/30">
                        <Rocket size={24} className="text-white" />
                    </div>
                    <div>
                        <span className="block text-2xl font-black text-white italic tracking-tighter uppercase leading-none">TASK<span className="text-zinc-400">PRO</span></span>
                        <span className="text-[10px] uppercase font-black text-zinc-700 tracking-[3px] ml-1">Live Sync</span>
                    </div>
                </div>

                <nav className="space-y-3 flex-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all duration-300 group ${location.pathname === item.path ? 'bg-zinc-800/20 text-white border border-zinc-500/20' : 'text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300'}`}
                        >
                            <span className={`${location.pathname === item.path ? 'text-white scale-110' : 'group-hover:scale-110 transition-transform'}`}>{item.icon}</span>
                            <span className={`font-black tracking-tighter text-sm uppercase ${location.pathname === item.path ? 'opacity-100' : 'opacity-30'}`}>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto space-y-6 pt-12 border-t border-white/5">
                    <div className="flex items-center gap-3 px-2">
                        <Link to="/account" className="flex items-center gap-3 flex-1 min-w-0 group/profile">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden shadow-xl group-hover/profile:border-zinc-500/50 transition-colors">
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email}`} alt="User" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-white truncate group-hover/profile:text-zinc-300 transition-colors">{userName}</p>
                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{role || 'User'}</p>
                            </div>
                        </Link>
                        <button onClick={() => signOut()} className="p-2 text-zinc-500 hover:text-white transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="flex items-center justify-between p-4 lg:p-10 border-b border-white/[0.03] z-20 bg-black/50 backdrop-blur-3xl shrink-0">
                    <div className="flex items-center gap-3 lg:hidden">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2.5 glass-card rounded-xl text-white">
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Rocket size={18} className="text-zinc-400" />
                            <span className="text-sm font-black text-white italic tracking-tighter uppercase">TASK<span className="text-zinc-400">PRO</span></span>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl mx-8 hidden sm:block">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-400 transition-colors" size={20} />
                            <input
                                placeholder="Search live database..."
                                value={globalSearchQuery}
                                onChange={handleSearchChange}
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-6 focus:ring-2 focus:ring-zinc-500/50 focus:bg-zinc-900 focus:border-zinc-500 outline-none transition-all font-medium text-sm text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsExportOpen(true)}
                            className="hidden sm:flex items-center gap-2 px-5 py-3 glass-card rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-zinc-500/50 hover:bg-white/5 text-white transition-all">
                            <Download size={16} className="text-zinc-400" /> Export Data
                        </button>
                        <div className="w-[1px] h-6 bg-white/10 mx-2 hidden sm:block"></div>
                        <button 
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            className="p-3.5 glass-card rounded-2xl relative text-white hover:bg-white/[0.08] transition-colors"
                        >
                            <Bell size={20} />
                            {tasks.some(t => t.end_day && !t.completed) && (
                                <span className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_#ffffff] animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </header>

                {children}
                
                <NotificationPanel 
                    isOpen={isNotificationOpen} 
                    onClose={() => setIsNotificationOpen(false)}
                    tasks={tasks}
                />

                <ExportModal 
                    isOpen={isExportOpen} 
                    onClose={() => setIsExportOpen(false)}
                    tasks={tasks}
                    categories={categories}
                />
            </div>
        </div>
    );
};

export default Layout;
