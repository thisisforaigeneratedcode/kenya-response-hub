-- Clean Migration to Update RLS policy for public.profiles

-- First, drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create the new, permissive insert policy that allows signup before email confirmation
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (true);
