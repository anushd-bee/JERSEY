import { supabase } from '../lib/supabase';

export const orderService = {
    async create(orderData) {
        const { data, error } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();
        return { data, error };
    },

    async createOrderItems(items) {
        const { data, error } = await supabase
            .from('order_items')
            .insert(items)
            .select();
        return { data, error };
    },

    async getUserOrders(userId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, images, slug))')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    async getById(orderId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, images, slug, price))')
            .eq('id', orderId)
            .single();
        return { data, error };
    },

    // Admin
    async getAll({ status, limit = 50, offset = 0 } = {}) {
        let query = supabase
            .from('orders')
            .select('*, profiles(full_name, email), order_items(count)', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;
        return { data, error, count };
    },

    async updateStatus(orderId, status) {
        const { data, error } = await supabase
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .select()
            .single();
        return { data, error };
    },
};
