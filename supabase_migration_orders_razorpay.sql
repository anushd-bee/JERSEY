-- ============================================================
-- Migration: Add Razorpay + pricing columns to orders table
-- Run this in Supabase SQL Editor before deploying the
-- create-razorpay-order and verify-razorpay-payment edge functions.
-- ============================================================

-- 1. Payment status tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'created'
    CHECK (payment_status IN ('created', 'attempted', 'paid', 'failed', 'refunded'));

-- 2. Razorpay linkage columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- 3. Itemised pricing breakdown (so admin can audit how total was computed)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- 4. Index for fast lookup by Razorpay order id (e.g. webhook verification)
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
  ON public.orders (razorpay_order_id);

-- 5. Index for fast lookup by payment status
CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON public.orders (payment_status);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
