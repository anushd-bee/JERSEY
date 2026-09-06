import { supabase } from '../lib/supabase';

export const orderService = {
    // Creates the order server-side: the edge function re-fetches real
    // product prices from the DB and creates the Razorpay order itself.
    // `items` should only ever be { product_id, size, quantity } — never price.
    async createSecureOrder({ items, shipping_address }) {
        const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
            body: {
                items: items.map(({ id, size, quantity }) => ({
                    product_id: id,
                    size,
                    quantity,
                })),
                shipping_address,
            },
        });
        return { data, error };
    },

    // Called after Razorpay's checkout handler returns — verifies the
    // signature server-side before the order is ever marked confirmed.
    async verifyPayment({ db_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
        const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: { db_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature },
        });
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
