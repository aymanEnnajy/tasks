import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, CheckSquare, BarChart3,
    Calendar, LogOut, Rocket, Menu, X,
    Search, Download, Bell, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user, signOut, role } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const userName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/dashboard' },
        { icon: <CheckSquare size={20} />, label: 'My Tasks', path: '/tasks' },
        { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/analytics' },
        { icon: <Calendar size={20} />, label: 'Schedule', path: '/schedule' },
        { icon: <User size={20} />, label: 'Account', path: '/account' },
    ];

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
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`w-full flex items-center gap-4 p-6 rounded-3xl ${location.pathname === item.path ? 'bg-blue-600 text-white border border-white/20' : 'glass-card text-slate-500 border-white/5'}`}
                                >
                                    {item.icon} <span className="text-xl font-black italic tracking-tighter">{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                        <button onClick={() => signOut()} className="flex items-center gap-3 text-rose-500 font-bold p-4">
                            <LogOut size={20} /> Logout
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 bg-[#020617] border-r border-white/[0.03] p-8 space-y-12 shrink-0 h-screen sticky top-0">
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
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all duration-300 group ${location.pathname === item.path ? 'bg-blue-600/10 text-white border border-blue-500/20' : 'text-slate-500 hover:bg-white/[0.02] hover:text-slate-300'}`}
                        >
                            <span className={`${location.pathname === item.path ? 'text-blue-500 scale-110' : 'group-hover:scale-110 transition-transform'}`}>{item.icon}</span>
                            <span className={`font-black tracking-tighter text-sm uppercase ${location.pathname === item.path ? 'opacity-100' : 'opacity-30'}`}>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto space-y-6 pt-12 border-t border-white/5">
                    <div className="flex items-center gap-3 px-2">
                        <Link to="/account" className="flex items-center gap-3 flex-1 min-w-0 group/profile">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-white/10 overflow-hidden shadow-xl group-hover/profile:border-blue-500/50 transition-colors">
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email}`} alt="User" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-white truncate group-hover/profile:text-blue-400 transition-colors">{userName}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{role || 'User'}</p>
                            </div>
                        </Link>
                        <button onClick={() => signOut()} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
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
                    </div>
                </header>

                {children}
            </div>
        </div>
    );
};

export default Layout;
