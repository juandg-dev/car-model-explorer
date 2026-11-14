-- Migration: stop visitors from calling Supabase's internal auto-RLS helper over the API.
-- The automatic RLS feature still works; it runs as the database owner, not as a visitor.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
