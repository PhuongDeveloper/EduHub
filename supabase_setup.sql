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
  description_images text[] not null default '{}',
  website_html text,
  website_slug text,
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
  attachment_urls text[] not null default '{}', mentioned_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.talk_replies (
  id uuid primary key default gen_random_uuid(),
  talk_id uuid not null references public.talks(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  attachment_urls text[] not null default '{}', mentioned_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.talk_votes (
  talk_id uuid not null references public.talks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (talk_id, user_id)
);
create index if not exists talk_votes_user_idx on public.talk_votes(user_id, created_at desc);

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
alter table public.resources add column if not exists description_images text[] not null default '{}';
alter table public.resources add column if not exists website_html text;
alter table public.resources add column if not exists website_slug text;
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
create unique index if not exists resources_website_slug_idx on public.resources (website_slug) where website_slug is not null;
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
alter table public.talk_votes enable row level security;
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

drop policy if exists talk_votes_read on public.talk_votes;
create policy talk_votes_read on public.talk_votes for select using (true);
drop policy if exists talk_votes_insert_self on public.talk_votes;
create policy talk_votes_insert_self on public.talk_votes for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.talks t where t.id = talk_id and t.author_id <> (select auth.uid())
  ));
drop policy if exists talk_votes_delete_self on public.talk_votes;
create policy talk_votes_delete_self on public.talk_votes for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_eduhub_admin());
grant select on public.talk_votes to anon, authenticated;
grant insert, delete on public.talk_votes to authenticated;

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
alter table public.content_reports drop constraint if exists content_reports_reason_check;
alter table public.content_reports add constraint content_reports_reason_check check (reason in ('copyright','privacy','spam','misleading','unsafe','broken_link','other'));

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
alter table public.talks add column if not exists accepted_reply_id uuid;
grant update (accepted_reply_id) on public.talks to authenticated;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'talks_accepted_reply_id_fkey' and conrelid = 'public.talks'::regclass) then
    alter table public.talks add constraint talks_accepted_reply_id_fkey
      foreign key (accepted_reply_id) references public.talk_replies(id) on delete set null;
  end if;
end $$;
create index if not exists talks_accepted_reply_idx on public.talks(accepted_reply_id) where accepted_reply_id is not null;

create or replace function public.validate_talk_accepted_reply()
returns trigger language plpgsql as $$
begin
  if new.accepted_reply_id is not null and not exists (
    select 1 from public.talk_replies r where r.id = new.accepted_reply_id and r.talk_id = new.id
  ) then
    raise exception 'Câu trả lời được chọn phải thuộc đúng chủ đề';
  end if;
  return new;
end;
$$;
drop trigger if exists talks_validate_accepted_reply on public.talks;
create trigger talks_validate_accepted_reply before insert or update of accepted_reply_id on public.talks
  for each row execute function public.validate_talk_accepted_reply();
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
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'talk_votes') then
      alter publication supabase_realtime add table public.talk_votes;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'talks') then
      alter publication supabase_realtime add table public.talks;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'talk_replies') then
      alter publication supabase_realtime add table public.talk_replies;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'talk_reply_likes') then
      alter publication supabase_realtime add table public.talk_reply_likes;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resource_comments') then
      alter publication supabase_realtime add table public.resource_comments;
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

-- Teacher classroom-use notes add practical context to shared learning resources.
create table if not exists public.resource_classroom_uses (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  grade_level text not null check (grade_level in ('Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5','Lớp 6','Lớp 7','Lớp 8','Lớp 9','Lớp 10','Lớp 11','Lớp 12')),
  subject text not null check (char_length(subject) between 1 and 100),
  used_on date not null default current_date check (used_on <= current_date),
  outcome text not null check (char_length(trim(outcome)) between 1 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (resource_id, teacher_id)
);
create index if not exists resource_classroom_uses_resource_date_idx
  on public.resource_classroom_uses(resource_id, used_on desc);
alter table public.resource_classroom_uses enable row level security;
drop policy if exists resource_classroom_uses_read on public.resource_classroom_uses;
create policy resource_classroom_uses_read on public.resource_classroom_uses for select to anon, authenticated
  using (exists (select 1 from public.resources r where r.id = resource_id and (r.moderation_status = 'approved' or public.is_eduhub_admin())));
drop policy if exists resource_classroom_uses_insert on public.resource_classroom_uses;
create policy resource_classroom_uses_insert on public.resource_classroom_uses for insert to authenticated
  with check (
    teacher_id = (select auth.uid())
    and exists (select 1 from public.resources r where r.id = resource_id and r.moderation_status = 'approved' and r.author_id <> (select auth.uid()))
  );

-- Real, admin-managed teaching challenges and entries (replaces UI-only contest cards).
create table if not exists public.teaching_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 8 and 140),
  description text not null default '' check (char_length(description) <= 1600),
  criteria text[] not null default '{}',
  reward text not null default '' check (char_length(reward) <= 240),
  deadline timestamptz not null,
  status text not null default 'open' check (status in ('draft','open','closed')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists teaching_challenges_status_deadline_idx on public.teaching_challenges(status, deadline);
alter table public.teaching_challenges enable row level security;
drop policy if exists teaching_challenges_read_public_or_admin on public.teaching_challenges;
create policy teaching_challenges_read_public_or_admin on public.teaching_challenges for select to anon, authenticated using (status <> 'draft' or public.is_eduhub_admin());
drop policy if exists teaching_challenges_admin_insert on public.teaching_challenges;
create policy teaching_challenges_admin_insert on public.teaching_challenges for insert to authenticated with check (public.is_eduhub_admin() and created_by = (select auth.uid()));
drop policy if exists teaching_challenges_admin_update on public.teaching_challenges;
create policy teaching_challenges_admin_update on public.teaching_challenges for update to authenticated using (public.is_eduhub_admin()) with check (public.is_eduhub_admin());
drop policy if exists teaching_challenges_admin_delete on public.teaching_challenges;
create policy teaching_challenges_admin_delete on public.teaching_challenges for delete to authenticated using (public.is_eduhub_admin());

create table if not exists public.teaching_challenge_entries (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.teaching_challenges(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted','shortlisted','winner','rejected')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  unique(challenge_id, resource_id),
  check (reviewed_by is null or reviewed_by is distinct from author_id)
);
create index if not exists teaching_challenge_entries_challenge_idx on public.teaching_challenge_entries(challenge_id, created_at desc);
create index if not exists teaching_challenge_entries_author_idx on public.teaching_challenge_entries(author_id, created_at desc);
alter table public.teaching_challenge_entries enable row level security;
drop policy if exists teaching_challenge_entries_read on public.teaching_challenge_entries;
create policy teaching_challenge_entries_read on public.teaching_challenge_entries for select to anon, authenticated using (exists (select 1 from public.teaching_challenges c where c.id = challenge_id and (c.status <> 'draft' or public.is_eduhub_admin())) and (status <> 'rejected' or author_id = (select auth.uid()) or public.is_eduhub_admin()));
drop policy if exists teaching_challenge_entries_insert_owner on public.teaching_challenge_entries;
create policy teaching_challenge_entries_insert_owner on public.teaching_challenge_entries for insert to authenticated with check (
  author_id = (select auth.uid()) and status = 'submitted'
  and exists (select 1 from public.resources r where r.id = resource_id and r.author_id = (select auth.uid()) and r.moderation_status = 'approved')
  and exists (select 1 from public.teaching_challenges c where c.id = challenge_id and c.status = 'open' and c.deadline > now())
);
drop policy if exists teaching_challenge_entries_admin_update on public.teaching_challenge_entries;
create policy teaching_challenge_entries_admin_update on public.teaching_challenge_entries for update to authenticated using (public.is_eduhub_admin()) with check (public.is_eduhub_admin());
drop policy if exists teaching_challenge_entries_owner_delete on public.teaching_challenge_entries;
create policy teaching_challenge_entries_owner_delete on public.teaching_challenge_entries for delete to authenticated using (author_id = (select auth.uid()) and status = 'submitted');
revoke all on public.teaching_challenges, public.teaching_challenge_entries from anon, authenticated;
grant select on public.teaching_challenges, public.teaching_challenge_entries to anon, authenticated;
grant insert, update, delete on public.teaching_challenges to authenticated;
grant insert, update, delete on public.teaching_challenge_entries to authenticated;

-- Privacy-preserving author analytics: the client writes a random visitor token;
-- authors can only read daily aggregates for their own approved resources.
create table if not exists public.resource_view_events (
  id bigint generated by default as identity primary key,
  resource_id uuid not null references public.resources(id) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists resource_view_events_resource_created_idx on public.resource_view_events(resource_id, created_at desc);
alter table public.resource_view_events enable row level security;
drop policy if exists resource_view_events_insert_public on public.resource_view_events;
create policy resource_view_events_insert_public on public.resource_view_events for insert to anon, authenticated with check (exists (select 1 from public.resources r where r.id = resource_id and r.moderation_status = 'approved'));
drop policy if exists resource_view_events_admin_read on public.resource_view_events;
create policy resource_view_events_admin_read on public.resource_view_events for select to authenticated using (public.is_eduhub_admin());
revoke all on public.resource_view_events from anon, authenticated;
grant insert on public.resource_view_events to anon, authenticated;
grant select on public.resource_view_events to authenticated;
grant usage, select on sequence public.resource_view_events_id_seq to anon, authenticated;

create or replace function public.get_my_creator_analytics(p_from date default current_date - 29)
returns table(resource_id uuid, title text, day date, views bigint, unique_visitors bigint)
language sql stable security definer set search_path = public
as $$
  select e.resource_id, r.title, (e.created_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
         count(*)::bigint as views, count(distinct e.visitor_id)::bigint as unique_visitors
  from public.resource_view_events e
  join public.resources r on r.id = e.resource_id
  where r.author_id = (select auth.uid())
    and r.moderation_status = 'approved'
    and e.created_at >= (p_from::timestamp at time zone 'Asia/Ho_Chi_Minh')
  group by e.resource_id, r.title, (e.created_at at time zone 'Asia/Ho_Chi_Minh')::date
  order by day desc, views desc;
$$;
revoke all on function public.get_my_creator_analytics(date) from public, anon;
grant execute on function public.get_my_creator_analytics(date) to authenticated;

-- A creator can appeal a rejection once while it is under active review.
create table if not exists public.resource_moderation_appeals (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  request text not null check (char_length(request) between 20 and 2500),
  status text not null default 'pending' check (status in ('pending','reviewing','reinstated','upheld')),
  admin_note text not null default '' check (char_length(admin_note) <= 2000),
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz
);
create unique index if not exists resource_moderation_appeals_one_open_idx on public.resource_moderation_appeals(resource_id) where status in ('pending','reviewing');
create index if not exists resource_moderation_appeals_status_idx on public.resource_moderation_appeals(status, created_at desc);
alter table public.resource_moderation_appeals enable row level security;
drop policy if exists resource_moderation_appeals_read_owner_admin on public.resource_moderation_appeals;
create policy resource_moderation_appeals_read_owner_admin on public.resource_moderation_appeals for select to authenticated using (author_id = (select auth.uid()) or public.is_eduhub_admin());
drop policy if exists resource_moderation_appeals_insert_owner on public.resource_moderation_appeals;
create policy resource_moderation_appeals_insert_owner on public.resource_moderation_appeals for insert to authenticated with check (
  author_id = (select auth.uid()) and status = 'pending'
  and exists (select 1 from public.resources r where r.id = resource_id and r.author_id = (select auth.uid()) and r.moderation_status = 'rejected')
);
drop policy if exists resource_moderation_appeals_update_admin on public.resource_moderation_appeals;
create policy resource_moderation_appeals_update_admin on public.resource_moderation_appeals for update to authenticated using (public.is_eduhub_admin()) with check (public.is_eduhub_admin());
revoke all on public.resource_moderation_appeals from anon, authenticated;
grant select, insert, update on public.resource_moderation_appeals to authenticated;

-- Saved classroom filters can create in-app notifications when matching resources are approved.
create table if not exists public.resource_search_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  keywords text not null default '' check (char_length(keywords) <= 80),
  subjects text[] not null default '{}',
  grade_levels text[] not null default '{}',
  resource_types text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(user_id, keywords, subjects, grade_levels, resource_types)
);
create index if not exists resource_search_subscriptions_user_idx on public.resource_search_subscriptions(user_id, created_at desc);
alter table public.resource_search_subscriptions enable row level security;
drop policy if exists resource_search_subscriptions_owner_all on public.resource_search_subscriptions;
create policy resource_search_subscriptions_owner_all on public.resource_search_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.resource_search_subscriptions from anon, authenticated;
grant select, insert, delete on public.resource_search_subscriptions to authenticated;

alter table public.teacher_activities drop constraint if exists teacher_activities_activity_type_check;
alter table public.teacher_activities add constraint teacher_activities_activity_type_check
  check (activity_type in ('project_approved','project_liked','project_commented','project_rated','resource_match'));
drop policy if exists teacher_activities_read on public.teacher_activities;
create policy teacher_activities_read on public.teacher_activities for select to anon, authenticated
  using (activity_type <> 'resource_match' or profile_id = (select auth.uid()) or public.is_eduhub_admin());
create unique index if not exists teacher_activities_resource_match_once_idx
  on public.teacher_activities(profile_id, resource_id) where activity_type = 'resource_match';
create or replace function public.notify_matching_resource_subscribers()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.moderation_status <> 'approved' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.moderation_status = 'approved' then return new; end if;
  end if;
  insert into public.teacher_activities(profile_id, actor_id, resource_id, activity_type)
  select s.user_id, new.author_id, new.id, 'resource_match'
  from public.resource_search_subscriptions s
  where s.user_id <> new.author_id
    and (coalesce(cardinality(s.subjects), 0) = 0 or s.subjects && coalesce(new.subjects, '{}'::text[]))
    and (coalesce(cardinality(s.grade_levels), 0) = 0 or s.grade_levels && coalesce(new.grade_levels, '{}'::text[]))
    and (coalesce(cardinality(s.resource_types), 0) = 0 or s.resource_types @> array[new.resource_type])
    and (s.keywords = '' or (new.title || ' ' || new.description || ' ' || array_to_string(coalesce(new.tags, '{}'::text[]), ' ')) ilike '%' || s.keywords || '%')
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists resources_notify_matching_subscribers on public.resources;
create trigger resources_notify_matching_subscribers after insert or update of moderation_status on public.resources
  for each row execute function public.notify_matching_resource_subscribers();

-- Lesson plan tables must exist before scheduling and collaboration tables reference them.
-- Batch 1 feature: private/shareable lesson plans composed from EduHub resources.
create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 4 and 160),
  subject text not null check (char_length(subject) between 1 and 100),
  grade_level text not null check (grade_level in ('Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5','Lớp 6','Lớp 7','Lớp 8','Lớp 9','Lớp 10','Lớp 11','Lớp 12')),
  duration_minutes integer not null default 45 check (duration_minutes between 10 and 240),
  objectives text not null default '' check (char_length(objectives) <= 2000),
  prep_notes text not null default '' check (char_length(prep_notes) <= 2000),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lesson_plans_public_updated_idx on public.lesson_plans(is_public, updated_at desc);
create index if not exists lesson_plans_owner_updated_idx on public.lesson_plans(author_id, updated_at desc);
alter table public.lesson_plans enable row level security;

create table if not exists public.lesson_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.lesson_plans(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete set null,
  custom_title text not null check (char_length(trim(custom_title)) between 1 and 180),
  activity text not null default '' check (char_length(activity) <= 2000),
  duration_minutes integer not null default 10 check (duration_minutes between 1 and 180),
  position integer not null default 1 check (position > 0),
  created_at timestamptz not null default now()
);
create index if not exists lesson_plan_items_order_idx on public.lesson_plan_items(plan_id, position);
alter table public.lesson_plan_items enable row level security;

-- Teacher-only calendar entries for scheduling a reusable lesson plan with a class.
create table if not exists public.lesson_schedule_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.lesson_plans(id) on delete set null,
  class_label text not null check (char_length(trim(class_label)) between 1 and 80),
  scheduled_for date not null,
  status text not null default 'preparing' check (status in ('preparing','ready','taught')),
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lesson_schedule_entries_owner_date_idx on public.lesson_schedule_entries(owner_id, scheduled_for);
alter table public.lesson_schedule_entries enable row level security;
drop policy if exists lesson_schedule_entries_owner_all on public.lesson_schedule_entries;
create policy lesson_schedule_entries_owner_all on public.lesson_schedule_entries for all to authenticated
  using (owner_id = (select auth.uid())) with check (
    owner_id = (select auth.uid())
    and (plan_id is null or exists (select 1 from public.lesson_plans p where p.id = plan_id and (p.author_id = (select auth.uid()) or p.is_public)))
  );
revoke all on public.lesson_schedule_entries from anon, authenticated;
grant select, insert, update, delete on public.lesson_schedule_entries to authenticated;

-- Lesson-plan collaborators can view or edit only plans shared by their owner.
create table if not exists public.lesson_plan_collaborators (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.lesson_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer','editor')),
  invited_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(plan_id, user_id)
);
create index if not exists lesson_plan_collaborators_user_idx on public.lesson_plan_collaborators(user_id, plan_id);
alter table public.lesson_plan_collaborators enable row level security;
create or replace function public.is_lesson_plan_collaborator(p_plan_id uuid, p_user_id uuid, p_required_role text default null)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.lesson_plan_collaborators c where c.plan_id = p_plan_id and c.user_id = p_user_id and (p_required_role is null or c.role = p_required_role)) $$;
revoke all on function public.is_lesson_plan_collaborator(uuid, uuid, text) from public, anon;
grant execute on function public.is_lesson_plan_collaborator(uuid, uuid, text) to authenticated;
drop policy if exists lesson_plan_collaborators_read_owner_or_invited on public.lesson_plan_collaborators;
create policy lesson_plan_collaborators_read_owner_or_invited on public.lesson_plan_collaborators for select to authenticated
  using (user_id = (select auth.uid()) or public.is_eduhub_admin() or exists (select 1 from public.lesson_plans p where p.id = plan_id and p.author_id = (select auth.uid())));
drop policy if exists lesson_plan_collaborators_owner_insert on public.lesson_plan_collaborators;
create policy lesson_plan_collaborators_owner_insert on public.lesson_plan_collaborators for insert to authenticated
  with check (invited_by = (select auth.uid()) and user_id <> (select auth.uid()) and exists (select 1 from public.lesson_plans p where p.id = plan_id and p.author_id = (select auth.uid())));
drop policy if exists lesson_plan_collaborators_owner_update on public.lesson_plan_collaborators;
create policy lesson_plan_collaborators_owner_update on public.lesson_plan_collaborators for update to authenticated
  using (exists (select 1 from public.lesson_plans p where p.id = plan_id and p.author_id = (select auth.uid())))
  with check (exists (select 1 from public.lesson_plans p where p.id = plan_id and p.author_id = (select auth.uid())));
drop policy if exists lesson_plan_collaborators_owner_delete on public.lesson_plan_collaborators;
create policy lesson_plan_collaborators_owner_delete on public.lesson_plan_collaborators for delete to authenticated
  using (exists (select 1 from public.lesson_plans p where p.id = plan_id and p.author_id = (select auth.uid())));
revoke all on public.lesson_plan_collaborators from anon, authenticated;
grant select, insert, update, delete on public.lesson_plan_collaborators to authenticated;

drop policy if exists lesson_plans_read_shared_or_owner on public.lesson_plans;
create policy lesson_plans_read_shared_or_owner on public.lesson_plans for select to anon, authenticated
  using (is_public or author_id = (select auth.uid()) or public.is_eduhub_admin() or public.is_lesson_plan_collaborator(id, (select auth.uid())));
drop policy if exists lesson_plans_update_self on public.lesson_plans;
create policy lesson_plans_update_self on public.lesson_plans for update to authenticated
  using (author_id = (select auth.uid()) or public.is_eduhub_admin() or public.is_lesson_plan_collaborator(id, (select auth.uid()), 'editor'))
  with check (author_id = (select auth.uid()) or public.is_eduhub_admin() or public.is_lesson_plan_collaborator(id, (select auth.uid()), 'editor'));
drop policy if exists lesson_plan_items_read_shared_or_owner on public.lesson_plan_items;
create policy lesson_plan_items_read_shared_or_owner on public.lesson_plan_items for select to anon, authenticated
  using (exists (select 1 from public.lesson_plans p where p.id = plan_id and (p.is_public or p.author_id = (select auth.uid()) or public.is_eduhub_admin() or public.is_lesson_plan_collaborator(p.id, (select auth.uid())))));
drop policy if exists lesson_plan_items_insert_owner on public.lesson_plan_items;
create policy lesson_plan_items_insert_owner on public.lesson_plan_items for insert to authenticated
  with check (exists (select 1 from public.lesson_plans p where p.id = plan_id and (p.author_id = (select auth.uid()) or public.is_lesson_plan_collaborator(p.id, (select auth.uid()), 'editor')))
    and (resource_id is null or exists (select 1 from public.resources r where r.id = resource_id and r.moderation_status = 'approved')));
drop policy if exists lesson_plan_items_update_owner on public.lesson_plan_items;
create policy lesson_plan_items_update_owner on public.lesson_plan_items for update to authenticated
  using (exists (select 1 from public.lesson_plans p where p.id = plan_id and (p.author_id = (select auth.uid()) or public.is_lesson_plan_collaborator(p.id, (select auth.uid()), 'editor'))))
  with check (exists (select 1 from public.lesson_plans p where p.id = plan_id and (p.author_id = (select auth.uid()) or public.is_lesson_plan_collaborator(p.id, (select auth.uid()), 'editor'))));
drop policy if exists lesson_plan_items_delete_owner on public.lesson_plan_items;
create policy lesson_plan_items_delete_owner on public.lesson_plan_items for delete to authenticated
  using (exists (select 1 from public.lesson_plans p where p.id = plan_id and (p.author_id = (select auth.uid()) or public.is_eduhub_admin() or public.is_lesson_plan_collaborator(p.id, (select auth.uid()), 'editor'))));

-- Editors may update lesson content, but the plan owner identity remains immutable to collaborators.
create or replace function public.prevent_lesson_plan_author_transfer()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if new.author_id is distinct from old.author_id
     and old.author_id <> (select auth.uid())
     and not public.is_eduhub_admin() then
    raise exception 'Only the plan owner or an administrator can change the plan owner';
  end if;
  return new;
end;
$$;
drop trigger if exists lesson_plans_prevent_author_transfer on public.lesson_plans;
create trigger lesson_plans_prevent_author_transfer
  before update of author_id on public.lesson_plans
  for each row execute function public.prevent_lesson_plan_author_transfer();

-- Batch 3: teacher discussion subscriptions and reports.
create table if not exists public.talk_channel_subscriptions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_channel text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, subject_channel)
);
alter table public.talk_channel_subscriptions enable row level security;
drop policy if exists talk_channel_subscriptions_owner_all on public.talk_channel_subscriptions;
create policy talk_channel_subscriptions_owner_all on public.talk_channel_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.talk_channel_subscriptions from anon, authenticated;
grant select, insert, delete on public.talk_channel_subscriptions to authenticated;

create table if not exists public.talk_content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  talk_id uuid not null references public.talks(id) on delete cascade,
  reply_id uuid references public.talk_replies(id) on delete cascade,
  reason text not null check (reason in ('spam','harassment','student_privacy','copyright','other')),
  details text not null default '' check (char_length(details) <= 1200),
  status text not null default 'pending' check (status in ('pending','reviewing','resolved','dismissed')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);
create index if not exists talk_content_reports_status_idx on public.talk_content_reports(status, created_at desc);
alter table public.talk_content_reports enable row level security;
drop policy if exists talk_content_reports_insert_self on public.talk_content_reports;
create policy talk_content_reports_insert_self on public.talk_content_reports for insert to authenticated
  with check (reporter_id = (select auth.uid())
    and not exists (select 1 from public.talks t where t.id = talk_id and t.author_id = (select auth.uid()))
    and (reply_id is null or exists (select 1 from public.talk_replies r where r.id = reply_id and r.talk_id = talk_id and r.author_id <> (select auth.uid()))));
drop policy if exists talk_content_reports_read_reporter_admin on public.talk_content_reports;
create policy talk_content_reports_read_reporter_admin on public.talk_content_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_eduhub_admin());
drop policy if exists talk_content_reports_update_admin on public.talk_content_reports;
create policy talk_content_reports_update_admin on public.talk_content_reports for update to authenticated
  using (public.is_eduhub_admin()) with check (public.is_eduhub_admin());
revoke all on public.talk_content_reports from anon, authenticated;
grant select, insert, update on public.talk_content_reports to authenticated;

alter table public.teacher_activities drop constraint if exists teacher_activities_activity_type_check;
alter table public.teacher_activities add constraint teacher_activities_activity_type_check check (activity_type in ('project_approved','project_liked','project_commented','project_rated','resource_match','talk_match','talk_mention'));
alter table public.talks add column if not exists attachment_urls text[] not null default '{}';
alter table public.talks add column if not exists mentioned_user_ids uuid[] not null default '{}';
alter table public.talk_replies add column if not exists attachment_urls text[] not null default '{}';
alter table public.talk_replies add column if not exists mentioned_user_ids uuid[] not null default '{}';
create or replace function public.notify_mentioned_teachers()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_user uuid; v_mentions uuid[];
begin
  v_mentions:=coalesce(new.mentioned_user_ids,'{}'::uuid[]);
  foreach v_user in array v_mentions loop
    if v_user is not null and v_user<>new.author_id and exists(select 1 from public.profiles p where p.id=v_user and p.role='teacher') then
      insert into public.teacher_activities(profile_id,actor_id,resource_id,activity_type)
      values(v_user,new.author_id,null,'talk_mention');
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists talks_notify_mentions on public.talks;
create trigger talks_notify_mentions after insert on public.talks for each row execute function public.notify_mentioned_teachers();
drop trigger if exists talk_replies_notify_mentions on public.talk_replies;
create trigger talk_replies_notify_mentions after insert on public.talk_replies for each row execute function public.notify_mentioned_teachers();
create or replace function public.notify_talk_channel_subscribers()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.teacher_activities (profile_id, actor_id, resource_id, activity_type)
  select s.user_id, new.author_id, null, 'talk_match'
  from public.talk_channel_subscriptions s
  where s.subject_channel = new.subject_channel and s.user_id <> new.author_id;
  return new;
end;
$$;
drop trigger if exists talks_notify_channel_subscribers on public.talks;
create trigger talks_notify_channel_subscribers after insert on public.talks
  for each row execute function public.notify_talk_channel_subscribers();
drop policy if exists teacher_activities_read on public.teacher_activities;
create policy teacher_activities_read on public.teacher_activities for select to anon, authenticated
  using (activity_type not in ('resource_match','talk_match') or profile_id = (select auth.uid()) or public.is_eduhub_admin());

-- Learning paths add a sequenced teaching journey on top of resource collections.
create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 120), description text not null default '' check (char_length(description) <= 1000),
  subject text not null, is_public boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.learning_path_items (
  id uuid primary key default gen_random_uuid(), path_id uuid not null references public.learning_paths(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade, position integer not null default 1 check (position > 0), objective text not null default '' check (char_length(objective) <= 500),
  unique(path_id, resource_id), unique(path_id, position)
);
create table if not exists public.learning_path_progress (
  user_id uuid not null references public.profiles(id) on delete cascade, item_id uuid not null references public.learning_path_items(id) on delete cascade,
  completed_at timestamptz not null default now(), primary key(user_id, item_id)
);
alter table public.learning_paths enable row level security;
alter table public.learning_path_items enable row level security;
alter table public.learning_path_progress enable row level security;
drop policy if exists learning_paths_read on public.learning_paths;
create policy learning_paths_read on public.learning_paths for select to anon, authenticated using (is_public or owner_id = (select auth.uid()) or public.is_eduhub_admin());
drop policy if exists learning_paths_owner_insert on public.learning_paths;
create policy learning_paths_owner_insert on public.learning_paths for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists learning_paths_owner_update on public.learning_paths;
create policy learning_paths_owner_update on public.learning_paths for update to authenticated using (owner_id = (select auth.uid()) or public.is_eduhub_admin()) with check (owner_id = (select auth.uid()) or public.is_eduhub_admin());
drop policy if exists learning_paths_owner_delete on public.learning_paths;
create policy learning_paths_owner_delete on public.learning_paths for delete to authenticated using (owner_id = (select auth.uid()) or public.is_eduhub_admin());
drop policy if exists learning_path_items_read on public.learning_path_items;
create policy learning_path_items_read on public.learning_path_items for select to anon, authenticated using (exists(select 1 from public.learning_paths p where p.id = path_id and (p.is_public or p.owner_id = (select auth.uid()) or public.is_eduhub_admin())));
drop policy if exists learning_path_items_owner_write on public.learning_path_items;
create policy learning_path_items_owner_write on public.learning_path_items for all to authenticated using (exists(select 1 from public.learning_paths p where p.id = path_id and (p.owner_id = (select auth.uid()) or public.is_eduhub_admin()))) with check (exists(select 1 from public.learning_paths p where p.id = path_id and (p.owner_id = (select auth.uid()) or public.is_eduhub_admin())) and exists(select 1 from public.resources r where r.id = resource_id and r.moderation_status = 'approved'));
drop policy if exists learning_path_progress_self on public.learning_path_progress;
create policy learning_path_progress_self on public.learning_path_progress for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and exists(select 1 from public.learning_path_items i join public.learning_paths p on p.id = i.path_id where i.id = item_id and (p.is_public or p.owner_id = (select auth.uid()))));
revoke all on public.learning_paths, public.learning_path_items, public.learning_path_progress from anon, authenticated;
grant select on public.learning_paths, public.learning_path_items to anon, authenticated;
grant insert, update, delete on public.learning_paths, public.learning_path_items to authenticated;
grant select, insert, delete on public.learning_path_progress to authenticated;

-- Private school / subject groups with membership-controlled resource sharing.
create table if not exists public.teacher_groups (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 3 and 100), school_name text not null default '', subject text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.teacher_group_members (
  group_id uuid not null references public.teacher_groups(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check(role in ('owner','member')), added_by uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), primary key(group_id,user_id)
);
create table if not exists public.teacher_group_resources (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.teacher_groups(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade, added_by uuid not null references public.profiles(id) on delete cascade, note text not null default '', created_at timestamptz not null default now(), unique(group_id,resource_id)
);
create table if not exists public.teacher_group_posts (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.teacher_groups(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade, body text not null check(char_length(trim(body)) between 2 and 3000), created_at timestamptz not null default now()
);
create table if not exists public.teacher_group_replies (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.teacher_group_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade, body text not null check(char_length(trim(body)) between 1 and 2000), created_at timestamptz not null default now()
);
create or replace function public.add_teacher_group_owner()
returns trigger language plpgsql security definer set search_path=public
as $$ begin insert into public.teacher_group_members(group_id,user_id,role,added_by) values(new.id,new.owner_id,'owner',new.owner_id); return new; end $$;
drop trigger if exists teacher_groups_add_owner on public.teacher_groups;
create trigger teacher_groups_add_owner after insert on public.teacher_groups for each row execute function public.add_teacher_group_owner();
create or replace function public.is_teacher_group_member(p_group_id uuid,p_user_id uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.teacher_group_members m where m.group_id=p_group_id and m.user_id=p_user_id) $$;
revoke all on function public.is_teacher_group_member(uuid,uuid) from public,anon;
grant execute on function public.is_teacher_group_member(uuid,uuid) to authenticated;
alter table public.teacher_groups enable row level security; alter table public.teacher_group_members enable row level security; alter table public.teacher_group_resources enable row level security; alter table public.teacher_group_posts enable row level security; alter table public.teacher_group_replies enable row level security;
drop policy if exists teacher_groups_member_read on public.teacher_groups;
create policy teacher_groups_member_read on public.teacher_groups for select to authenticated using (public.is_teacher_group_member(id,(select auth.uid())) or public.is_eduhub_admin());
drop policy if exists teacher_groups_create on public.teacher_groups;
create policy teacher_groups_create on public.teacher_groups for insert to authenticated with check(owner_id=(select auth.uid()));
drop policy if exists teacher_groups_owner_update on public.teacher_groups;
create policy teacher_groups_owner_update on public.teacher_groups for update to authenticated using(owner_id=(select auth.uid()) or public.is_eduhub_admin()) with check(owner_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists teacher_groups_owner_delete on public.teacher_groups;
create policy teacher_groups_owner_delete on public.teacher_groups for delete to authenticated using(owner_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists teacher_group_members_read on public.teacher_group_members;
create policy teacher_group_members_read on public.teacher_group_members for select to authenticated using(public.is_teacher_group_member(group_id,(select auth.uid())) or public.is_eduhub_admin());
drop policy if exists teacher_group_members_owner_write on public.teacher_group_members;
create policy teacher_group_members_owner_write on public.teacher_group_members for all to authenticated using(exists(select 1 from public.teacher_groups g where g.id=group_id and g.owner_id=(select auth.uid())) or public.is_eduhub_admin()) with check(exists(select 1 from public.teacher_groups g where g.id=group_id and g.owner_id=(select auth.uid())) or public.is_eduhub_admin());
drop policy if exists teacher_group_resources_member_read on public.teacher_group_resources;
create policy teacher_group_resources_member_read on public.teacher_group_resources for select to authenticated using(public.is_teacher_group_member(group_id,(select auth.uid())) or public.is_eduhub_admin());
drop policy if exists teacher_group_resources_member_write on public.teacher_group_resources;
create policy teacher_group_resources_member_write on public.teacher_group_resources for all to authenticated using(public.is_teacher_group_member(group_id,(select auth.uid())) or public.is_eduhub_admin()) with check(added_by=(select auth.uid()) and public.is_teacher_group_member(group_id,(select auth.uid())) and exists(select 1 from public.resources r where r.id=resource_id and r.moderation_status='approved'));
drop policy if exists teacher_group_posts_member_access on public.teacher_group_posts;
create policy teacher_group_posts_member_access on public.teacher_group_posts for all to authenticated using(public.is_teacher_group_member(group_id,(select auth.uid())) or public.is_eduhub_admin()) with check(author_id=(select auth.uid()) and public.is_teacher_group_member(group_id,(select auth.uid())));
drop policy if exists teacher_group_replies_member_access on public.teacher_group_replies;
create policy teacher_group_replies_member_access on public.teacher_group_replies for all to authenticated using(exists(select 1 from public.teacher_group_posts p where p.id=post_id and (public.is_teacher_group_member(p.group_id,(select auth.uid())) or public.is_eduhub_admin()))) with check(author_id=(select auth.uid()) and exists(select 1 from public.teacher_group_posts p where p.id=post_id and public.is_teacher_group_member(p.group_id,(select auth.uid()))));
revoke all on public.teacher_groups,public.teacher_group_members,public.teacher_group_resources from anon,authenticated;
grant select,insert,update,delete on public.teacher_groups,public.teacher_group_members,public.teacher_group_resources,public.teacher_group_posts,public.teacher_group_replies to authenticated;

-- Private teacher-to-teacher conversations with realtime-ready message rows.
create table if not exists public.teacher_conversations(id uuid primary key default gen_random_uuid(),created_by uuid not null references public.profiles(id) on delete cascade,created_at timestamptz not null default now());
create table if not exists public.teacher_conversation_members(conversation_id uuid not null references public.teacher_conversations(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,invited_by uuid not null references public.profiles(id) on delete cascade,created_at timestamptz not null default now(),primary key(conversation_id,user_id));
create table if not exists public.teacher_messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references public.teacher_conversations(id) on delete cascade,author_id uuid not null references public.profiles(id) on delete cascade,content text not null check(char_length(trim(content)) between 1 and 4000),created_at timestamptz not null default now());
create or replace function public.is_teacher_conversation_member(p_conversation_id uuid,p_user_id uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.teacher_conversation_members m where m.conversation_id=p_conversation_id and m.user_id=p_user_id) $$;
revoke all on function public.is_teacher_conversation_member(uuid,uuid) from public,anon;
grant execute on function public.is_teacher_conversation_member(uuid,uuid) to authenticated;
alter table public.teacher_conversations enable row level security; alter table public.teacher_conversation_members enable row level security; alter table public.teacher_messages enable row level security;
drop policy if exists teacher_conversations_member_read on public.teacher_conversations;
create policy teacher_conversations_member_read on public.teacher_conversations for select to authenticated using(public.is_teacher_conversation_member(id,(select auth.uid())));
drop policy if exists teacher_conversations_create on public.teacher_conversations;
create policy teacher_conversations_create on public.teacher_conversations for insert to authenticated with check(created_by=(select auth.uid()));
drop policy if exists teacher_conversation_members_read on public.teacher_conversation_members;
create policy teacher_conversation_members_read on public.teacher_conversation_members for select to authenticated using(public.is_teacher_conversation_member(conversation_id,(select auth.uid())));
drop policy if exists teacher_conversation_members_invite on public.teacher_conversation_members;
create policy teacher_conversation_members_invite on public.teacher_conversation_members for insert to authenticated with check(exists(select 1 from public.teacher_conversations c where c.id=conversation_id and c.created_by=(select auth.uid())) and invited_by=(select auth.uid()));
drop policy if exists teacher_messages_member_read on public.teacher_messages;
create policy teacher_messages_member_read on public.teacher_messages for select to authenticated using(public.is_teacher_conversation_member(conversation_id,(select auth.uid())));
drop policy if exists teacher_messages_member_insert on public.teacher_messages;
create policy teacher_messages_member_insert on public.teacher_messages for insert to authenticated with check(author_id=(select auth.uid()) and public.is_teacher_conversation_member(conversation_id,(select auth.uid())));
revoke all on public.teacher_conversations,public.teacher_conversation_members,public.teacher_messages from anon,authenticated;
grant select,insert on public.teacher_conversations,public.teacher_conversation_members,public.teacher_messages to authenticated;
grant select on public.teacher_messages to authenticated;
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teacher_messages') then
    alter publication supabase_realtime add table public.teacher_messages;
  end if;
end $$;

-- Batch 4: school events and a practical help/support center.
-- Teacher verification is a request-and-review process; evidence should be a public credential URL, never an ID document.
create table if not exists public.teacher_verification_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  evidence_url text not null check(evidence_url ~ '^https?://'), explanation text not null default '' check(char_length(explanation) <= 1200),
  status text not null default 'pending' check(status in ('pending','approved','rejected')), admin_note text not null default '',
  reviewed_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), reviewed_at timestamptz
);
create unique index if not exists teacher_verification_one_pending on public.teacher_verification_requests(user_id) where status='pending';
alter table public.profiles add column if not exists show_school boolean not null default true;
alter table public.profiles add column if not exists show_location boolean not null default true;
alter table public.profiles add column if not exists show_activity boolean not null default true;
alter table public.teacher_verification_requests enable row level security;
drop policy if exists teacher_verification_read_self_admin on public.teacher_verification_requests;
create policy teacher_verification_read_self_admin on public.teacher_verification_requests for select to authenticated using(user_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists teacher_verification_submit_self on public.teacher_verification_requests;
create policy teacher_verification_submit_self on public.teacher_verification_requests for insert to authenticated with check(user_id=(select auth.uid()) and status='pending');
drop policy if exists teacher_verification_review_admin on public.teacher_verification_requests;
create policy teacher_verification_review_admin on public.teacher_verification_requests for update to authenticated using(public.is_eduhub_admin()) with check(public.is_eduhub_admin());
revoke all on public.teacher_verification_requests from anon,authenticated;
grant select,insert,update on public.teacher_verification_requests to authenticated;

-- Author-provided compatibility notes help teachers prepare before opening a resource.
alter table public.resources add column if not exists access_requirements text not null default '';
alter table public.resources add column if not exists works_offline boolean not null default false;
alter table public.resources add column if not exists mobile_compatible boolean not null default true;
alter table public.resources add column if not exists requires_login boolean not null default false;
alter table public.resources add column if not exists resource_status text not null default 'current';
alter table public.resources add column if not exists replacement_resource_id uuid references public.resources(id) on delete set null;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='resources_resource_status_check') then
    alter table public.resources add constraint resources_resource_status_check check(resource_status in ('current','outdated','archived'));
  end if;
end $$;
create or replace function public.set_resource_status(p_resource_id uuid,p_status text,p_replacement_resource_id uuid default null)
returns void language plpgsql security definer set search_path=public
as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'Cần đăng nhập để cập nhật tình trạng học liệu.'; end if;
  if p_status not in ('current','outdated','archived') then raise exception 'Tình trạng học liệu không hợp lệ.'; end if;
  if not exists(select 1 from public.resources r where r.id=p_resource_id and (r.author_id=v_user or public.is_eduhub_admin())) then raise exception 'Chỉ tác giả hoặc quản trị viên được cập nhật học liệu.'; end if;
  if p_replacement_resource_id is not null and not exists(select 1 from public.resources r where r.id=p_replacement_resource_id and r.moderation_status='approved') then raise exception 'Học liệu thay thế cần được duyệt trước.'; end if;
  update public.resources set resource_status=p_status,replacement_resource_id=p_replacement_resource_id where id=p_resource_id;
end $$;
revoke all on function public.set_resource_status(uuid,text,uuid) from public,anon;
grant execute on function public.set_resource_status(uuid,text,uuid) to authenticated;

-- Private audit trail for admin review and moderation changes.
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key, actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default 'Quản trị viên', action text not null, entity_type text not null, entity_id text not null,
  summary text not null, created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);
alter table public.admin_audit_log enable row level security;
drop policy if exists admin_audit_log_admin_read on public.admin_audit_log;
create policy admin_audit_log_admin_read on public.admin_audit_log for select to authenticated using(public.is_eduhub_admin());
revoke all on public.admin_audit_log from anon,authenticated;
grant select on public.admin_audit_log to authenticated;
create or replace function public.record_eduhub_admin_audit()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_actor uuid; v_action text; v_name text; v_summary text; v_id text;
begin
  if tg_table_name='resources' then
    if coalesce(new.moderation_status,'') is not distinct from coalesce(old.moderation_status,'') then return new; end if;
    v_actor:=coalesce(new.moderated_by,auth.uid()); v_action:='resource_'||coalesce(new.moderation_status,'updated'); v_id:=new.id::text;
    v_summary:=case new.moderation_status when 'approved' then 'Đã duyệt học liệu: '||left(new.title,140) when 'rejected' then 'Đã ẩn học liệu: '||left(new.title,140) else 'Đổi trạng thái học liệu: '||left(new.title,140) end;
  elsif tg_table_name='profiles' then
    if new.role is not distinct from old.role and new.teacher_verified is not distinct from old.teacher_verified then return new; end if;
    v_actor:=auth.uid(); v_action:=case when new.role is distinct from old.role then 'profile_role_changed' else 'teacher_verified_changed' end; v_id:=new.id::text;
    v_summary:=case when new.role is distinct from old.role then 'Cập nhật quyền tài khoản: '||left(new.full_name,100) else case when new.teacher_verified then 'Xác minh giáo viên: ' else 'Gỡ xác minh giáo viên: ' end||left(new.full_name,100) end;
  else return new;
  end if;
  select coalesce(full_name,'Quản trị viên') into v_name from public.profiles where id=v_actor;
  insert into public.admin_audit_log(actor_id,actor_name,action,entity_type,entity_id,summary) values(v_actor,coalesce(v_name,'Quản trị viên'),v_action,tg_table_name,v_id,v_summary);
  return new;
end $$;
drop trigger if exists resources_admin_audit on public.resources;
create trigger resources_admin_audit after update of moderation_status on public.resources for each row execute function public.record_eduhub_admin_audit();
drop trigger if exists profiles_admin_audit on public.profiles;
create trigger profiles_admin_audit after update of role,teacher_verified on public.profiles for each row execute function public.record_eduhub_admin_audit();
create or replace function public.record_eduhub_moderation_audit()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_actor uuid:=auth.uid(); v_name text; v_entity text; v_summary text;
begin
  if tg_op='INSERT' then return new; end if;
  if old.status is not distinct from new.status then return new; end if;
  select coalesce(full_name,'Quản trị viên') into v_name from public.profiles where id=v_actor;
  v_entity:=tg_table_name;
  v_summary:=case when new.status='resolved' then 'Đã xử lý báo cáo nội dung' when new.status='dismissed' then 'Đã đóng báo cáo nội dung' when new.status='reviewing' then 'Đang xem xét báo cáo nội dung' else 'Cập nhật trạng thái báo cáo nội dung' end;
  insert into public.admin_audit_log(actor_id,actor_name,action,entity_type,entity_id,summary) values(v_actor,coalesce(v_name,'Quản trị viên'),'report_'||new.status,v_entity,new.id::text,v_summary);
  return new;
end $$;
drop trigger if exists content_reports_admin_audit on public.content_reports;
create trigger content_reports_admin_audit after update of status on public.content_reports for each row execute function public.record_eduhub_moderation_audit();
drop trigger if exists talk_reports_admin_audit on public.talk_content_reports;
create trigger talk_reports_admin_audit after update of status on public.talk_content_reports for each row execute function public.record_eduhub_moderation_audit();

create table if not exists public.teacher_events (
  id uuid primary key default gen_random_uuid(), organizer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check(char_length(trim(title)) between 5 and 140), description text not null default '' check(char_length(description) <= 3000),
  subject text not null, starts_at timestamptz not null, location text not null default '', meeting_url text, is_published boolean not null default true,
  created_at timestamptz not null default now(), check(meeting_url is null or meeting_url ~ '^https?://')
);
create table if not exists public.teacher_event_attendees (
  event_id uuid not null references public.teacher_events(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  registered_at timestamptz not null default now(), primary key(event_id,user_id)
);
alter table public.teacher_events enable row level security; alter table public.teacher_event_attendees enable row level security;
drop policy if exists teacher_events_read_published on public.teacher_events;
create policy teacher_events_read_published on public.teacher_events for select to anon,authenticated using(is_published or organizer_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists teacher_events_insert_self on public.teacher_events;
create policy teacher_events_insert_self on public.teacher_events for insert to authenticated with check(organizer_id=(select auth.uid()));
drop policy if exists teacher_events_update_owner_admin on public.teacher_events;
create policy teacher_events_update_owner_admin on public.teacher_events for update to authenticated using(organizer_id=(select auth.uid()) or public.is_eduhub_admin()) with check(organizer_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists teacher_events_delete_owner_admin on public.teacher_events;
create policy teacher_events_delete_owner_admin on public.teacher_events for delete to authenticated using(organizer_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists teacher_event_attendees_read on public.teacher_event_attendees;
create policy teacher_event_attendees_read on public.teacher_event_attendees for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.teacher_events e where e.id=event_id and e.organizer_id=(select auth.uid())) or public.is_eduhub_admin());
drop policy if exists teacher_event_attendees_self_write on public.teacher_event_attendees;
create policy teacher_event_attendees_self_write on public.teacher_event_attendees for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and exists(select 1 from public.teacher_events e where e.id=event_id and e.is_published));
revoke all on public.teacher_events,public.teacher_event_attendees from anon,authenticated;
grant select on public.teacher_events to anon,authenticated;
grant select,insert,update,delete on public.teacher_events,public.teacher_event_attendees to authenticated;
create or replace function public.teacher_event_attendee_counts(p_event_ids uuid[])
returns table(event_id uuid,attendee_count bigint) language sql stable security definer set search_path=public
as $$
  select a.event_id,count(*) from public.teacher_event_attendees a join public.teacher_events e on e.id=a.event_id
  where e.is_published and a.event_id=any(coalesce(p_event_ids,'{}'::uuid[])) group by a.event_id
$$;
revoke all on function public.teacher_event_attendee_counts(uuid[]) from public;
grant execute on function public.teacher_event_attendee_counts(uuid[]) to anon,authenticated;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check(category in ('account','project','discussion','technical','privacy','other')),
  subject text not null check(char_length(trim(subject)) between 5 and 160), message text not null check(char_length(trim(message)) between 15 and 3000),
  status text not null default 'open' check(status in ('open','in_progress','answered','closed')), admin_reply text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create or replace function public.touch_support_request()
returns trigger language plpgsql set search_path=public
as $$ begin new.updated_at:=now(); return new; end $$;
drop trigger if exists support_requests_touch_updated_at on public.support_requests;
create trigger support_requests_touch_updated_at before update on public.support_requests for each row execute function public.touch_support_request();
create or replace function public.audit_support_request()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_name text;
begin
  if tg_op='INSERT' then
    insert into public.admin_audit_log(actor_id,actor_name,action,entity_type,entity_id,summary) values(new.user_id,'Giáo viên','support_request_opened','support_request',new.id::text,'Đã gửi yêu cầu hỗ trợ: '||left(new.subject,120));
  elsif old.status is distinct from new.status or old.admin_reply is distinct from new.admin_reply then
    select coalesce(full_name,'Quản trị viên') into v_name from public.profiles where id=auth.uid();
    insert into public.admin_audit_log(actor_id,actor_name,action,entity_type,entity_id,summary) values(auth.uid(),coalesce(v_name,'Quản trị viên'),'support_request_updated','support_request',new.id::text,'Cập nhật trạng thái yêu cầu hỗ trợ: '||left(new.subject,120));
  end if;
  return new;
end $$;
drop trigger if exists support_requests_audit on public.support_requests;
create trigger support_requests_audit after insert or update on public.support_requests for each row execute function public.audit_support_request();
create index if not exists support_requests_queue_idx on public.support_requests(status,created_at desc);
alter table public.support_requests enable row level security;
drop policy if exists support_requests_self_or_admin_read on public.support_requests;
create policy support_requests_self_or_admin_read on public.support_requests for select to authenticated using(user_id=(select auth.uid()) or public.is_eduhub_admin());
drop policy if exists support_requests_insert_self on public.support_requests;
create policy support_requests_insert_self on public.support_requests for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists support_requests_admin_update on public.support_requests;
create policy support_requests_admin_update on public.support_requests for update to authenticated using(public.is_eduhub_admin()) with check(public.is_eduhub_admin());
revoke all on public.support_requests from anon,authenticated;
grant select,insert,update on public.support_requests to authenticated;

drop policy if exists resource_classroom_uses_update on public.resource_classroom_uses;
create policy resource_classroom_uses_update on public.resource_classroom_uses for update to authenticated
  using (teacher_id = (select auth.uid()))
  with check (
    teacher_id = (select auth.uid())
    and exists (select 1 from public.resources r where r.id = resource_id and r.moderation_status = 'approved' and r.author_id <> (select auth.uid()))
  );
drop policy if exists resource_classroom_uses_delete on public.resource_classroom_uses;
create policy resource_classroom_uses_delete on public.resource_classroom_uses for delete to authenticated
  using (teacher_id = (select auth.uid()) or public.is_eduhub_admin());
revoke all on public.resource_classroom_uses from anon, authenticated;
grant select on public.resource_classroom_uses to anon, authenticated;
grant insert, update, delete on public.resource_classroom_uses to authenticated;

-- Batch 1 feature: teacher requests for resources and peer support votes.
create table if not exists public.resource_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 8 and 140),
  details text not null check (char_length(trim(details)) between 10 and 1200),
  subject text not null check (char_length(subject) between 1 and 100),
  grade_level text not null check (grade_level in ('Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5','Lớp 6','Lớp 7','Lớp 8','Lớp 9','Lớp 10','Lớp 11','Lớp 12')),
  status text not null default 'open' check (status in ('open','in_progress','fulfilled','closed')),
  votes_count integer not null default 0 check (votes_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists resource_requests_status_created_idx on public.resource_requests(status, created_at desc);
create index if not exists resource_requests_subject_grade_idx on public.resource_requests(subject, grade_level, status);
alter table public.resource_requests enable row level security;
drop policy if exists resource_requests_read on public.resource_requests;
create policy resource_requests_read on public.resource_requests for select to anon, authenticated using (true);
drop policy if exists resource_requests_insert_self on public.resource_requests;
create policy resource_requests_insert_self on public.resource_requests for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'open');
drop policy if exists resource_requests_update_owner_admin on public.resource_requests;
create policy resource_requests_update_owner_admin on public.resource_requests for update to authenticated
  using (author_id = (select auth.uid()) or public.is_eduhub_admin())
  with check (author_id = (select auth.uid()) or public.is_eduhub_admin());
drop policy if exists resource_requests_delete_owner_admin on public.resource_requests;
create policy resource_requests_delete_owner_admin on public.resource_requests for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_eduhub_admin());

create table if not exists public.resource_request_votes (
  request_id uuid not null references public.resource_requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);
alter table public.resource_request_votes enable row level security;
drop policy if exists resource_request_votes_read on public.resource_request_votes;
create policy resource_request_votes_read on public.resource_request_votes for select to authenticated
  using (user_id = (select auth.uid()) or public.is_eduhub_admin());
drop policy if exists resource_request_votes_insert_self on public.resource_request_votes;
create policy resource_request_votes_insert_self on public.resource_request_votes for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.resource_requests rr where rr.id = request_id and rr.author_id <> (select auth.uid()) and rr.status in ('open','in_progress')
  ));
drop policy if exists resource_request_votes_delete_self on public.resource_request_votes;
create policy resource_request_votes_delete_self on public.resource_request_votes for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_eduhub_admin());

create or replace function public.update_resource_request_vote_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.resource_requests set votes_count = votes_count + 1 where id = new.request_id;
    return new;
  end if;
  update public.resource_requests set votes_count = greatest(0, votes_count - 1) where id = old.request_id;
  return old;
end;
$$;
drop trigger if exists resource_request_votes_count on public.resource_request_votes;
create trigger resource_request_votes_count after insert or delete on public.resource_request_votes
  for each row execute function public.update_resource_request_vote_count();
revoke all on public.resource_requests, public.resource_request_votes from anon, authenticated;
grant select on public.resource_requests to anon, authenticated;
grant select on public.resource_request_votes to authenticated;
grant insert, delete on public.resource_requests to authenticated;
grant update(status, updated_at) on public.resource_requests to authenticated;
grant insert, delete on public.resource_request_votes to authenticated;

drop policy if exists lesson_plans_insert_self on public.lesson_plans;
create policy lesson_plans_insert_self on public.lesson_plans for insert to authenticated
  with check (author_id = (select auth.uid()));
drop policy if exists lesson_plans_delete_self on public.lesson_plans;
create policy lesson_plans_delete_self on public.lesson_plans for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_eduhub_admin());

revoke all on public.lesson_plans, public.lesson_plan_items from anon, authenticated;
grant select on public.lesson_plans, public.lesson_plan_items to anon, authenticated;
grant insert, update, delete on public.lesson_plans, public.lesson_plan_items to authenticated;

-- Resource updates are submitted as revisions and only replace the public version after admin review.
create table if not exists public.resource_revision_requests (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  changes jsonb not null check (jsonb_typeof(changes) = 'object'),
  release_notes text not null check (char_length(trim(release_notes)) between 8 and 2000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text not null default '',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists resource_revision_requests_queue_idx on public.resource_revision_requests(status,created_at);
alter table public.resource_revision_requests enable row level security;
drop policy if exists resource_revision_requests_read on public.resource_revision_requests;
create policy resource_revision_requests_read on public.resource_revision_requests for select to authenticated
  using (author_id = (select auth.uid()) or public.is_eduhub_admin());
drop policy if exists resource_revision_requests_insert_owner on public.resource_revision_requests;
create policy resource_revision_requests_insert_owner on public.resource_revision_requests for insert to authenticated
  with check (author_id = (select auth.uid()) and exists(select 1 from public.resources r where r.id = resource_id and r.author_id = (select auth.uid()) and r.moderation_status = 'approved'));
revoke all on public.resource_revision_requests from anon, authenticated;
grant select, insert on public.resource_revision_requests to authenticated;

create table if not exists public.resource_revisions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  version_no integer not null check(version_no > 0),
  snapshot jsonb not null,
  release_notes text not null,
  created_at timestamptz not null default now(),
  unique(resource_id,version_no)
);
create index if not exists resource_revisions_history_idx on public.resource_revisions(resource_id,version_no desc);
alter table public.resource_revisions enable row level security;
drop policy if exists resource_revisions_read on public.resource_revisions;
create policy resource_revisions_read on public.resource_revisions for select to anon,authenticated
  using (exists(select 1 from public.resources r where r.id = resource_id and (r.moderation_status = 'approved' or r.author_id = (select auth.uid()) or public.is_eduhub_admin())));
revoke all on public.resource_revisions from anon,authenticated;
grant select on public.resource_revisions to anon,authenticated;

alter table public.teacher_activities drop constraint if exists teacher_activities_activity_type_check;
alter table public.teacher_activities add constraint teacher_activities_activity_type_check
  check (activity_type in ('project_approved','project_liked','project_commented','project_rated','resource_match','talk_match','talk_mention','resource_updated'));

create or replace function public.review_resource_revision(p_request_id uuid,p_decision text,p_admin_note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare req public.resource_revision_requests; res public.resources; next_version integer; changes jsonb;
begin
  if not public.is_eduhub_admin() then raise exception 'Chỉ quản trị viên mới được duyệt cập nhật.'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'Quyết định không hợp lệ.'; end if;
  select * into req from public.resource_revision_requests where id = p_request_id for update;
  if not found or req.status <> 'pending' then raise exception 'Yêu cầu không còn ở trạng thái chờ duyệt.'; end if;
  changes := req.changes;
  if exists(select 1 from jsonb_object_keys(changes) as keys(key) where key not in ('title','description','usage_guide','platform_url','download_url','video_url','website_html')) then raise exception 'Yêu cầu có trường cập nhật không được phép.'; end if;
  if p_decision = 'approved' then
    select * into res from public.resources where id = req.resource_id for update;
    if not found then raise exception 'Không tìm thấy dự án.'; end if;
    update public.resources set
      title = coalesce(changes->>'title',title),
      description = coalesce(changes->>'description',description),
      usage_guide = coalesce(changes->>'usage_guide',usage_guide),
      platform_url = case when changes ? 'platform_url' then nullif(changes->>'platform_url','') else platform_url end,
      download_url = case when changes ? 'download_url' then nullif(changes->>'download_url','') else download_url end,
      video_url = case when changes ? 'video_url' then nullif(changes->>'video_url','') else video_url end,
      website_html = case when changes ? 'website_html' then changes->>'website_html' else website_html end,
      updated_at = now()
    where id = req.resource_id;
    select coalesce(max(version_no),0)+1 into next_version from public.resource_revisions where resource_id = req.resource_id;
    insert into public.resource_revisions(resource_id,author_id,version_no,snapshot,release_notes)
      select req.resource_id,req.author_id,next_version,to_jsonb(r),req.release_notes from public.resources r where r.id = req.resource_id;
    insert into public.teacher_activities(profile_id,actor_id,resource_id,activity_type)
      select targets.profile_id,req.author_id,req.resource_id,'resource_updated'
      from (select b.user_id as profile_id from public.resource_bookmarks b where b.resource_id=req.resource_id and b.user_id<>req.author_id
            union select f.follower_id as profile_id from public.teacher_follows f where f.followed_id=req.author_id and f.follower_id<>req.author_id) targets;
  end if;
  update public.resource_revision_requests set status = p_decision,admin_note = left(coalesce(p_admin_note,''),2000),reviewed_by = auth.uid(),reviewed_at = now() where id = req.id;
  insert into public.admin_audit_log(actor_id,actor_name,action,entity_type,entity_id,summary)
    select auth.uid(),coalesce(p.full_name,'Quản trị viên'),'resource_revision_'||p_decision,'resource_revision',req.id::text,
      case when p_decision='approved' then 'Đã phát hành phiên bản mới cho dự án '||coalesce((select title from public.resources where id=req.resource_id),'') else 'Đã từ chối đề nghị cập nhật dự án '||coalesce((select title from public.resources where id=req.resource_id),'') end
    from public.profiles p where p.id=auth.uid();
end;
$$;
revoke all on function public.review_resource_revision(uuid,text,text) from public,anon;
grant execute on function public.review_resource_revision(uuid,text,text) to authenticated;

create or replace function public.resubmit_rejected_website(p_resource_id uuid,p_website_html text,p_resubmission_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Vui lòng đăng nhập.'; end if;
  if p_website_html is null or length(p_website_html) > 500000 or p_website_html !~* '<html\b' or p_website_html !~* '</html\s*>' then
    raise exception 'Mã website cần là file HTML hoàn chỉnh, tối đa 500 KB.';
  end if;
  if length(trim(coalesce(p_resubmission_note,''))) < 8 then raise exception 'Ghi chú gửi lại cần ít nhất 8 ký tự.'; end if;
  update public.resources set website_html=p_website_html, moderation_status='pending', moderation_note=null, updated_at=now()
  where id=p_resource_id and author_id=auth.uid() and moderation_status='rejected' and website_html is not null;
  if not found then raise exception 'Không tìm thấy website bị trả lại hoặc thầy cô không có quyền sửa.'; end if;
  insert into public.admin_audit_log(actor_id,actor_name,action,entity_type,entity_id,summary)
    select auth.uid(),coalesce(p.full_name,'Giáo viên'),'resource_resubmitted','resource',p_resource_id::text,
      'Tác giả đã sửa mã website và gửi lại để duyệt: '||left(trim(p_resubmission_note),300)
    from public.profiles p where p.id=auth.uid();
end;
$$;
revoke all on function public.resubmit_rejected_website(uuid,text,text) from public,anon;
grant execute on function public.resubmit_rejected_website(uuid,text,text) to authenticated;

-- Threaded replies remain attached to their parent project comment.
alter table public.resource_comments add column if not exists parent_comment_id uuid references public.resource_comments(id) on delete cascade;
create index if not exists resource_comments_parent_idx on public.resource_comments(parent_comment_id,created_at) where parent_comment_id is not null;
create or replace function public.validate_resource_comment_parent()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.parent_comment_id is not null and not exists(select 1 from public.resource_comments p where p.id=new.parent_comment_id and p.resource_id=new.resource_id and p.parent_comment_id is null) then
    raise exception 'Câu trả lời phải thuộc cùng dự án và trả lời trực tiếp một bình luận gốc.';
  end if;
  return new;
end;
$$;
drop trigger if exists resource_comment_parent_guard on public.resource_comments;
create trigger resource_comment_parent_guard before insert or update of parent_comment_id,resource_id on public.resource_comments for each row execute procedure public.validate_resource_comment_parent();

-- Private teacher history of project opens and downloads, with a single trusted counter update path.
create table if not exists public.resource_download_events (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null check(action in ('open','download')),
  created_at timestamptz not null default now()
);
create index if not exists resource_download_events_user_idx on public.resource_download_events(user_id,created_at desc) where user_id is not null;
alter table public.resource_download_events enable row level security;
drop policy if exists resource_download_events_read_self on public.resource_download_events;
create policy resource_download_events_read_self on public.resource_download_events for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.resource_download_events from anon,authenticated;
grant select on public.resource_download_events to authenticated;
create or replace function public.record_resource_action(p_resource_id uuid,p_action text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_action not in ('open','download') then raise exception 'Loại thao tác không hợp lệ.'; end if;
  if not exists(select 1 from public.resources where id=p_resource_id and moderation_status='approved') then raise exception 'Dự án hiện không công khai.'; end if;
  insert into public.resource_download_events(resource_id,user_id,action) values(p_resource_id,auth.uid(),p_action);
  if p_action='download' then update public.resources set downloads_count=downloads_count+1 where id=p_resource_id; end if;
end;
$$;
revoke all on function public.record_resource_action(uuid,text) from public;
grant execute on function public.record_resource_action(uuid,text) to anon,authenticated;

-- Attach a limited set of supporting files (slides, worksheets, answer keys) to one resource.
create table if not exists public.resource_files (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null check(char_length(file_name) between 1 and 240),
  file_url text not null,
  storage_path text,
  mime_type text not null default '',
  file_size bigint not null check(file_size between 1 and 52428800),
  position integer not null default 1 check(position > 0),
  created_at timestamptz not null default now()
);
create index if not exists resource_files_resource_order_idx on public.resource_files(resource_id,position,created_at);
alter table public.resource_files enable row level security;
drop policy if exists resource_files_read_public_or_owner on public.resource_files;
create policy resource_files_read_public_or_owner on public.resource_files for select to anon,authenticated using(exists(select 1 from public.resources r where r.id=resource_id and (r.moderation_status='approved' or r.author_id=(select auth.uid()) or public.is_eduhub_admin())));
drop policy if exists resource_files_insert_owner on public.resource_files;
create policy resource_files_insert_owner on public.resource_files for insert to authenticated with check(author_id=(select auth.uid()) and exists(select 1 from public.resources r where r.id=resource_id and r.author_id=(select auth.uid())));
drop policy if exists resource_files_delete_owner_admin on public.resource_files;
create policy resource_files_delete_owner_admin on public.resource_files for delete to authenticated using(author_id=(select auth.uid()) or public.is_eduhub_admin());
revoke all on public.resource_files from anon,authenticated;
grant select on public.resource_files to anon,authenticated;
grant insert,delete on public.resource_files to authenticated;

alter table public.resources add column if not exists moderation_link_check text not null default 'not_checked' check(moderation_link_check in ('not_checked','working','unavailable','no_link'));
alter table public.resources add column if not exists moderation_link_checked_by uuid references public.profiles(id) on delete set null;
alter table public.resources add column if not exists moderation_link_checked_at timestamptz;
create or replace function public.audit_resource_link_check()
returns trigger language plpgsql security definer set search_path=public as $$
declare actor_name text;
begin
  if new.moderation_link_check is not distinct from old.moderation_link_check then return new; end if;
  select coalesce(full_name,'Quản trị viên') into actor_name from public.profiles where id=new.moderation_link_checked_by;
  insert into public.admin_audit_log(actor_id,actor_name,action,entity_type,entity_id,summary)
    values(new.moderation_link_checked_by,coalesce(actor_name,'Quản trị viên'),'resource_link_check_'||new.moderation_link_check,'resource',new.id::text,
      'Đã ghi nhận kiểm tra liên kết dự án “'||left(new.title,120)||'”: '||new.moderation_link_check);
  return new;
end; $$;
drop trigger if exists resources_link_check_audit on public.resources;
create trigger resources_link_check_audit after update of moderation_link_check on public.resources for each row execute procedure public.audit_resource_link_check();

-- Batch 1 feature: teacher adaptations keep a traceable link to the approved source.
alter table public.resources add column if not exists parent_resource_id uuid references public.resources(id) on delete set null;
alter table public.resources add column if not exists learning_outcomes text[] not null default '{}';
alter table public.resources add column if not exists caption_url text;
alter table public.resources add column if not exists video_transcript text not null default '' check (char_length(video_transcript) <= 12000);
create index if not exists resources_parent_resource_idx on public.resources(parent_resource_id) where parent_resource_id is not null;

-- Check an optional source resource without recursively applying resources RLS.
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
create policy resources_submit_pending on public.resources for insert to authenticated
  with check (
    author_id = (select auth.uid()) and moderation_status = 'pending'
    and (parent_resource_id is null or public.can_submit_resource_parent(parent_resource_id))
  );
