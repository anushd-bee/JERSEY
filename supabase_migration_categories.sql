-- =====================================================
-- MIGRATION: Add is_active + image to categories table
-- Run this in the Supabase SQL Editor
-- =====================================================

-- Add is_active column (default true - all existing categories stay visible)
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add image column (URL to category image, optional)
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS image TEXT;

-- Add updated_at column
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Force PostgREST to refresh the schema cache so the new column is available immediately
NOTIFY pgrst, 'reload schema';

-- Index for active filter performance
CREATE INDEX IF NOT EXISTS categories_is_active_idx ON public.categories (is_active);

-- =====================================================
-- Seed the 8 standard categories if they don't exist
-- (slugs must match what productService.getAll uses)
-- =====================================================

INSERT INTO public.categories (name, slug, description, is_active)
VALUES
  ('Half Sleeve',    'half_sleeve',   'Short sleeve jersey style',        true),
  ('Full Sleeve',    'full_sleeve',   'Long sleeve all-weather jerseys',  true),
  ('Sleeveless',     'sleeveless',    'No-sleeve maximum mobility',       true),
  ('Zipper T-Shirt', 'zipper_tshirt', 'Performance zip-up style',        true),
  ('Oversized',      'oversized',     'Streetwear oversized fit',         true),
  ('Kids',           'kids',          'Kids and junior collection',       true),
  ('Old Gen',        'old_gen',       'Retro and classic generation',     true),
  ('New Gen',        'new_gen',       'Current latest generation',        true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- Fix: Make categories table filter policy
-- (ensure inactive categories are hidden from public)
-- =====================================================

-- Drop old broad SELECT policy
DROP POLICY IF EXISTS "Categories are public" ON public.categories;

-- Public can only see ACTIVE categories
CREATE POLICY "Active categories are public" ON public.categories
FOR SELECT USING (is_active = true);

-- Recreate admin manage policy with all operations
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;

CREATE POLICY "Admins manage categories" ON public.categories
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Storage bucket for category images (reuse product-images or create a new one)
-- Product images bucket already exists, we can store category images there too.
CREATE POLICY "Admin category image upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
) ;
