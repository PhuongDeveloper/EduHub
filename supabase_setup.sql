-- EduHub: teacher community, project moderation, comments and reactions.
-- Complete single-file setup for the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null default 'Giáo viên EduHub',
  school_name text,
  province text,
  province_code text,
  ward text,
  ward_code text,
  subject_specialty text,
  teaching_levels text[] not null default '{}',
  years_experience integer not null default 0 check (years_experience between 0 and 70),
  expertise_tags text[] not null default '{}',
  bio text not null default '',
  avatar_url text,
  cover_url text,
  teacher_verified boolean not null default false,
  role text not null default 'teacher' check (role in ('teacher', 'admin')),
  edu_points integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tagline text not null default '',
  description text not null default '',
  resource_type text not null default 'tool_software',
  file_format text,
  file_size text,
  download_url text,
  platform_url text,
  cover_url text,
  video_url text,
  usage_guide text,
  school_levels text[] not null default '{}',
  grade_levels text[] not null default '{}',
  subjects text[] not null default '{}',
  curriculum_books text[] not null default '{}',
  purpose text[] not null default '{}',
  author_id uuid not null references public.profiles(id) on delete cascade,
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  moderation_note text,
  moderated_by uuid references public.profiles(id) on delete set null,
  moderated_at timestamptz,
  upvotes_count integer not null default 0,
  views_count integer not null default 0,
  downloads_count integer not null default 0,
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  gdpt_fit_score numeric(3, 1),
  is_free_verified boolean not null default false,
  has_no_ads_verified boolean not null default false,
  is_copyright_verified boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.upvotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, resource_id)
);

create table if not exists public.resource_comments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.resource_ratings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  review_text text not null default '' check (char_length(review_text) <= 2000),
  weight integer not null default 1 check (weight between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (resource_id, user_id)
);

create table if not exists public.talks (
  id uuid primary key default gen_random_uuid(),
  subject_channel text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  attached_resource_id uuid references public.resources(id) on delete set null,
  upvotes_count integer not null default 0,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.talk_replies (
  id uuid primary key default gen_random_uuid(),
  talk_id uuid not null references public.talks(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.resource_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, resource_id)
);

create table if not exists public.teacher_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, followed_id),
  check (follower_id <> followed_id)
);

-- Add columns safely when upgrading the earlier EduHub schema.
alter table public.profiles add column if not exists full_name text not null default 'Giáo viên EduHub';
alter table public.profiles add column if not exists school_name text;
alter table public.profiles add column if not exists province text;
alter table public.profiles add column if not exists role text not null default 'teacher';
alter table public.profiles add column if not exists subject_specialty text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists province_code text;
alter table public.profiles add column if not exists ward text;
alter table public.profiles add column if not exists ward_code text;
alter table public.profiles add column if not exists teaching_levels text[] not null default '{}';
alter table public.profiles add column if not exists years_experience integer not null default 0;
alter table public.profiles add column if not exists expertise_tags text[] not null default '{}';
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists edu_points integer not null default 0;
alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists teacher_verified boolean not null default false;
alter table public.resources add column if not exists title text not null default '';
alter table public.resources add column if not exists tagline text not null default '';
alter table public.resources add column if not exists description text not null default '';
alter table public.resources add column if not exists resource_type text not null default 'tool_software';
alter table public.resources add column if not exists file_format text;
alter table public.resources add column if not exists file_size text;
alter table public.resources add column if not exists download_url text;
alter table public.resources add column if not exists platform_url text;
alter table public.resources add column if not exists cover_url text;
alter table public.resources add column if not exists video_url text;
alter table public.resources add column if not exists usage_guide text;
alter table public.resources add column if not exists school_levels text[] not null default '{}';
alter table public.resources add column if not exists grade_levels text[] not null default '{}';
alter table public.resources add column if not exists subjects text[] not null default '{}';
alter table public.resources add column if not exists curriculum_books text[] not null default '{}';
alter table public.resources add column if not exists purpose text[] not null default '{}';
alter table public.resources add column if not exists moderation_status text not null default 'pending';
alter table public.resources add column if not exists moderation_note text;
alter table public.resources add column if not exists moderated_by uuid references public.profiles(id) on delete set null;
alter table public.resources add column if not exists upvotes_count integer not null default 0;
alter table public.resources add column if not exists views_count integer not null default 0;
alter table public.resources add column if not exists downloads_count integer not null default 0;
alter table public.resources add column if not exists rating_avg numeric(3, 2) not null default 0;
alter table public.resources add column if not exists rating_count integer not null default 0;
alter table public.resources add column if not exists gdpt_fit_score numeric(3, 1);
alter table public.resources add column if not exists is_free_verified boolean not null default false;
alter table public.resources add column if not exists has_no_ads_verified boolean not null default false;
alter table public.resources add column if not exists is_copyright_verified boolean not null default false;
alter table public.resources add column if not exists tags text[] not null default '{}';
alter table public.resources add column if not exists created_at timestamptz not null default now();
alter table public.resources add column if not exists updated_at timestamptz not null default now();
update public.profiles set years_experience = greatest(0, least(70, coalesce(years_experience, 0)))
  where years_experience is null or years_experience < 0 or years_experience > 70;
alter table public.profiles alter column years_experience set default 0;
alter table public.profiles alter column years_experience set not null;
update public.resources set moderation_status = 'approved'
  where moderation_status = 'pending' and author_id is null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles add constraint profiles_role_check check (role in ('teacher', 'admin'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_years_experience_check') then
    alter table public.profiles add constraint profiles_years_experience_check check (years_experience between 0 and 70);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'resources_moderation_status_check') then
    alter table public.resources add constraint resources_moderation_status_check
      check (moderation_status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

create index if not exists resources_public_feed_idx on public.resources (created_at desc)
  where moderation_status = 'approved';
create index if not exists resources_author_idx on public.resources (author_id, created_at desc);
create index if not exists resource_comments_resource_idx on public.resource_comments (resource_id, created_at desc);
create index if not exists talks_subject_idx on public.talks (subject_channel, created_at desc);
create index if not exists resource_bookmarks_user_idx on public.resource_bookmarks (user_id, created_at desc);
create index if not exists teacher_follows_followed_idx on public.teacher_follows (followed_id, created_at desc);

create or replace function public.is_eduhub_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.create_eduhub_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, school_name, province, province_code, ward, ward_code, subject_specialty, teaching_levels, years_experience, expertise_tags, bio)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Giáo viên EduHub'),
    nullif(new.raw_user_meta_data ->> 'school_name', ''),
    nullif(new.raw_user_meta_data ->> 'province', ''),
    nullif(new.raw_user_meta_data ->> 'province_code', ''),
    nullif(new.raw_user_meta_data ->> 'ward', ''),
    nullif(new.raw_user_meta_data ->> 'ward_code', ''),
    nullif(new.raw_user_meta_data ->> 'subject_specialty', ''),
    case when jsonb_typeof(new.raw_user_meta_data -> 'teaching_levels') = 'array'
      then array(select jsonb_array_elements_text(new.raw_user_meta_data -> 'teaching_levels')) else '{}' end,
    case when coalesce(new.raw_user_meta_data ->> 'years_experience', '') ~ '^\d+$'
      then least(70, (new.raw_user_meta_data ->> 'years_experience')::integer) else 0 end,
    case when jsonb_typeof(new.raw_user_meta_data -> 'expertise_tags') = 'array'
      then array(select jsonb_array_elements_text(new.raw_user_meta_data -> 'expertise_tags')) else '{}' end,
    coalesce(new.raw_user_meta_data ->> 'bio', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.prevent_teacher_role_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.edu_points is distinct from old.edu_points or new.teacher_verified is distinct from old.teacher_verified)
    and current_user not in ('postgres', 'supabase_admin')
    and not public.is_eduhub_admin() then
    raise exception 'Only EduHub administrators may change roles, verification, or contribution points';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_eduhub_profile_role on public.profiles;
create trigger protect_eduhub_profile_role before update on public.profiles
  for each row execute procedure public.prevent_teacher_role_change();

create or replace function public.sync_resource_upvote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_resource uuid;
  point_delta integer;
  target_author uuid;
begin
  target_resource := coalesce(new.resource_id, old.resource_id);
  point_delta := case when tg_op = 'INSERT' then 5 else -5 end;
  update public.resources set upvotes_count = greatest(0, upvotes_count + point_delta / 5)
    where id = target_resource returning author_id into target_author;
  if target_author is not null then
    update public.profiles set edu_points = greatest(0, edu_points + point_delta)
      where id = target_author;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_eduhub_resource_upvotes on public.upvotes;
create trigger sync_eduhub_resource_upvotes after insert or delete on public.upvotes
  for each row execute procedure public.sync_resource_upvote_count();

create or replace function public.award_approved_resource_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.moderation_status = 'approved' then
    insert into public.teacher_activities (profile_id, activity_type, resource_id)
      values (new.author_id, 'project_approved', new.id) on conflict do nothing;
    if found then update public.profiles set edu_points = edu_points + 50 where id = new.author_id; end if;
  elsif tg_op = 'UPDATE' and old.moderation_status is distinct from new.moderation_status then
    if new.moderation_status = 'approved' then
      insert into public.teacher_activities (profile_id, activity_type, resource_id)
        values (new.author_id, 'project_approved', new.id) on conflict do nothing;
      if found then update public.profiles set edu_points = edu_points + 50 where id = new.author_id; end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists award_eduhub_resource_points on public.resources;
create trigger award_eduhub_resource_points after insert or update of moderation_status on public.resources
  for each row execute procedure public.award_approved_resource_points();

create table if not exists public.teacher_activities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  resource_id uuid references public.resources(id) on delete cascade,
  activity_type text not null check (activity_type in ('project_approved', 'project_liked', 'project_commented', 'project_rated')),
  created_at timestamptz not null default now()
);
create index if not exists teacher_activities_profile_idx on public.teacher_activities(profile_id, created_at desc);
create unique index if not exists teacher_activities_project_approved_once_idx
  on public.teacher_activities (resource_id) where activity_type = 'project_approved';

create or replace function public.record_eduhub_upvote_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare target_author uuid;
begin
  if tg_op = 'INSERT' then
    select author_id into target_author from public.resources where id = new.resource_id;
    if target_author is not null and target_author <> new.user_id then
      insert into public.teacher_activities (profile_id, actor_id, resource_id, activity_type)
        values (target_author, new.user_id, new.resource_id, 'project_liked');
    end if;
    return new;
  end if;
  return old;
end;
$$;
drop trigger if exists record_eduhub_upvote_activity on public.upvotes;
create trigger record_eduhub_upvote_activity after insert on public.upvotes
  for each row execute procedure public.record_eduhub_upvote_activity();

create or replace function public.set_eduhub_rating_weight()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewer_points integer;
begin
  if tg_op = 'UPDATE' and (new.resource_id is distinct from old.resource_id or new.user_id is distinct from old.user_id) then
    raise exception 'A rating cannot be moved to a different teacher or project';
  end if;
  if not exists (select 1 from public.resources r where r.id = new.resource_id and r.moderation_status = 'approved' and r.author_id <> new.user_id) then
    raise exception 'Teachers may only rate another teacher''s approved project';
  end if;
  select edu_points into reviewer_points from public.profiles where id = new.user_id;
  new.weight := least(5, greatest(1, 1 + floor(coalesce(reviewer_points, 0) / 500.0)::integer));
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_eduhub_rating_weight on public.resource_ratings;
create trigger set_eduhub_rating_weight before insert or update on public.resource_ratings
  for each row execute procedure public.set_eduhub_rating_weight();

create or replace function public.sync_eduhub_rating_summary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_resource uuid;
  target_author uuid;
  points_delta integer := 0;
begin
  target_resource := coalesce(new.resource_id, old.resource_id);
  if tg_op in ('UPDATE', 'DELETE') and old.stars >= 4 then
    points_delta := points_delta - old.weight * 2;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.stars >= 4 then
    points_delta := points_delta + new.weight * 2;
  end if;
  update public.resources r set
    rating_avg = coalesce((select round(sum(rr.stars * rr.weight)::numeric / nullif(sum(rr.weight), 0), 2) from public.resource_ratings rr where rr.resource_id = target_resource), 0),
    rating_count = (select count(*) from public.resource_ratings rr where rr.resource_id = target_resource)
    where r.id = target_resource returning r.author_id into target_author;
  if target_author is not null and points_delta <> 0 then
    update public.profiles set edu_points = greatest(0, edu_points + points_delta) where id = target_author;
  end if;
  if tg_op = 'INSERT' and target_author is not null then
    insert into public.teacher_activities (profile_id, actor_id, resource_id, activity_type)
      values (target_author, new.user_id, target_resource, 'project_rated');
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_eduhub_rating_summary on public.resource_ratings;
create trigger sync_eduhub_rating_summary after insert or update or delete on public.resource_ratings
  for each row execute procedure public.sync_eduhub_rating_summary();

create or replace function public.record_eduhub_comment_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare target_author uuid;
begin
  select author_id into target_author from public.resources where id = new.resource_id;
  if target_author is not null and target_author <> new.author_id then
    insert into public.teacher_activities (profile_id, actor_id, resource_id, activity_type)
      values (target_author, new.author_id, new.resource_id, 'project_commented');
  end if;
  return new;
end;
$$;
drop trigger if exists record_eduhub_comment_activity on public.resource_comments;
create trigger record_eduhub_comment_activity after insert on public.resource_comments
  for each row execute procedure public.record_eduhub_comment_activity();

drop trigger if exists on_auth_user_created_eduhub on auth.users;
create trigger on_auth_user_created_eduhub
  after insert on auth.users
  for each row execute procedure public.create_eduhub_profile();

alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.upvotes enable row level security;
alter table public.resource_comments enable row level security;
alter table public.talks enable row level security;
alter table public.talk_replies enable row level security;
alter table public.resource_bookmarks enable row level security;
alter table public.teacher_follows enable row level security;
alter table public.resource_ratings enable row level security;
alter table public.teacher_activities enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_eduhub_admin())
  with check (id = (select auth.uid()) or public.is_eduhub_admin());
drop policy if exists profile_no_self_verification on public.profiles;

drop policy if exists "Public resources are viewable by everyone" on public.resources;
drop policy if exists resources_read_public_or_owner on public.resources;
create policy resources_read_public_or_owner on public.resources for select
  using (moderation_status = 'approved' or author_id = (select auth.uid()) or public.is_eduhub_admin());
drop policy if exists resources_submit_pending on public.resources;
create policy resources_submit_pending on public.resources for insert to authenticated
  with check (author_id = (select auth.uid()) and moderation_status = 'pending');
drop policy if exists resources_admin_update on public.resources;
create policy resources_admin_update on public.resources for update to authenticated
  using (public.is_eduhub_admin()) with check (public.is_eduhub_admin());
drop policy if exists resources_owner_delete_pending on public.resources;
create policy resources_owner_delete_pending on public.resources for delete to authenticated
  using ((author_id = (select auth.uid()) and moderation_status = 'pending') or public.is_eduhub_admin());

drop policy if exists upvotes_read on public.upvotes;
create policy upvotes_read on public.upvotes for select using (true);
drop policy if exists upvotes_insert_self on public.upvotes;
create policy upvotes_insert_self on public.upvotes for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.resources r where r.id = resource_id and r.moderation_status = 'approved' and r.author_id <> (select auth.uid())
  ));
drop policy if exists upvotes_delete_self on public.upvotes;
create policy upvotes_delete_self on public.upvotes for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_eduhub_admin());

drop policy if exists comments_read_public on public.resource_comments;
create policy comments_read_public on public.resource_comments for select
  using (exists (select 1 from public.resources r where r.id = resource_id
    and (r.moderation_status = 'approved' or r.author_id = (select auth.uid()) or public.is_eduhub_admin())));
drop policy if exists comments_insert_teacher on public.resource_comments;
create policy comments_insert_teacher on public.resource_comments for insert to authenticated
  with check (author_id = (select auth.uid()) and exists (select 1 from public.resources r
    where r.id = resource_id and r.moderation_status = 'approved'));
drop policy if exists comments_delete_owner_or_admin on public.resource_comments;
create policy comments_delete_owner_or_admin on public.resource_comments for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_eduhub_admin());

drop policy if exists ratings_read_public on public.resource_ratings;
create policy ratings_read_public on public.resource_ratings for select using (exists (
  select 1 from public.resources r where r.id = resource_id and r.moderation_status = 'approved'
));
drop policy if exists ratings_insert_self on public.resource_ratings;
create policy ratings_insert_self on public.resource_ratings for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.resources r where r.id = resource_id and r.moderation_status = 'approved' and r.author_id <> (select auth.uid())
  ));
drop policy if exists ratings_update_self on public.resource_ratings;
create policy ratings_update_self on public.resource_ratings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists ratings_delete_self_or_admin on public.resource_ratings;
create policy ratings_delete_self_or_admin on public.resource_ratings for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_eduhub_admin());

drop policy if exists teacher_activities_read on public.teacher_activities;
create policy teacher_activities_read on public.teacher_activities for select using (true);
grant select on public.teacher_activities to anon, authenticated;

drop policy if exists talks_read on public.talks;
create policy talks_read on public.talks for select using (true);
drop policy if exists talks_insert_teacher on public.talks;
create policy talks_insert_teacher on public.talks for insert to authenticated
  with check (author_id = (select auth.uid()));
drop policy if exists talks_update_owner_or_admin on public.talks;
create policy talks_update_owner_or_admin on public.talks for update to authenticated
  using (author_id = (select auth.uid()) or public.is_eduhub_admin())
  with check (author_id = (select auth.uid()) or public.is_eduhub_admin());
drop policy if exists talks_delete_owner_or_admin on public.talks;
create policy talks_delete_owner_or_admin on public.talks for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_eduhub_admin());

drop policy if exists talk_replies_read on public.talk_replies;
create policy talk_replies_read on public.talk_replies for select using (true);
drop policy if exists talk_replies_insert_teacher on public.talk_replies;
create policy talk_replies_insert_teacher on public.talk_replies for insert to authenticated
  with check (author_id = (select auth.uid()));
drop policy if exists talk_replies_delete_owner_or_admin on public.talk_replies;
create policy talk_replies_delete_owner_or_admin on public.talk_replies for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_eduhub_admin());

drop policy if exists resource_bookmarks_read_self on public.resource_bookmarks;
create policy resource_bookmarks_read_self on public.resource_bookmarks for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists resource_bookmarks_insert_self on public.resource_bookmarks;
create policy resource_bookmarks_insert_self on public.resource_bookmarks for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.resources r where r.id = resource_id and r.moderation_status = 'approved'
  ));
drop policy if exists resource_bookmarks_delete_self on public.resource_bookmarks;
create policy resource_bookmarks_delete_self on public.resource_bookmarks for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists teacher_follows_read_public on public.teacher_follows;
create policy teacher_follows_read_public on public.teacher_follows for select using (true);
drop policy if exists teacher_follows_insert_self on public.teacher_follows;
create policy teacher_follows_insert_self on public.teacher_follows for insert to authenticated
  with check (follower_id = (select auth.uid()) and follower_id <> followed_id);
drop policy if exists teacher_follows_delete_self on public.teacher_follows;
create policy teacher_follows_delete_self on public.teacher_follows for delete to authenticated
  using (follower_id = (select auth.uid()) or public.is_eduhub_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('eduhub-assets', 'eduhub-assets', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/avif','application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel','application/zip'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists eduhub_assets_public_read on storage.objects;
create policy eduhub_assets_public_read on storage.objects for select
  using (bucket_id = 'eduhub-assets');
drop policy if exists eduhub_assets_upload_own_folder on storage.objects;
create policy eduhub_assets_upload_own_folder on storage.objects for insert to authenticated
  with check (bucket_id = 'eduhub-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists eduhub_assets_update_own_folder on storage.objects;
create policy eduhub_assets_update_own_folder on storage.objects for update to authenticated
  using (bucket_id = 'eduhub-assets' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'eduhub-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists eduhub_assets_delete_own_folder on storage.objects;
create policy eduhub_assets_delete_own_folder on storage.objects for delete to authenticated
  using ((bucket_id = 'eduhub-assets' and (storage.foldername(name))[1] = (select auth.uid())::text)
    or (bucket_id = 'eduhub-assets' and public.is_eduhub_admin()));

-- EduHub community depth: project feedback/changelog, collections, reports and period points.

create table if not exists public.resource_feedback (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 140),
  body text not null default '' check (char_length(body) <= 3000),
  status text not null default 'open' check (status in ('open','planned','in_progress','completed','declined')),
  votes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists resource_feedback_resource_idx on public.resource_feedback(resource_id, created_at desc);

create table if not exists public.resource_feedback_votes (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.resource_feedback(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(feedback_id, user_id)
);
alter table public.resource_feedback add column if not exists votes_count integer not null default 0;

create table if not exists public.resource_changelog (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  version text not null check (char_length(version) between 1 and 40),
  title text not null check (char_length(title) between 4 and 140),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists resource_changelog_resource_idx on public.resource_changelog(resource_id, created_at desc);

create table if not exists public.resource_collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  description text not null default '' check (char_length(description) <= 500),
  subject text not null default 'Đa môn học',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists resource_collections_owner_idx on public.resource_collections(owner_id, updated_at desc);

create table if not exists public.resource_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.resource_collections(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(collection_id, resource_id)
);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('copyright','privacy','spam','misleading','unsafe','other')),
  details text not null default '' check (char_length(details) <= 2000),
  status text not null default 'pending' check (status in ('pending','reviewing','resolved','dismissed')),
  admin_note text not null default '',
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists content_reports_status_idx on public.content_reports(status, created_at desc);

create table if not exists public.edu_point_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  resource_id uuid references public.resources(id) on delete set null,
  event_type text not null,
  points integer not null check (points <> 0),
  created_at timestamptz not null default now()
);
create index if not exists edu_point_events_period_idx on public.edu_point_events(created_at desc, profile_id);
create index if not exists edu_point_events_profile_idx on public.edu_point_events(profile_id, created_at desc);

alter table public.resource_feedback enable row level security;
alter table public.resource_feedback_votes enable row level security;
alter table public.resource_changelog enable row level security;
alter table public.resource_collections enable row level security;
alter table public.resource_collection_items enable row level security;
alter table public.content_reports enable row level security;
alter table public.edu_point_events enable row level security;

drop policy if exists resource_feedback_read on public.resource_feedback;
create policy resource_feedback_read on public.resource_feedback for select using (exists(select 1 from public.resources r where r.id=resource_id and r.moderation_status='approved') or author_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists resource_feedback_insert on public.resource_feedback;
create policy resource_feedback_insert on public.resource_feedback for insert to authenticated with check (author_id=(select auth.uid()) and exists(select 1 from public.resources r where r.id=resource_id and r.moderation_status='approved'));
drop policy if exists resource_feedback_update_owner_admin on public.resource_feedback;
create policy resource_feedback_update_owner_admin on public.resource_feedback for update to authenticated using (author_id=(select auth.uid()) or exists(select 1 from public.resources r where r.id=resource_id and r.author_id=(select auth.uid())) or public.is_eduhub_admin()) with check (author_id=(select auth.uid()) or exists(select 1 from public.resources r where r.id=resource_id and r.author_id=(select auth.uid())) or public.is_eduhub_admin());
drop policy if exists resource_feedback_delete_owner_admin on public.resource_feedback;
create policy resource_feedback_delete_owner_admin on public.resource_feedback for delete to authenticated using (author_id=(select auth.uid()) or public.is_eduhub_admin());

drop policy if exists resource_feedback_votes_read on public.resource_feedback_votes;
create policy resource_feedback_votes_read on public.resource_feedback_votes for select to authenticated using (user_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists resource_feedback_votes_insert_self on public.resource_feedback_votes;
create policy resource_feedback_votes_insert_self on public.resource_feedback_votes for insert to authenticated with check (user_id=(select auth.uid()) and exists(select 1 from public.resource_feedback f where f.id=feedback_id and f.author_id<>(select auth.uid())));
drop policy if exists resource_feedback_votes_delete_self on public.resource_feedback_votes;
create policy resource_feedback_votes_delete_self on public.resource_feedback_votes for delete to authenticated using (user_id=(select auth.uid()) or public.is_eduhub_admin());

create or replace function public.sync_feedback_vote_count()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  update public.resource_feedback set votes_count=greatest(0,votes_count + case when tg_op='INSERT' then 1 else -1 end), updated_at=now() where id=coalesce(new.feedback_id,old.feedback_id);
  return coalesce(new,old);
end; $$;
drop trigger if exists sync_resource_feedback_vote_count on public.resource_feedback_votes;
create trigger sync_resource_feedback_vote_count after insert or delete on public.resource_feedback_votes for each row execute procedure public.sync_feedback_vote_count();
update public.resource_feedback f set votes_count=(select count(*) from public.resource_feedback_votes v where v.feedback_id=f.id);

drop policy if exists resource_changelog_read on public.resource_changelog;
create policy resource_changelog_read on public.resource_changelog for select using (exists(select 1 from public.resources r where r.id=resource_id and r.moderation_status='approved') or public.is_eduhub_admin());
drop policy if exists resource_changelog_insert_owner_admin on public.resource_changelog;
create policy resource_changelog_insert_owner_admin on public.resource_changelog for insert to authenticated with check (author_id=(select auth.uid()) and (public.is_eduhub_admin() or exists(select 1 from public.resources r where r.id=resource_id and r.author_id=(select auth.uid()))));
drop policy if exists resource_changelog_update_owner_admin on public.resource_changelog;
create policy resource_changelog_update_owner_admin on public.resource_changelog for update to authenticated using (author_id=(select auth.uid()) or public.is_eduhub_admin()) with check (author_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists resource_changelog_delete_owner_admin on public.resource_changelog;
create policy resource_changelog_delete_owner_admin on public.resource_changelog for delete to authenticated using (author_id=(select auth.uid()) or public.is_eduhub_admin());

drop policy if exists resource_collections_read on public.resource_collections;
create policy resource_collections_read on public.resource_collections for select using (owner_id=(select auth.uid()) or is_public or public.is_eduhub_admin());
drop policy if exists resource_collections_insert_self on public.resource_collections;
create policy resource_collections_insert_self on public.resource_collections for insert to authenticated with check (owner_id=(select auth.uid()));
drop policy if exists resource_collections_update_self on public.resource_collections;
create policy resource_collections_update_self on public.resource_collections for update to authenticated using (owner_id=(select auth.uid()) or public.is_eduhub_admin()) with check (owner_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists resource_collections_delete_self on public.resource_collections;
create policy resource_collections_delete_self on public.resource_collections for delete to authenticated using (owner_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists collection_items_read on public.resource_collection_items;
create policy collection_items_read on public.resource_collection_items for select using (exists(select 1 from public.resource_collections c where c.id=collection_id and (c.owner_id=(select auth.uid()) or c.is_public or public.is_eduhub_admin())));
drop policy if exists collection_items_insert_owner on public.resource_collection_items;
create policy collection_items_insert_owner on public.resource_collection_items for insert to authenticated with check (exists(select 1 from public.resource_collections c where c.id=collection_id and c.owner_id=(select auth.uid())) and exists(select 1 from public.resources r where r.id=resource_id and r.moderation_status='approved'));
drop policy if exists collection_items_delete_owner on public.resource_collection_items;
create policy collection_items_delete_owner on public.resource_collection_items for delete to authenticated using (exists(select 1 from public.resource_collections c where c.id=collection_id and (c.owner_id=(select auth.uid()) or public.is_eduhub_admin())));

drop policy if exists content_reports_insert_self on public.content_reports;
create policy content_reports_insert_self on public.content_reports for insert to authenticated with check (reporter_id=(select auth.uid()) and exists(select 1 from public.resources r where r.id=resource_id and r.moderation_status='approved'));
drop policy if exists content_reports_read_reporter_admin on public.content_reports;
create policy content_reports_read_reporter_admin on public.content_reports for select to authenticated using (reporter_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists content_reports_update_admin on public.content_reports;
create policy content_reports_update_admin on public.content_reports for update to authenticated using (public.is_eduhub_admin()) with check (public.is_eduhub_admin());

drop policy if exists edu_point_events_public_read on public.edu_point_events;
create policy edu_point_events_public_read on public.edu_point_events for select using (true);
revoke all on public.edu_point_events from anon, authenticated;
grant select on public.edu_point_events to anon, authenticated;

-- Point history records signed deltas, so week/month rankings naturally include reversals.
create or replace function public.sync_resource_upvote_count()
returns trigger language plpgsql security definer set search_path=public as $$
declare target_resource uuid; point_delta integer; target_author uuid; applied_delta integer; current_points integer;
begin
  target_resource:=coalesce(new.resource_id,old.resource_id);
  point_delta:=case when tg_op='INSERT' then 5 else -5 end;
  update public.resources set upvotes_count=greatest(0,upvotes_count+point_delta/5) where id=target_resource returning author_id into target_author;
  if target_author is not null then
    select edu_points into current_points from public.profiles where id=target_author;
    applied_delta:=greatest(0,current_points+point_delta)-current_points;
    update public.profiles set edu_points=greatest(0,edu_points+point_delta) where id=target_author;
    if applied_delta<>0 then insert into public.edu_point_events(profile_id,actor_id,resource_id,event_type,points) values(target_author,case when tg_op='INSERT' then new.user_id else old.user_id end,target_resource,'project_upvote',applied_delta); end if;
  end if;
  return coalesce(new,old);
end; $$;

create or replace function public.award_approved_resource_points()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' and new.moderation_status='approved' then
    insert into public.teacher_activities(profile_id,activity_type,resource_id) values(new.author_id,'project_approved',new.id) on conflict do nothing;
    if found then update public.profiles set edu_points=edu_points+50 where id=new.author_id; insert into public.edu_point_events(profile_id,resource_id,event_type,points) values(new.author_id,new.id,'project_approved',50); end if;
  elsif tg_op='UPDATE' and old.moderation_status is distinct from new.moderation_status and new.moderation_status='approved' then
    insert into public.teacher_activities(profile_id,activity_type,resource_id) values(new.author_id,'project_approved',new.id) on conflict do nothing;
    if found then update public.profiles set edu_points=edu_points+50 where id=new.author_id; insert into public.edu_point_events(profile_id,resource_id,event_type,points) values(new.author_id,new.id,'project_approved',50); end if;
  end if;
  return new;
end; $$;

create or replace function public.sync_eduhub_rating_summary()
returns trigger language plpgsql security definer set search_path=public as $$
declare target_resource uuid; target_author uuid; points_delta integer:=0; applied_delta integer; current_points integer; actor uuid;
begin
  target_resource:=coalesce(new.resource_id,old.resource_id);
  if tg_op in ('UPDATE','DELETE') and old.stars>=4 then points_delta:=points_delta-old.weight*2; end if;
  if tg_op in ('INSERT','UPDATE') and new.stars>=4 then points_delta:=points_delta+new.weight*2; end if;
  update public.resources r set rating_avg=coalesce((select round(sum(rr.stars*rr.weight)::numeric/nullif(sum(rr.weight),0),2) from public.resource_ratings rr where rr.resource_id=target_resource),0),rating_count=(select count(*) from public.resource_ratings rr where rr.resource_id=target_resource) where r.id=target_resource returning r.author_id into target_author;
  actor:=case when tg_op='DELETE' then old.user_id else new.user_id end;
  if target_author is not null and points_delta<>0 then
    select edu_points into current_points from public.profiles where id=target_author;
    applied_delta:=greatest(0,current_points+points_delta)-current_points;
    update public.profiles set edu_points=greatest(0,edu_points+points_delta) where id=target_author;
    if applied_delta<>0 then insert into public.edu_point_events(profile_id,actor_id,resource_id,event_type,points) values(target_author,actor,target_resource,'project_rating',applied_delta); end if;
  end if;
  if tg_op='INSERT' and target_author is not null then insert into public.teacher_activities(profile_id,actor_id,resource_id,activity_type) values(target_author,new.user_id,target_resource,'project_rated'); end if;
  return coalesce(new,old);
end; $$;

revoke all on public.resource_feedback, public.resource_feedback_votes, public.resource_changelog, public.resource_collections, public.resource_collection_items, public.content_reports from anon, authenticated;
grant select on public.resource_feedback, public.resource_changelog, public.resource_collections, public.resource_collection_items to anon;
grant select, insert, update, delete on public.resource_feedback, public.resource_changelog, public.resource_collections to authenticated;
grant select, insert, delete on public.resource_feedback_votes, public.resource_collection_items to authenticated;
grant select, insert, update on public.content_reports to authenticated;



-- Threaded realtime discussions and teacher contact fields.
alter table public.profiles add column if not exists profile_completed_at timestamptz;
alter table public.profiles add column if not exists contact_website text;
alter table public.profiles add column if not exists contact_facebook text;
alter table public.profiles add column if not exists contact_email text;

alter table public.talk_replies add column if not exists parent_reply_id uuid references public.talk_replies(id) on delete cascade;
create index if not exists talk_replies_thread_idx on public.talk_replies(talk_id, created_at);
create index if not exists talk_replies_parent_idx on public.talk_replies(parent_reply_id, created_at);

create or replace function public.validate_talk_reply_parent()
returns trigger language plpgsql as $$
begin
  if new.parent_reply_id is not null and not exists (
    select 1 from public.talk_replies parent
    where parent.id = new.parent_reply_id and parent.talk_id = new.talk_id
  ) then
    raise exception 'Câu trả lời gốc phải thuộc cùng chủ đề thảo luận.';
  end if;
  return new;
end;
$$;
drop trigger if exists talk_reply_parent_same_topic on public.talk_replies;
create trigger talk_reply_parent_same_topic before insert or update of parent_reply_id, talk_id
  on public.talk_replies for each row execute function public.validate_talk_reply_parent();

create table if not exists public.talk_reply_likes (
  reply_id uuid not null references public.talk_replies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reply_id, user_id)
);
create index if not exists talk_reply_likes_user_idx on public.talk_reply_likes(user_id);

alter table public.talk_reply_likes enable row level security;
drop policy if exists talk_reply_likes_read on public.talk_reply_likes;
create policy talk_reply_likes_read on public.talk_reply_likes for select using (true);
drop policy if exists talk_reply_likes_insert_self on public.talk_reply_likes;
create policy talk_reply_likes_insert_self on public.talk_reply_likes for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists talk_reply_likes_delete_self on public.talk_reply_likes;
create policy talk_reply_likes_delete_self on public.talk_reply_likes for delete to authenticated
  using (user_id = auth.uid());

grant select on public.talk_reply_likes to anon, authenticated;
grant insert, delete on public.talk_reply_likes to authenticated;
grant update (profile_completed_at, contact_website, contact_facebook, contact_email) on public.profiles to authenticated;

-- Supabase Realtime requires the tables to be in its publication. This block is safe to re-run.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'talks') then
      alter publication supabase_realtime add table public.talks;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'talk_replies') then
      alter publication supabase_realtime add table public.talk_replies;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'talk_reply_likes') then
      alter publication supabase_realtime add table public.talk_reply_likes;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teacher_activities') then
      alter publication supabase_realtime add table public.teacher_activities;
    end if;
  end if;
end $$;


-- EduHub production administration extension. Included in supabase_setup.sql.

-- Anonymous/authenticated page-view collection. visitor_id is a random browser token,
-- not an email, IP address, or other direct identifier.
create table if not exists public.site_page_views (
  id bigint generated by default as identity primary key,
  visitor_id uuid not null,
  user_id uuid references public.profiles(id) on delete set null,
  path text not null check (char_length(path) between 1 and 300),
  created_at timestamptz not null default now()
);
create index if not exists site_page_views_created_idx on public.site_page_views(created_at desc);
create index if not exists site_page_views_path_created_idx on public.site_page_views(path, created_at desc);
alter table public.site_page_views enable row level security;
drop policy if exists site_page_views_insert on public.site_page_views;
create policy site_page_views_insert on public.site_page_views for insert to anon, authenticated
  with check (char_length(path) between 1 and 300 and (user_id is null or user_id = (select auth.uid())));
drop policy if exists site_page_views_admin_read on public.site_page_views;
create policy site_page_views_admin_read on public.site_page_views for select to authenticated
  using (public.is_eduhub_admin());
revoke all on public.site_page_views from anon, authenticated;
grant insert on public.site_page_views to anon, authenticated;
grant select on public.site_page_views to authenticated;
grant usage, select on sequence public.site_page_views_id_seq to anon, authenticated;

-- Admin-only RPC exposes auth emails to the admin console without adding them to
-- the publicly-readable profiles table.
create or replace function public.admin_list_users()
returns table (
  profile_id uuid,
  email text,
  full_name text,
  school_name text,
  subject_specialty text,
  role text,
  teacher_verified boolean,
  created_at timestamptz,
  edu_points integer
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_eduhub_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.full_name, p.school_name, p.subject_specialty,
      p.role, p.teacher_verified, p.created_at, p.edu_points
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- Prevent accidentally locking the community out of its last administrator.
create or replace function public.keep_one_eduhub_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'admin' and new.role <> 'admin'
    and (select count(*) from public.profiles where role = 'admin' and id <> old.id) = 0 then
    raise exception 'EduHub must retain at least one administrator.';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_keep_one_admin on public.profiles;
create trigger profiles_keep_one_admin before update of role on public.profiles
  for each row execute function public.keep_one_eduhub_admin();

-- Bootstrap the named owner account after Supabase Auth confirms its email.
-- The password is entered in Supabase Auth and is never stored in SQL or frontend code.
create or replace function public.promote_eduhub_bootstrap_admin()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if lower(coalesce(new.email, '')) = 'admin@gmail.com' and new.email_confirmed_at is not null then
    update public.profiles set role = 'admin' where id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists zzz_eduhub_bootstrap_admin_after_insert on auth.users;
create trigger zzz_eduhub_bootstrap_admin_after_insert after insert on auth.users
  for each row execute function public.promote_eduhub_bootstrap_admin();
drop trigger if exists zzz_eduhub_bootstrap_admin_after_confirmation on auth.users;
create trigger zzz_eduhub_bootstrap_admin_after_confirmation after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is distinct from new.email_confirmed_at)
  execute function public.promote_eduhub_bootstrap_admin();

-- Promote an already-created, verified owner account when this file is applied.
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id and lower(u.email) = 'admin@gmail.com'
  and u.email_confirmed_at is not null;
