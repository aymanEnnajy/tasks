import { motion, AnimatePresence } from 'framer-motion';
import { FileJson, FileSpreadsheet, FileText, Download, X } from 'lucide-react';

const ExportModal = ({ isOpen, onClose, tasks = [], categories = [] }) => {
    const exportToJSON = () => {
        const data = {
            exportDate: new Date().toISOString(),
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.completed).length,
            tasks: tasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                category: task.categories?.name || 'Uncategorized',
                subCategory: task.sub_categories?.name || null,
                site: task.sites?.name || null,
                completed: task.completed,
                createdAt: task.created_at,
                deadline: task.end_day || null
            }))
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportToExcel = () => {
        // Create CSV content (Excel can import CSV)
        let csvContent = 'ID,Title,Description,Category,Sub-Category,Site,Status,Created Date,Deadline\n';
        
        tasks.forEach(task => {
            const row = [
                task.id,
                `"${task.title?.replace(/"/g, '""') || ''}"`,
                `"${task.description?.replace(/"/g, '""') || ''}"`,
                task.categories?.name || 'Uncategorized',
                task.sub_categories?.name || '',
                task.sites?.name || 'Private',
                task.completed ? 'Completed' : 'Pending',
                new Date(task.created_at).toLocaleDateString(),
                task.end_day ? new Date(task.end_day).toLocaleDateString() : ''
            ];
            csvContent += row.join(',') + '\n';
        });

        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportToPDF = async () => {
        try {
            // Check if html2pdf is loaded, if not load it dynamically
            if (!window.html2pdf) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                document.head.appendChild(script);
                
                script.onload = () => {
                    generatePDF();
                };
            } else {
                generatePDF();
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error);
        }
    };

    const generatePDF = () => {
        const element = document.createElement('div');
        element.style.padding = '20px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.backgroundColor = '#fff';
        
        const completedCount = tasks.filter(t => t.completed).length;
        const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
        
        element.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 20px;">
                <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: bold;">TASK REPORT</h1>
                <p style="color: #6b7280; margin: 5px 0; font-size: 12px;">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h2 style="color: #374151; font-size: 14px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Summary Statistics</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background-color: #f3f4f6;">
                        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold; color: #1f2937;">Total Tasks</td>
                        <td style="padding: 10px; border: 1px solid #d1d5db; color: #1f2937;">${tasks.length}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold; color: #1f2937;">Completed</td>
                        <td style="padding: 10px; border: 1px solid #d1d5db; color: #000;">${completedCount}</td>
                    </tr>
                    <tr style="background-color: #f3f4f6;">
                        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold; color: #1f2937;">Pending</td>
                        <td style="padding: 10px; border: 1px solid #d1d5db; color: #6b7280;">${tasks.length - completedCount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold; color: #1f2937;">Completion Rate</td>
                        <td style="padding: 10px; border: 1px solid #d1d5db; color: #000; font-weight: bold;">${completionRate}%</td>
                    </tr>
                </table>
            </div>
            
            <div>
                <h2 style="color: #374151; font-size: 14px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Task Details</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background-color: #1f2937; color: #ffffff;">
                            <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Title</th>
                            <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Category</th>
                            <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Status</th>
                            <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Deadline</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasks.map((task, idx) => `
                            <tr style="background-color: ${idx % 2 === 0 ? '#f9fafb' : '#fff'};">
                                <td style="padding: 10px; border: 1px solid #d1d5db; color: #1f2937;">${task.title}</td>
                                <td style="padding: 10px; border: 1px solid #d1d5db; color: #1f2937;">${task.categories?.name || 'Uncategorized'}</td>
                                <td style="padding: 10px; border: 1px solid #d1d5db; color: ${task.completed ? '#000' : '#6b7280'}; font-weight: bold;">${task.completed ? 'Completed' : 'Pending'}</td>
                                <td style="padding: 10px; border: 1px solid #d1d5db; color: #1f2937;">${task.end_day ? new Date(task.end_day).toLocaleDateString() : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <p style="color: #6b7280;">This report was generated by DAILY TASK PRO</p>
            </div>
        `;

        const options = {
            margin: 10,
            filename: `tasks-export-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };

        window.html2pdf().set(options).from(element).save();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96"
                    >
                        <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-zinc-600/10 to-zinc-800/10 border-b border-white/10 p-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Download className="text-zinc-400" size={24} />
                                    <div>
                                        <h3 className="font-black text-white text-lg">Export Data</h3>
                                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Choose your format</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-500 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {/* JSON Export */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={exportToJSON}
                                    className="w-full p-4 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all group flex items-center gap-4"
                                >
                                    <div className="p-3 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                                        <FileJson className="text-zinc-400 group-hover:text-white" size={24} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <h4 className="font-bold text-white">JSON</h4>
                                        <p className="text-[10px] text-zinc-500">Structured data format</p>
                                    </div>
                                    <Download className="text-zinc-600 group-hover:text-white transition-colors" size={20} />
                                </motion.button>

                                {/* Excel Export */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={exportToExcel}
                                    className="w-full p-4 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all group flex items-center gap-4"
                                >
                                    <div className="p-3 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                                        <FileSpreadsheet className="text-zinc-400 group-hover:text-white" size={24} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <h4 className="font-bold text-white">Excel (CSV)</h4>
                                        <p className="text-[10px] text-zinc-500">Spreadsheet format</p>
                                    </div>
                                    <Download className="text-zinc-600 group-hover:text-white transition-colors" size={20} />
                                </motion.button>

                                {/* PDF Export */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={exportToPDF}
                                    className="w-full p-4 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all group flex items-center gap-4"
                                >
                                    <div className="p-3 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                                        <FileText className="text-zinc-400 group-hover:text-white" size={24} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <h4 className="font-bold text-white">PDF</h4>
                                        <p className="text-[10px] text-zinc-500">Professional report</p>
                                    </div>
                                    <Download className="text-zinc-600 group-hover:text-white transition-colors" size={20} />
                                </motion.button>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-white/10 p-4 bg-white/[0.02] text-center">
                                <p className="text-[9px] text-zinc-500 uppercase tracking-wider">
                                    Total Tasks: {tasks.length} | Completed: {tasks.filter(t => t.completed).length}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ExportModal;
