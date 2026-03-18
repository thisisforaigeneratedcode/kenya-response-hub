-- Add town column to public.incidents
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS town TEXT;

-- Update types.ts (this is usually automated by Supabase but we'll reflect it in our manual type update next)
COMMENT ON COLUMN public.incidents.town IS 'City, town, or nearest landmark for better location context.';
