-- Hotfix for 42P17: resources_submit_pending must not query resources from
-- its own RLS expression. Safe to run repeatedly in Supabase SQL Editor.

create or replace function public.can_submit_resource_parent(p_parent_resource_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select exists (
    select 1
    from public.resources as source
    where source.id = p_parent_resource_id
      and source.moderation_status = 'approved'
      and source.author_id <> (select auth.uid())
  );
$$;

revoke all on function public.can_submit_resource_parent(uuid) from public, anon;
grant execute on function public.can_submit_resource_parent(uuid) to authenticated;

drop policy if exists resources_submit_pending on public.resources;
create policy resources_submit_pending on public.resources
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and moderation_status = 'pending'
    and (
      parent_resource_id is null
      or public.can_submit_resource_parent(parent_resource_id)
    )
  );

-- Return the installed policy as a visible confirmation in SQL Editor.
select policyname, cmd, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'resources'
  and policyname = 'resources_submit_pending';
