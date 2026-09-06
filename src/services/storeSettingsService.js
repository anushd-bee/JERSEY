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

    async updateSettings(updates) {
        // Fetch existing first to check if we need to UPDATE or INSERT
        const { data: existing } = await supabase
            .from('store_settings')
            .select('id')
            .limit(1)
            .maybeSingle();

        if (existing?.id) {
            const { data, error } = await supabase
                .from('store_settings')
                .update(updates)
                .eq('id', existing.id)
                .select()
                .single();
            return { data, error };
        } else {
            // First time setup - insert the row securely
            const { data, error } = await supabase
                .from('store_settings')
                .insert([{ ...updates, singleton_id: 1 }])
                .select()
                .single();
            return { data, error };
        }
    }
};
