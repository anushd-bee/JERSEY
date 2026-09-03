import { supabase } from '../lib/supabase';

export const categoryService = {
    /** All active categories — used by the public shop page */
    async getActive() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });
        return { data, error };
    },

    /** All categories (active + inactive) — used by admin */
    async getAll() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });
        return { data, error };
    },

    /** Categories joined with product count — used by admin list */
    async getAllWithCount() {
        const { data: cats, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });
        if (error) return { data: null, error };

        // Fetch product counts per category in one query
        const { data: counts } = await supabase
            .from('products')
            .select('category_id')
            .not('category_id', 'is', null);

        const countMap = {};
        (counts || []).forEach(p => {
            countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
        });

        const enriched = (cats || []).map(c => ({
            ...c,
            product_count: countMap[c.id] || 0,
        }));
        return { data: enriched, error: null };
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();
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
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    /** Safe delete — returns productCount; caller decides whether to proceed */
    async delete(id) {
        const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', id);

        if (count > 0) {
            return {
                error: { message: `This category has ${count} product${count > 1 ? 's' : ''}. Move or remove them before deleting.` },
                productCount: count,
            };
        }

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
        return { error, productCount: 0 };
    },

    /** Soft-delete: just mark inactive */
    async deactivate(id) {
        return categoryService.update(id, { is_active: false });
    },

    /** Upload category image to Supabase storage */
    async uploadImage(file) {
        const path = `categories/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const { error } = await supabase.storage
            .from('product-images')
            .upload(path, file);
        if (error) return { error };
        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(path);
        return { data: urlData.publicUrl, error: null };
    },
};
