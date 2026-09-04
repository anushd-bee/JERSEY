BEGIN;

-- Add new columns to homepage_hero_slides
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS animation_type TEXT DEFAULT 'ken-burns';
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS animation_duration INTEGER DEFAULT 600;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS background_position TEXT DEFAULT 'center';

-- Create storage bucket for homepage media if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('homepage-media', 'homepage-media', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for homepage-media bucket
DROP POLICY IF EXISTS "Public Access to Homepage Media" ON storage.objects;
CREATE POLICY "Public Access to Homepage Media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'homepage-media');

DROP POLICY IF EXISTS "Admin Upload to Homepage Media" ON storage.objects;
CREATE POLICY "Admin Upload to Homepage Media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'homepage-media' AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admin Update Homepage Media" ON storage.objects;
CREATE POLICY "Admin Update Homepage Media"
  ON storage.objects FOR UPDATE
  WITH CHECK (
    bucket_id = 'homepage-media' AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admin Delete Homepage Media" ON storage.objects;
CREATE POLICY "Admin Delete Homepage Media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'homepage-media' AND public.is_admin()
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
