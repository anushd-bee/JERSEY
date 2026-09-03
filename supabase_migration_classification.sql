-- ==========================================
-- MIGRATION: Add product classification fields
-- Run this in the Supabase SQL Editor
-- ==========================================

-- Add sleeve_type column (half_sleeve, full_sleeve, sleeveless)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sleeve_type TEXT
CHECK (sleeve_type IN ('half_sleeve', 'full_sleeve', 'sleeveless') OR sleeve_type IS NULL);

-- Add product_type column (zipper_tshirt, oversized, kids)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS product_type TEXT
CHECK (product_type IN ('zipper_tshirt', 'oversized', 'kids') OR product_type IS NULL);

-- Add generation column (old_gen, new_gen)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS generation TEXT
CHECK (generation IN ('old_gen', 'new_gen') OR generation IS NULL);

-- Add is_offer flag (true means product has an active discount/offer)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_offer BOOLEAN DEFAULT false;

-- ==========================================
-- How the Offer page works:
-- A product appears on /offer when is_offer = true AND compare_price IS NOT NULL
--   - price = the discounted/sale price
--   - compare_price = the original/strikethrough price
--   - discount % = round((compare_price - price) / compare_price * 100)
--
-- How the Shop categories work:
--   - sleeve_type filter → half_sleeve | full_sleeve | sleeveless
--   - product_type filter → zipper_tshirt | oversized | kids
--   - generation filter  → old_gen | new_gen
-- ==========================================

-- Optional: Create indexes for performance
CREATE INDEX IF NOT EXISTS products_sleeve_type_idx ON public.products (sleeve_type);
CREATE INDEX IF NOT EXISTS products_product_type_idx ON public.products (product_type);
CREATE INDEX IF NOT EXISTS products_generation_idx ON public.products (generation);
CREATE INDEX IF NOT EXISTS products_is_offer_idx ON public.products (is_offer);
