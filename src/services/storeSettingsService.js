import { supabase } from '../lib/supabase';

export const storeSettingsService = {
    async getSettings() {
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .limit(1)
            .maybeSingle();

        return { data, error };
    },

    async updateSettings(id, updates) {
        if (id) {
            const { data, error } = await supabase
                .from('store_settings')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            return { data, error };
        } else {
            // If the table is empty and no ID provided, insert
            const { data, error } = await supabase
                .from('store_settings')
                .insert(updates)
                .select()
                .single();
            return { data, error };
        }
    }
};
