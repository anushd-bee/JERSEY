import { supabase } from '../lib/supabase';

export const storeSettingsService = {
    async getSettings() {
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .single(); // Guaranteed by singleton constraint

        return { data, error };
    },

    async updateSettings(updates) {
        // Safe update for single-row config using the singleton lock
        const { data, error } = await supabase
            .from('store_settings')
            .update(updates)
            .eq('singleton_id', 1)
            .select()
            .single();

        return { data, error };
    }
};
