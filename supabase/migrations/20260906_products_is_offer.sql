-- ============================================================
-- Migration: Add is_offer column to products table
-- Run in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Add the column; default false so all existing products are unaffected
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_offer BOOLEAN NOT NULL DEFAULT false;

-- Index for fast filtering on the Offers page
CREATE INDEX IF NOT EXISTS idx_products_is_offer
  ON public.products (is_offer)
  WHERE is_offer = true;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
