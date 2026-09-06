-- ============================================================
-- Migration: Admin-safe row-count RPC functions
-- These run with SECURITY DEFINER so they bypass RLS and
-- always return accurate totals regardless of the caller's
-- row-level permissions.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orders_count   bigint;
  v_revenue        numeric;
  v_products_count bigint;
  v_customers_count bigint;
BEGIN
  -- Only admins should be able to call this
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT COUNT(*), COALESCE(SUM(total), 0)
    INTO v_orders_count, v_revenue
    FROM public.orders;

  SELECT COUNT(*) INTO v_products_count FROM public.products;
  SELECT COUNT(*) INTO v_customers_count FROM public.profiles;

  RETURN jsonb_build_object(
    'orders',    v_orders_count,
    'revenue',   v_revenue,
    'products',  v_products_count,
    'customers', v_customers_count
  );
END;
$$;

-- Grant execute to authenticated users (the function itself enforces admin check)
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

NOTIFY pgrst, 'reload schema';
