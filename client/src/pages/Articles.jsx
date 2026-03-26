import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    CheckSquare, Search, Filter, Plus,
    Loader2, Trash2, Edit2, ChevronLeft, ChevronRight, Download, ExternalLink, Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TaskService } from '../services/taskService';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';

const ARTICLES_PER_PAGE = 10;

const Articles = () => {
    const { dbUserId, role } = useAuth();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, articleId: null });
    const [formData, setFormData] = useState({ title: '', link: '', website: '' });
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (dbUserId) fetchArticles();
    }, [dbUserId]);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const { data, error } = await TaskService.getArticles(dbUserId);
            if (error) throw error;
            setArticles(data || []);
        } catch (err) {
            toast.error('Failed to fetch articles');
        } finally {
            setLoading(false);
        }
    };

    const handleAddArticle = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.link.trim() || !formData.website.trim()) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            if (editingArticle) {
                // Update
                const { error } = await TaskService.updateArticle(editingArticle.id, {
                    title: formData.title,
                    link: formData.link,
                    website: formData.website,
                });
                if (error) throw error;
                setArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...a, ...formData } : a));
                toast.success('Article updated!');
            } else {
                // Create
                const { data, error } = await TaskService.createArticle({
                    owner_id: dbUserId,
                    title: formData.title,
                    link: formData.link,
                    website: formData.website,
                });
                if (error) throw error;
                setArticles(prev => [data, ...prev]);
                toast.success('Article saved!');
            }
            setFormData({ title: '', link: '', website: '' });
            setEditingArticle(null);
            setShowForm(false);
        } catch (err) {
            toast.error(editingArticle ? 'Update failed' : 'Save failed');
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirmation({ isOpen: true, articleId: id });
    };

    const handleConfirmDelete = async () => {
        const { articleId } = deleteConfirmation;
        setDeleteConfirmation({ isOpen: false, articleId: null });

        try {
            const { error } = await TaskService.deleteArticle(articleId);
            if (error) throw error;
            setArticles(prev => prev.filter(a => a.id !== articleId));
            toast.success('Article deleted');
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const handleEditArticle = (article) => {
        setEditingArticle(article);
        setFormData({ title: article.title, link: article.link, website: article.website });
        setShowForm(true);
    };

    const handleImportJSON = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileContent = await file.text();
            const data = JSON.parse(fileContent);

            // Handle both formats: direct array or nested in articles property
            const articlesArray = Array.isArray(data) ? data : data.articles || [];

            if (!Array.isArray(articlesArray) || articlesArray.length === 0) {
                toast.error('Invalid JSON format. Expected array of articles or {articles: [...]}');
                return;
            }

            // Validate and prepare articles
            const validArticles = articlesArray.filter(a => {
                if (!a.title || !a.link || !a.website) {
                    console.warn('Skipping article with missing fields:', a);
                    return false;
                }
                return true;
            });

            if (validArticles.length === 0) {
                toast.error('No valid articles found in file. Each article needs: title, link, website');
                return;
            }

            // Insert articles into database
            let importedCount = 0;
            for (const article of validArticles) {
                try {
                    const { data: newArticle, error } = await TaskService.createArticle({
                        owner_id: dbUserId,
                        title: article.title,
                        link: article.link,
                        website: article.website,
                    });
                    if (!error && newArticle) {
                        importedCount++;
                    }
                } catch (err) {
                    console.error('Error importing article:', err);
                }
            }

            // Refresh articles list
            await fetchArticles();
            toast.success(`✅ Imported ${importedCount} articles successfully!`);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            toast.error('Failed to parse JSON file. Make sure it\'s valid JSON.');
        }
    };

    const handleExport = (format) => {
        if (articles.length === 0) {
            toast.error('No articles to export');
            return;
        }

        if (format === 'json') {
            exportJSON();
        } else if (format === 'csv') {
            exportCSV();
        } else if (format === 'pdf') {
            exportPDF();
        }
    };

    const exportJSON = () => {
        const dataStr = JSON.stringify({
            exportDate: new Date().toLocaleString(),
            totalArticles: articles.length,
            articles: articles
        }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `articles-${new Date().getTime()}.json`;
        link.click();
        toast.success('JSON exported');
    };

    const exportCSV = () => {
        const headers = ['Website', 'Article Title', 'Link', 'Created Date'];
        const rows = articles.map(a => [
            a.website,
            `"${a.title.replace(/"/g, '""')}"`,
            a.link,
            new Date(a.created_at).toLocaleDateString()
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `articles-${new Date().getTime()}.csv`;
        link.click();
        toast.success('CSV exported');
    };

    const exportPDF = async () => {
        try {
            // Dynamically load html2pdf from CDN
            if (!window.html2pdf) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                document.head.appendChild(script);
                await new Promise(resolve => {
                    script.onload = resolve;
                });
            }

            const element = document.createElement('div');
            element.innerHTML = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #1f2937;">
                    <h1 style="color: #1f2937; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                        Saved Articles Report
                    </h1>
                    <p style="color: #6b7280; margin-bottom: 20px;">
                        Generated on ${new Date().toLocaleString()}
                    </p>

                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead>
                            <tr style="background-color: #3b82f6; color: white;">
                                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: bold;">Website</th>
                                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: bold;">Article Title</th>
                                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: bold;">Link</th>
                                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: bold;">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${articles.map((a, idx) => `
                                <tr style="background-color: ${idx % 2 === 0 ? '#f9fafb' : 'white'};">
                                    <td style="border: 1px solid #d1d5db; padding: 12px; color: #1f2937; font-weight: 500;">${a.website}</td>
                                    <td style="border: 1px solid #d1d5db; padding: 12px; color: #1f2937;">${a.title}</td>
                                    <td style="border: 1px solid #d1d5db; padding: 12px; color: #3b82f6; text-decoration: underline; word-break: break-all;">${a.link}</td>
                                    <td style="border: 1px solid #d1d5db; padding: 12px; color: #6b7280;">${new Date(a.created_at).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; color: #1f2937;">
                        <p><strong>Total Articles:</strong> ${articles.length}</p>
                        <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            `;

            const opt = {
                margin: 10,
                filename: `articles-${new Date().getTime()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, backgroundColor: '#ffffff' },
                jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
            };

            window.html2pdf().set(opt).from(element).save();
            toast.success('PDF exported');
        } catch (err) {
            toast.error('PDF export failed');
        }
    };

    const totalPages = Math.ceil(articles.length / ARTICLES_PER_PAGE);
    const paginatedArticles = articles.slice(
        (currentPage - 1) * ARTICLES_PER_PAGE,
        currentPage * ARTICLES_PER_PAGE
    );

    return (
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-6xl font-black text-white mb-4 tracking-tighter"
                    >
                        Saved <span className="text-zinc-400 italic">Articles.</span>
                    </motion.h2>
                    <p className="text-zinc-500 font-black uppercase tracking-[3px] text-[10px]">Total Saved: {articles.length}</p>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 flex-wrap w-full md:w-auto">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-gradient-to-r from-zinc-600 to-zinc-700 hover:from-zinc-500 hover:to-zinc-600 text-white font-bold rounded-2xl shadow-lg shadow-zinc-700/40 transition-all flex items-center justify-center gap-2 border border-zinc-500/50"
                    >
                        <Upload size={18} />
                        <span className="text-[10px] sm:text-sm uppercase tracking-widest sm:tracking-normal">Import</span>
                    </motion.button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImportJSON}
                        className="hidden"
                    />

                    <div className="flex gap-2 w-full sm:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleExport('pdf')}
                            className="flex-1 sm:flex-none p-3 sm:px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2"
                            title="Export PDF"
                        >
                            <Download size={18} className="text-red-500" />
                            <span className="sm:hidden text-[10px] uppercase font-black">PDF</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleExport('csv')}
                            className="flex-1 sm:flex-none p-3 sm:px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2"
                            title="Export Excel"
                        >
                            <Download size={18} className="text-emerald-500" />
                            <span className="sm:hidden text-[10px] uppercase font-black">CSV</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleExport('json')}
                            className="flex-1 sm:flex-none p-3 sm:px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2"
                            title="Export JSON"
                        >
                            <Download size={18} className="text-blue-500" />
                            <span className="sm:hidden text-[10px] uppercase font-black">JSON</span>
                        </motion.button>

                        <button
                            onClick={() => {
                                setEditingArticle(null);
                                setFormData({ title: '', link: '', website: '' });
                                setShowForm(true);
                            }}
                            className="flex-1 sm:flex-none bg-zinc-700 hover:bg-zinc-600 p-3 sm:p-4 rounded-2xl shadow-xl shadow-zinc-700/30 active:scale-95 transition-all flex items-center justify-center border border-white/10"
                        >
                            <Plus size={24} className="text-white" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Form Modal */}
            {showForm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
                    onClick={() => setShowForm(false)}
                >
                        <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl p-8 w-full max-w-2xl"
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingArticle ? 'Edit Article' : 'Save Article'}
                        </h2>

                        <form onSubmit={handleAddArticle} className="space-y-6">
                            <div>
                                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                                    Website
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Medium, Dev.to, TechCrunch"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-3 px-6 focus:ring-2 focus:ring-zinc-500/50 outline-none transition-all font-bold text-white"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                                    Article Title
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter article title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-3 px-6 focus:ring-2 focus:ring-zinc-500/50 outline-none transition-all font-bold text-white"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                                    Article Link
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/article"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-3 px-6 focus:ring-2 focus:ring-zinc-500/50 outline-none transition-all font-bold text-white"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 py-4 bg-zinc-700 hover:bg-zinc-600 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest order-2 sm:order-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-4 bg-white text-black font-black rounded-2xl transition-all shadow-xl shadow-zinc-700/30 text-[10px] uppercase tracking-widest order-1 sm:order-2"
                                >
                                    {editingArticle ? 'Sync Update' : 'Persist Article'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}

            {/* Articles Table */}
            <div className="glass-panel rounded-[30px] sm:rounded-[40px] border-white/5 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[120px]">Website</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[250px]">Article Title</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[200px]">Link</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[120px]">Date</th>
                                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[3px] min-w-[100px] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-32 text-center text-zinc-500">Syncing data stream...</td>
                                </tr>
                            ) : paginatedArticles.length > 0 ? (
                                paginatedArticles.map((article, idx) => (
                                    <motion.tr
                                        key={article.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="group border-b border-white/5 hover:bg-white/[0.02] transition-all"
                                    >
                                        <td className="p-6 text-sm font-bold text-zinc-400">
                                            {article.website}
                                        </td>
                                        <td className="p-6 text-sm font-semibold text-white">
                                            {article.title}
                                        </td>
                                        <td className="p-6">
                                            <a
                                                href={article.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"
                                            >
                                                <span className="truncate max-w-xs">{article.link}</span>
                                                <ExternalLink size={16} className="flex-shrink-0" />
                                            </a>
                                        </td>
                                        <td className="p-6 text-sm text-zinc-400">
                                            {new Date(article.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditArticle(article)}
                                                    className="p-2 hover:bg-zinc-500/20 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(article.id)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-32 text-center text-zinc-700 italic font-black">No articles saved.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden divide-y divide-white/5">
                    {loading ? (
                        <div className="p-10 text-center text-zinc-600">Syncing...</div>
                    ) : paginatedArticles.length > 0 ? (
                        paginatedArticles.map((article, idx) => (
                            <div key={article.id} className="p-6 space-y-4 bg-zinc-900/40">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">{article.website}</span>
                                        <h4 className="font-bold text-white leading-snug">{article.title}</h4>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditArticle(article)} className="p-2.5 text-zinc-500 hover:text-white bg-white/5 rounded-xl">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteClick(article.id)} className="p-2.5 text-zinc-500 hover:text-rose-400 bg-white/5 rounded-xl">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-4 pt-2">
                                    <span className="text-[10px] font-bold text-zinc-600 font-mono">
                                        {new Date(article.created_at).toLocaleDateString()}
                                    </span>
                                    <a
                                        href={article.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-zinc-400/10 px-4 py-2 rounded-full border border-white/20"
                                    >
                                        Read Article <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center text-zinc-800 italic font-bold">No results</div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {paginatedArticles.length > 0 && totalPages > 1 && (
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
                        Page {currentPage} of {totalPages}
                    </span>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                title="Delete Article"
                message="Are you sure you want to delete this article? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmation({ isOpen: false, articleId: null })}
                isDangerous={true}
            />
        </main>
    );
};

export default Articles;
