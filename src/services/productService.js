import { supabase } from '../lib/supabase';

export const productService = {
    async getAll({ category, sort, search, limit = 20, offset = 0 } = {}) {
        let query = supabase
            .from('products')
            .select('*, categories(name, slug)', { count: 'exact' })
            .eq('is_active', true)
            .range(offset, offset + limit - 1);

        if (category) {
            query = query.eq('categories.slug', category);
        }
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }
        if (sort) {
            const [field, direction] = sort.split(':');
            query = query.order(field, { ascending: direction === 'asc' });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error, count } = await query;
        return { data, error, count };
    },

    async getBySlug(slug) {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name, slug)')
            .eq('slug', slug)
            .eq('is_active', true)
            .single();
        return { data, error };
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name, slug)')
            .eq('id', id)
            .single();
        return { data, error };
    },

    async getFeatured() {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name, slug)')
            .eq('is_active', true)
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .limit(8);
        return { data, error };
    },

    async getByCategory(categorySlug, limit = 12) {
        const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .single();

        if (!category) return { data: [], error: 'Category not found' };

        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name, slug)')
            .eq('category_id', category.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    async getRelated(productId, categoryId, limit = 4) {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name, slug)')
            .eq('category_id', categoryId)
            .eq('is_active', true)
            .neq('id', productId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    // Admin methods
    async create(product) {
        const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select()
            .single();
        return { data, error };
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    async delete(id) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        return { error };
    },

    async uploadImage(file, path) {
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(path, file);
        if (error) return { error };
        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(path);
        return { data: urlData.publicUrl, error: null };
    },
};
