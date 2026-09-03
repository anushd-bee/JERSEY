import { supabase } from '../lib/supabase';

function normalizeError(error) {
    if (!error) return null;
    const message = error.message || 'Unable to load CMS data.';
    return { message };
}

export const cmsService = {
    async getHeroSlides() {
        try {
            const { data, error } = await supabase
                .from('homepage_hero_slides')
                .select('*')
                .order('display_order', { ascending: true })
                .order('created_at', { ascending: true });

            if (error) {
                if (/does not exist|could not find|schema cache|no such table/i.test(error.message)) {
                    return { data: [], error: null };
                }
                return { data: [], error: normalizeError(error) };
            }

            return { data: data || [], error: null };
        } catch (error) {
            return { data: [], error: normalizeError(error) };
        }
    },

    async getAnnouncements() {
        try {
            const { data, error } = await supabase
                .from('announcement_items')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                if (/does not exist|could not find|schema cache|no such table/i.test(error.message)) {
                    return { data: [], error: null };
                }
                return { data: [], error: normalizeError(error) };
            }

            return { data: data || [], error: null };
        } catch (error) {
            return { data: [], error: normalizeError(error) };
        }
    },

    async getSettings() {
        try {
            const { data, error } = await supabase
                .from('homepage_settings')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1);

            if (error) {
                if (/does not exist|could not find|schema cache|no such table/i.test(error.message)) {
                    return { data: null, error: null };
                }
                return { data: null, error: normalizeError(error) };
            }

            return { data: data?.[0] ?? null, error: null };
        } catch (error) {
            return { data: null, error: normalizeError(error) };
        }
    },

    async saveSettings(settings) {
        try {
            const { data, error } = await supabase
                .from('homepage_settings')
                .upsert({
                    id: 'default',
                    settings,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' })
                .select()
                .single();

            if (error) {
                if (/does not exist|could not find|schema cache|no such table/i.test(error.message)) {
                    return { data: null, error: { message: 'Homepage settings table is not available yet.' } };
                }
                return { data: null, error: normalizeError(error) };
            }

            return { data, error: null };
        } catch (error) {
            return { data: null, error: normalizeError(error) };
        }
    },

    async uploadCmsImage(file, folder = 'cms') {
        try {
            const safeName = file.name.replace(/\s+/g, '-');
            const path = `${folder}/${Date.now()}-${safeName}`;
            const { error } = await supabase.storage.from('product-images').upload(path, file, {
                upsert: true,
                contentType: file.type,
            });

            if (error) {
                return { data: null, error: normalizeError(error) };
            }

            const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
            return { data: urlData.publicUrl, error: null };
        } catch (error) {
            return { data: null, error: normalizeError(error) };
        }
    },

    async createHeroSlide(slide) {
        try {
            const { data, error } = await supabase
                .from('homepage_hero_slides')
                .insert(slide)
                .select()
                .single();

            if (error) {
                if (/does not exist|could not find|schema cache|no such table/i.test(error.message)) {
                    return { data: null, error: { message: 'Hero CMS table is not available yet.' } };
                }
                return { data: null, error: normalizeError(error) };
            }

            return { data, error: null };
        } catch (error) {
            return { data: null, error: normalizeError(error) };
        }
    },

    async updateHeroSlide(id, updates) {
        try {
            const { data, error } = await supabase
                .from('homepage_hero_slides')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) return { data: null, error: normalizeError(error) };
            return { data, error: null };
        } catch (error) {
            return { data: null, error: normalizeError(error) };
        }
    },

    async deleteHeroSlide(id) {
        try {
            const { error } = await supabase.from('homepage_hero_slides').delete().eq('id', id);
            if (error) return { error: normalizeError(error) };
            return { error: null };
        } catch (error) {
            return { error: normalizeError(error) };
        }
    },

    async createAnnouncement(item) {
        try {
            const { data, error } = await supabase
                .from('announcement_items')
                .insert(item)
                .select()
                .single();

            if (error) {
                if (/does not exist|could not find|schema cache|no such table/i.test(error.message)) {
                    return { data: null, error: { message: 'Announcement table is not available yet.' } };
                }
                return { data: null, error: normalizeError(error) };
            }

            return { data, error: null };
        } catch (error) {
            return { data: null, error: normalizeError(error) };
        }
    },

    async updateAnnouncement(id, updates) {
        try {
            const { data, error } = await supabase
                .from('announcement_items')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) return { data: null, error: normalizeError(error) };
            return { data, error: null };
        } catch (error) {
            return { data: null, error: normalizeError(error) };
        }
    },

    async deleteAnnouncement(id) {
        try {
            const { error } = await supabase.from('announcement_items').delete().eq('id', id);
            if (error) return { error: normalizeError(error) };
            return { error: null };
        } catch (error) {
            return { error: normalizeError(error) };
        }
    },
};
