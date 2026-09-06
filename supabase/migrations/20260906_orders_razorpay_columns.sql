-- ============================================================
-- Migration: Add Razorpay + itemised pricing columns to orders
-- Run in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Payment status (tracks lifecycle of the Razorpay transaction)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'created'
    CHECK (payment_status IN ('created', 'attempted', 'paid', 'failed', 'refunded'));

-- 2. Razorpay linkage IDs
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- 3. Itemised pricing breakdown (server-computed; never from client)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 4. Useful indexes
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
  ON public.orders (razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON public.orders (payment_status);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
