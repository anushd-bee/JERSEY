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
                .select();

            if (error) return { data: null, error };
            if (!data || data.length === 0) return { data: null, error: new Error('Action blocked by Row Level Security (You must be an admin), or row no longer exists.') };

            return { data: data[0], error: null };
        } else {
            // First time setup - insert the row securely
            const { data, error } = await supabase
                .from('store_settings')
                .insert([{ ...updates, singleton_id: 1 }])
                .select();

            if (error) return { data: null, error };
            if (!data || data.length === 0) return { data: null, error: new Error('Action blocked by Row Level Security (You must be an admin).') };

            return { data: data[0], error: null };
        }
    }
};
