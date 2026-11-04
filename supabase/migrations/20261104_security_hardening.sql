-- Applied to Supabase project dtgkcjuhrwjpvhycydfq on 2026-11-04 (record only; already live).
-- 1. Stop signed-in users from changing their own role (privilege escalation fix)
drop policy if exists "users can update own profile" on public.profiles;
revoke insert, update, delete, truncate, references, trigger on public.profiles from anon, authenticated;
revoke select on public.profiles from anon;
-- 2. Private tables: no access for the public (anon) key; signed-in access limited to admins by RLS
revoke all on public.admin_prompts, public.assessment_attempts, public.belief_plans, public.contact_messages,
  public.contacts, public.daily_email_sends, public.daily_subscribers, public.group_intakes, public.pattern_plans,
  public.push_jobs, public.push_messages, public.reflection_plans, public.worker_devices from anon;
revoke truncate, references, trigger on public.admin_prompts, public.assessment_attempts, public.belief_plans, public.contact_messages,
  public.contacts, public.daily_email_sends, public.daily_subscribers, public.group_intakes, public.pattern_plans,
  public.push_jobs, public.push_messages, public.reflection_plans, public.worker_devices from authenticated;
revoke all on public.assessment_attempts, public.push_jobs, public.push_messages, public.worker_devices from authenticated;
-- 3. Internal trigger functions not callable through the API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
-- 4. Pin search_path on helper functions
alter function public.set_admin_prompts_updated_at() set search_path = public;
alter function public.set_worker_devices_updated_at() set search_path = public;
alter function public.set_assessment_attempts_updated_at() set search_path = public;
alter function public.set_updated_at_if_changed() set search_path = public;
-- 5. New tables don't automatically grant the public key access
alter default privileges in schema public revoke all on tables from anon;
