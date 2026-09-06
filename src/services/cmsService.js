import { supabase } from '../lib/supabase';

function normalizeError(error) {
    if (!error) return null;
    const normalized = {
        message: error.message || 'Unable to load CMS data.',
        code: error.code || '',
        details: error.details || '',
        hint: error.hint || '',
    };
    if (import.meta.env.DEV) {
        console.error('[CMS] Supabase error:', normalized);
    }
    return normalized;
}

const HOMEPAGE_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

function withoutCmsMetadata(record) {
    return Object.fromEntries(
        Object.entries(record).filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
    );
}

export const cmsService = {
    async getHeroSlides({ activeOnly = false } = {}) {
        try {
            let query = supabase
                .from('homepage_hero_slides')
                .select('*');
            if (activeOnly) query = query.eq('is_active', true);
            const { data, error } = await query
                .order('display_order', { ascending: true })
                .order('created_at', { ascending: true });

            if (error) return { data: [], error: normalizeError(error) };

            return { data: data || [], error: null };
        } catch (error) {
            return { data: [], error: normalizeError(error) };
        }
    },

    async getAnnouncements({ activeOnly = false } = {}) {
        try {
            let query = supabase
                .from('announcement_items')
                .select('*');
            if (activeOnly) query = query.eq('is_active', true);
            const { data, error } = await query.order('display_order', { ascending: true });

            if (error) return { data: [], error: normalizeError(error) };

            return { data: data || [], error: null };
        } catch (error) {
            return { data: [], error: normalizeError(error) };
        }
    },

    async getSettings({ publishedOnly = false } = {}) {
        try {
            let query = supabase
                .from('homepage_settings')
                .select('*');
            if (publishedOnly) query = query.eq('is_published', true);
            const { data, error } = await query
                .order('updated_at', { ascending: false })
                .limit(1);

            if (error) return { data: null, error: normalizeError(error) };

            return { data: data?.[0] ?? null, error: null };
        } catch (error) {
            return { data: null, error: normalizeError(error) };
        }
    },

    async saveSettings(settings, isPublished = true) {
        try {
            const { data, error } = await supabase
                .from('homepage_settings')
                .upsert({
                    id: HOMEPAGE_SETTINGS_ID,
                    settings,
                    is_published: isPublished,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' })
                .select()
                .single();

            if (error) return { data: null, error: normalizeError(error) };

            return { data, error: null };
        } catch (error) {
            return { data: null, error: normalizeError(error) };
        }
    },

    async uploadHomepageMedia(file, folder = 'hero') {
        try {
            const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
            const allowedVideoTypes = ['video/mp4', 'video/webm'];
            const isImage = allowedImageTypes.includes(file.type);
            const isVideo = allowedVideoTypes.includes(file.type);

            if (!isImage && !isVideo) {
                return { data: null, error: { message: 'Please upload a JPG, PNG, WebP image or MP4/WebM video.' } };
            }

            const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
            if (file.size > maxSize) {
                return { data: null, error: { message: isVideo ? 'Videos must be 100 MB or smaller.' : 'Images must be 10 MB or smaller.' } };
            }
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
            const path = `${folder}/${Date.now()}-${safeName}`;
            const { error } = await supabase.storage.from('homepage-media').upload(path, file, {
                upsert: true,
                contentType: file.type,
            });

            if (error) {
                return { data: null, error: normalizeError(error) };
            }

            const { data: urlData } = supabase.storage.from('homepage-media').getPublicUrl(path);
            return { data: urlData.publicUrl, error: null };
        } catch (error) {
            return { data: null, error: normalizeError(error) };
        }
    },

    async createHeroSlide(slide) {
        try {
            const { data, error } = await supabase
                .from('homepage_hero_slides')
                .insert(withoutCmsMetadata(slide))
                .select()
                .single();

            if (error) return { data: null, error: normalizeError(error) };

            return { data, error: null };
        } catch (error) {
            return { data: null, error: normalizeError(error) };
        }
    },

    async updateHeroSlide(id, updates) {
        try {
            const { data, error } = await supabase
                .from('homepage_hero_slides')
                .update({ ...withoutCmsMetadata(updates), updated_at: new Date().toISOString() })
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
                .insert(withoutCmsMetadata(item))
                .select()
                .single();

            if (error) return { data: null, error: normalizeError(error) };

            return { data, error: null };
        } catch (error) {
            return { data: null, error: normalizeError(error) };
        }
    },

    async updateAnnouncement(id, updates) {
        try {
            const { data, error } = await supabase
                .from('announcement_items')
                .update({ ...withoutCmsMetadata(updates), updated_at: new Date().toISOString() })
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
