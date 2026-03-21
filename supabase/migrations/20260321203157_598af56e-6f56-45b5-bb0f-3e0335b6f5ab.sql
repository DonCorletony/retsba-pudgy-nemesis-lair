-- Allow service role to manage templates (insert, update, delete)
-- Service role bypasses RLS, but we need delete policy for completeness
create policy "Service role can manage templates"
on public.xp_templates for all
to service_role
using (true)
with check (true);

-- Allow anon to delete from storage (needed for edge function cleanup)
-- Actually service_role bypasses RLS so no storage policies needed for writes