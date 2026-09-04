import { supabase } from '../lib/supabase';

export const productService = {
    async getAll({ category, sort, search, limit = 60, offset = 0 } = {}) {
        let query = supabase
            .from('products')
            .select('*, categories(name, slug, image, is_active)', { count: 'exact' })
            .eq('is_active', true)
            .range(offset, offset + limit - 1);

        // Filter by category slug — resolve to category_id via sub-select
        if (category) {
            const { data: cat } = await supabase
                .from('categories')
                .select('id')
                .eq('slug', category)
                .single();
            if (cat?.id) {
                query = query.eq('category_id', cat.id);
            } else {
                // Unknown category slug — return empty
                return { data: [], error: null, count: 0 };
            }
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


    // Returns only products that have an active offer (compare_price set and > price)
    async getOffers({ sort, search } = {}) {
        let query = supabase
            .from('products')
            .select('*, categories(name, slug)')
            .eq('is_active', true)
            .eq('is_offer', true)
            .not('compare_price', 'is', null);

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }
        if (sort) {
            const [field, direction] = sort.split(':');
            query = query.order(field, { ascending: direction === 'asc' });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        return { data, error };
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

    async getPublicByIdentifier(identifier) {
        const slug = typeof identifier === 'string' ? identifier.trim() : '';
        if (!slug || slug.length > 160 || /[/?#]/.test(slug)) {
            return { data: null, error: null };
        }

        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name, slug)')
            .eq('slug', slug)
            .eq('is_active', true)
            .maybeSingle();
        return { data, error };
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name, slug)')
            .eq('id', id)
            .eq('is_active', true)
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
        if (!product?.category_id) {
            return { data: null, error: { message: 'Please select a category.' } };
        }

        const { data: category, error: categoryError } = await supabase
            .from('categories')
            .select('id')
            .eq('id', product.category_id)
            .eq('is_active', true)
            .single();

        if (categoryError || !category) {
            return { data: null, error: { message: 'Selected category is invalid or inactive.' } };
        }

        const { data, error } = await supabase
            .from('products')
            .insert({ ...product, category_id: category.id })
            .select()
            .single();
        return { data, error };
    },

    async update(id, updates) {
        if (updates?.category_id) {
            const { data: category, error: categoryError } = await supabase
                .from('categories')
                .select('id')
                .eq('id', updates.category_id)
                .eq('is_active', true)
                .single();

            if (categoryError || !category) {
                return { data: null, error: { message: 'Selected category is invalid or inactive.' } };
            }

            updates = { ...updates, category_id: category.id };
        }

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
