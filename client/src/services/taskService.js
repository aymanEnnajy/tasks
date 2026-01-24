import { supabase } from './supabase';

export const TaskService = {
    // Categories
    getCategories: async () => {
        return await supabase.from('categories').select('*');
    },

    // Sub-categories
    getSubCategories: async (categoryId) => {
        return await supabase.from('sub_categories').select('*').eq('category_id', categoryId);
    },

    // Sites
    getSites: async (userId) => {
        return await supabase.from('sites').select('*').eq('owner_id', userId);
    },

    addSite: async (siteData) => {
        return await supabase.from('sites').insert(siteData).select().single();
    },

    // Tasks 
    getTasks: async (userId, role) => {
        let query = supabase.from('tasks').select(`
            *,
            categories(name, icon, color_gradient),
            sub_categories(name),
            sites(name)
        `);

        if (role !== 'ADMIN') {
            query = query.eq('owner_id', userId);
        }
        return await query.order('created_at', { ascending: false });
    },

    createTask: async (taskData) => {
        return await supabase.from('tasks').insert(taskData).select().single();
    },

    toggleTask: async (id, currentStatus) => {
        return await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
    },

    deleteTask: async (id) => {
        return await supabase.from('tasks').delete().eq('id', id);
    }
};
