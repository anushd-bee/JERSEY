import { supabase } from '../lib/supabase';

export const customerService = {
    async getAll() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        return { data, error };
    },

    async updateRole(id, role) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },
};
