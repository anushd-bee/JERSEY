import { supabase } from '../lib/supabase';

export const categoryService = {
    async getAll() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });
        return { data, error };
    },

    async getBySlug(slug) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single();
        return { data, error };
    },

    async create(category) {
        const { data, error } = await supabase
            .from('categories')
            .insert(category)
            .select()
            .single();
        return { data, error };
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    async delete(id) {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
        return { error };
    },
};
