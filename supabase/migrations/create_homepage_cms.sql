-- Homepage CMS tables for JerseyStore
-- Run this migration once in the Supabase SQL Editor.
-- It preserves all existing tables and data.

BEGIN;

CREATE TABLE IF NOT EXISTS public.homepage_hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eyebrow TEXT,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    primary_button_text TEXT,
    primary_button_url TEXT,
    secondary_button_text TEXT,
    secondary_button_url TEXT,
    desktop_image TEXT,
    mobile_image TEXT,
    media_type TEXT DEFAULT 'image',
    animation_type TEXT DEFAULT 'ken-burns',
    animation_duration INTEGER DEFAULT 600,
    video_url TEXT,
    background_position TEXT DEFAULT 'center',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homepage_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Complete any partially-created CMS tables without changing existing values.
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS eyebrow TEXT;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS primary_button_text TEXT;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS primary_button_url TEXT;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS secondary_button_text TEXT;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS secondary_button_url TEXT;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS desktop_image TEXT;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS mobile_image TEXT;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS animation_type TEXT DEFAULT 'ken-burns';
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS animation_duration INTEGER DEFAULT 600;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS background_position TEXT DEFAULT 'center';
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.announcement_items ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE public.announcement_items ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.announcement_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.announcement_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.announcement_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.homepage_settings ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.homepage_settings ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.homepage_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.homepage_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS homepage_hero_slides_active_order_idx
    ON public.homepage_hero_slides (is_active, display_order, created_at);

CREATE INDEX IF NOT EXISTS announcement_items_active_order_idx
    ON public.announcement_items (is_active, display_order, created_at);

CREATE INDEX IF NOT EXISTS homepage_settings_published_updated_idx
    ON public.homepage_settings (is_published, updated_at DESC);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS homepage_hero_slides_set_updated_at ON public.homepage_hero_slides;
CREATE TRIGGER homepage_hero_slides_set_updated_at
    BEFORE UPDATE ON public.homepage_hero_slides
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS announcement_items_set_updated_at ON public.announcement_items;
CREATE TRIGGER announcement_items_set_updated_at
    BEFORE UPDATE ON public.announcement_items
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS homepage_settings_set_updated_at ON public.homepage_settings;
CREATE TRIGGER homepage_settings_set_updated_at
    BEFORE UPDATE ON public.homepage_settings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.homepage_hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active hero slides" ON public.homepage_hero_slides;
CREATE POLICY "Public can read active hero slides"
    ON public.homepage_hero_slides
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage hero slides" ON public.homepage_hero_slides;
CREATE POLICY "Admins can manage hero slides"
    ON public.homepage_hero_slides
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can read active announcements" ON public.announcement_items;
CREATE POLICY "Public can read active announcements"
    ON public.announcement_items
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcement_items;
CREATE POLICY "Admins can manage announcements"
    ON public.announcement_items
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can read published homepage settings" ON public.homepage_settings;
CREATE POLICY "Public can read published homepage settings"
    ON public.homepage_settings
    FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage homepage settings" ON public.homepage_settings;
CREATE POLICY "Admins can manage homepage settings"
    ON public.homepage_settings
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

GRANT SELECT ON public.homepage_hero_slides TO anon, authenticated;
GRANT SELECT ON public.announcement_items TO anon, authenticated;
GRANT SELECT ON public.homepage_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.homepage_hero_slides TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcement_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.homepage_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
