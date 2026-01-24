import { useState, useEffect } from 'react';
import { TaskService } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import { Plus, Loader2, Globe, List, Layout, CheckCircle2, Type, AlignLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const TaskForm = ({ onSuccess, categories: initialCategories }) => {
    const { user, dbUserId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [subCategories, setSubCategories] = useState([]);
    const [sites, setSites] = useState([]);
    const [categories, setCategories] = useState(initialCategories || []);

    const [showAddSite, setShowAddSite] = useState(false);
    const [newSiteName, setNewSiteName] = useState('');
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showAddSubCategory, setShowAddSubCategory] = useState(false);
    const [newSubCategoryName, setNewSubCategoryName] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        sub_category_id: '',
        site_id: '',
        date: new Date().toISOString().split('T')[0],
        owner_id: dbUserId,
        completed: false
    });

    useEffect(() => {
        if (dbUserId) {
            setFormData(prev => ({ ...prev, owner_id: dbUserId }));
            fetchSites();
        }
    }, [dbUserId]);

    useEffect(() => {
        if (initialCategories) setCategories(initialCategories);
    }, [initialCategories]);

    const fetchSites = async () => {
        const { data } = await TaskService.getSites(dbUserId);
        if (data) setSites(data);
    };

    const handleCategoryChange = async (catId) => {
        setFormData({ ...formData, category_id: catId, sub_category_id: '' });
        if (catId) {
            const { data } = await TaskService.getSubCategories(parseInt(catId), dbUserId);
            if (data) setSubCategories(data);
        } else {
            setSubCategories([]);
        }
    };

    const handleAddSite = async () => {
        if (!newSiteName.trim()) return;
        setLoading(true);
        try {
            const { data } = await TaskService.addSite({ name: newSiteName, owner_id: dbUserId });
            if (data) {
                setSites([...sites, data]);
                setFormData({ ...formData, site_id: data.id });
                setNewSiteName('');
                setShowAddSite(false);
                toast.success('Professional site added!');
            }
        } catch (err) {
            toast.error('Site sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setLoading(true);
        try {
            const { data, error } = await TaskService.addCategory({
                name: newCategoryName,
                icon: 'Briefcase',
                color_gradient: 'from-blue-600 to-indigo-700',
                owner_id: dbUserId
            });
            if (data) {
                setCategories([...categories, data]);
                setFormData({ ...formData, category_id: data.id, sub_category_id: '' });
                setNewCategoryName('');
                setShowAddCategory(false);
                toast.success('Category architecture deployed!');
            }
            if (error) throw error;
        } catch (err) {
            toast.error('Category sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubCategory = async () => {
        if (!newSubCategoryName.trim() || !formData.category_id) return;
        setLoading(true);
        try {
            const { data, error } = await TaskService.addSubCategory({
                name: newSubCategoryName,
                category_id: parseInt(formData.category_id),
                owner_id: dbUserId
            });
            if (data) {
                setSubCategories([...subCategories, data]);
                setFormData({ ...formData, sub_category_id: data.id });
                setNewSubCategoryName('');
                setShowAddSubCategory(false);
                toast.success('Specialization modularized!');
            }
            if (error) throw error;
        } catch (err) {
            toast.error('Sub-category sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.category_id) return toast.error('Please select a domain/category');
        if (!dbUserId) return toast.error('User identification failed. Please re-login.');

        setLoading(true);
        try {
            // FIX: Convert empty strings to null for integer columns to avoid "invalid input syntax" error
            const submissionData = {
                ...formData,
                owner_id: dbUserId,
                category_id: formData.category_id ? parseInt(formData.category_id) : null,
                sub_category_id: formData.sub_category_id ? parseInt(formData.sub_category_id) : null,
                site_id: formData.site_id ? parseInt(formData.site_id) : null
            };

            const { error } = await TaskService.createTask(submissionData);
            if (error) {
                toast.error(error.message);
            } else {
                toast.success('Insight recorded successfully!');
                onSuccess();
            }
        } catch (err) {
            toast.error('Submission failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-4">
            <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[3px] ml-1">Objective Title</label>
                <div className="relative group">
                    <Type className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-blue-500" size={20} />
                    <input
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-slate-950/50 border border-white/5 rounded-[24px] py-5 pl-14 pr-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-950 outline-none transition-all text-white font-bold text-lg placeholder:text-slate-800"
                        placeholder="E.g. Finalize React Architecture"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[3px] ml-1">Description <span className="text-slate-800">(Optional)</span></label>
                <div className="relative group">
                    <AlignLeft className="absolute left-5 top-6 text-slate-600 transition-colors group-focus-within:text-blue-500" size={20} />
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="3"
                        className="w-full bg-slate-950/50 border border-white/5 rounded-[24px] py-5 pl-14 pr-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-950 outline-none transition-all text-white font-medium placeholder:text-slate-800 resize-none"
                        placeholder="Provide context or instructions..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-[3px]">Category</label>
                        <button
                            type="button"
                            onClick={() => setShowAddCategory(!showAddCategory)}
                            className="text-[10px] font-black text-blue-500 hover:text-white uppercase tracking-[2px] transition-colors"
                        >
                            {showAddCategory ? '[ Cancel ]' : '[ + New ]'}
                        </button>
                    </div>
                    {showAddCategory ? (
                        <div className="flex gap-2">
                            <input
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="flex-1 bg-slate-950 border border-blue-500/50 rounded-[24px] py-4 px-6 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-white font-bold text-sm"
                                placeholder="Category Name..."
                            />
                            <button
                                type="button"
                                onClick={handleAddCategory}
                                className="bg-blue-600 px-4 rounded-[20px] font-black text-white hover:bg-blue-500 transition-all text-[10px] tracking-widest uppercase"
                            >
                                Add
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <Layout className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                            <select
                                required
                                value={formData.category_id}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/5 rounded-[24px] py-5 pl-14 pr-10 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-white font-bold appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-slate-950">Select Module</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id} className="bg-slate-950">{cat.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-white">▼</div>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-[3px]">Specialization</label>
                        <button
                            type="button"
                            disabled={!formData.category_id}
                            onClick={() => setShowAddSubCategory(!showAddSubCategory)}
                            className="text-[10px] font-black text-blue-500 hover:text-white uppercase tracking-[2px] transition-colors disabled:opacity-20"
                        >
                            {showAddSubCategory ? '[ Cancel ]' : '[ + New ]'}
                        </button>
                    </div>
                    {showAddSubCategory ? (
                        <div className="flex gap-2">
                            <input
                                value={newSubCategoryName}
                                onChange={(e) => setNewSubCategoryName(e.target.value)}
                                className="flex-1 bg-slate-950 border border-blue-500/50 rounded-[24px] py-4 px-6 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-white font-bold text-sm"
                                placeholder="Sub-category..."
                            />
                            <button
                                type="button"
                                onClick={handleAddSubCategory}
                                className="bg-blue-600 px-4 rounded-[20px] font-black text-white hover:bg-blue-500 transition-all text-[10px] tracking-widest uppercase"
                            >
                                Add
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <List className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                            <select
                                value={formData.sub_category_id}
                                onChange={(e) => setFormData({ ...formData, sub_category_id: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/5 rounded-[24px] py-5 pl-14 pr-10 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-white font-bold appearance-none cursor-pointer disabled:opacity-20"
                                disabled={!formData.category_id}
                            >
                                <option value="" className="bg-slate-950">Select Skillset</option>
                                {subCategories.map(sub => (
                                    <option key={sub.id} value={sub.id} className="bg-slate-950">{sub.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-white">▼</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[3px]">Linked Enterprise Site</label>
                    <button
                        type="button"
                        onClick={() => setShowAddSite(!showAddSite)}
                        className="text-[10px] font-black text-blue-500 hover:text-white uppercase tracking-[2px] transition-colors"
                    >
                        {showAddSite ? '[ Cancel ]' : '[ + Register New Site ]'}
                    </button>
                </div>

                {showAddSite ? (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4"
                    >
                        <input
                            value={newSiteName}
                            onChange={(e) => setNewSiteName(e.target.value)}
                            className="flex-1 bg-slate-950 border border-blue-500/50 rounded-[20px] py-4 px-6 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-white font-bold"
                            placeholder="Enterprise Title..."
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={handleAddSite}
                            disabled={loading}
                            className="bg-blue-600 px-6 rounded-[20px] font-black text-white hover:bg-blue-500 transition-all uppercase text-[10px] tracking-widest"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
                        </button>
                    </motion.div>
                ) : (
                    <div className="relative">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                        <select
                            value={formData.site_id}
                            onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                            className="w-full bg-slate-950/50 border border-white/5 rounded-[24px] py-5 pl-14 pr-10 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-white font-bold appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-slate-950">Private Initiative (No Site)</option>
                            {sites.map(site => (
                                <option key={site.id} value={site.id} className="bg-slate-950">{site.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-white">▼</div>
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[28px] shadow-3xl shadow-blue-500/40 transition-all flex items-center justify-center gap-4 depth-button active:scale-[0.98] mt-4 uppercase tracking-[4px] text-xs border border-white/10"
            >
                {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                        Authorize & Deploy Task
                        <Rocket size={18} />
                    </>
                )}
            </button>
        </form>
    );
};

const Rocket = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.5 16.5C3.5 16.5 2 18 2 18L3.5 22L7.5 20.5C7.5 20.5 9 19 9 18C9 17.5 8.5 17 8 17H4.5V16.5Z" fill="currentColor" />
        <path d="M12 2C12 2 11.5 5.5 12.5 8.5L8.5 12.5C5.5 11.5 2 12 2 12C2 12 2 15 4 17L7 20L21 21L22 20L21 6L18 3C16 1 12 2 12 2Z" fill="currentColor" />
    </svg>
);

export default TaskForm;
