BEGIN;

-- Backfill only missing JSON keys so existing homepage settings remain unchanged.
UPDATE public.homepage_settings
SET settings = jsonb_set(
    jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{features_section}',
        COALESCE(settings->'features_section', '{"eyebrow":"Why Us","title":"The JerseyStore Promise","items":[{"icon":"Truck","title":"Free Shipping","description":"Free delivery on all orders above ₹999.","order":1},{"icon":"BadgeCheck","title":"100% Authentic","description":"Every jersey is sourced from official suppliers.","order":2},{"icon":"RotateCcw","title":"Easy Returns","description":"Return within 15 days for a full refund.","order":3},{"icon":"Shield","title":"Secure Payment","description":"Industry-standard encryption protects your payment.","order":4}]}'::jsonb)
    ),
    '{hero_stats}',
    COALESCE(settings->'hero_stats', '[{"number":"500+","label":"Jerseys"},{"number":"50+","label":"Brands"},{"number":"10K+","label":"Fans"}]'::jsonb)
)
WHERE settings IS NULL
   OR NOT (settings ? 'features_section')
   OR NOT (settings ? 'hero_stats');

COMMIT;
