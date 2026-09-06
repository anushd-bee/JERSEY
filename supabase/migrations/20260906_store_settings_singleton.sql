-- MIGRATION: ENFORCE SINGLETON DESIGN FOR STORE SETTINGS
-- Prevents multiple rows from existing to ensure single source of truth

-- 1. Ensure a singleton lock column exists
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS singleton_id INT DEFAULT 1;

-- 2. Update existing rows (if any) to have singleton_id = 1
UPDATE public.store_settings SET singleton_id = 1;

-- 3. In case there are multiple rows (due to legacy bugs), keep only the first one
DELETE FROM public.store_settings
WHERE id NOT IN (
    SELECT id FROM public.store_settings ORDER BY created_at ASC LIMIT 1
);

-- 4. Add the unique constraint so no other rows can be inserted with singleton_id = 1
-- Since singleton_id defaults to 1, any new insert attempt will violate this constraint.
ALTER TABLE public.store_settings
ADD CONSTRAINT store_settings_singleton_unique UNIQUE (singleton_id);

-- 5. Add a check constraint to enforce singleton_id is ALWAYS 1
ALTER TABLE public.store_settings
ADD CONSTRAINT store_settings_singleton_check CHECK (singleton_id = 1);

-- 6. Guarantee at least one row exists
INSERT INTO public.store_settings (id, singleton_id)
SELECT gen_random_uuid(), 1
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
