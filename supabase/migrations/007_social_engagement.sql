-- =============================================================================
-- 007: Social Engagement — Likes, Comments, Notifications
-- =============================================================================

-- ---------------------------------------------------------------------------
-- check_in_likes
-- ---------------------------------------------------------------------------
create table if not exists public.check_in_likes (
  id         uuid primary key default gen_random_uuid(),
  check_in_id text not null references public.check_ins(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (check_in_id, user_id)
);

alter table public.check_in_likes enable row level security;

create policy "Likes are publicly readable"
  on public.check_in_likes for select using (true);

create policy "Users can like check-ins"
  on public.check_in_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike their own likes"
  on public.check_in_likes for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- check_in_comments
-- ---------------------------------------------------------------------------
create table if not exists public.check_in_comments (
  id         uuid primary key default gen_random_uuid(),
  check_in_id text not null references public.check_ins(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  body       text not null check (length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.check_in_comments enable row level security;

create policy "Comments are publicly readable"
  on public.check_in_comments for select using (true);

create policy "Authenticated users can comment"
  on public.check_in_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.check_in_comments for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  actor_id   uuid references auth.users(id) on delete set null,
  type       text not null check (type in ('like', 'comment', 'follow', 'badge')),
  reference_id text,  -- check_in_id, badge_id, etc.
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on public.notifications (user_id, read, created_at desc);

alter table public.notifications enable row level security;

create policy "Users see their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "System can create notifications"
  on public.notifications for insert
  with check (true);

create policy "Users can mark their own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Functions: like count + notification triggers
-- ---------------------------------------------------------------------------

-- Get like count for a check-in
create or replace function fn_check_in_like_count(p_check_in_id text)
returns integer
language sql stable
as $$
  select count(*)::integer from public.check_in_likes where check_in_id = p_check_in_id;
$$;

-- Check if a user liked a check-in
create or replace function fn_user_liked_check_in(p_user_id uuid, p_check_in_id text)
returns boolean
language sql stable
as $$
  select exists(
    select 1 from public.check_in_likes
    where check_in_id = p_check_in_id and user_id = p_user_id
  );
$$;

-- Create notification on like (trigger function)
create or replace function fn_notify_on_like()
returns trigger
language plpgsql
as $$
declare
  v_checkin_owner uuid;
  v_actor_name text;
  v_pastry_name text;
begin
  -- Get check-in owner
  select user_id into v_checkin_owner from public.check_ins where id = NEW.check_in_id;
  -- Don't notify on self-like
  if v_checkin_owner = NEW.user_id then return NEW; end if;
  -- Get actor display name
  select coalesce(display_name, username) into v_actor_name from public.profiles where id = NEW.user_id;
  -- Get pastry name
  select p.name into v_pastry_name
    from public.check_ins ci join public.pastries p on ci.pastry_id = p.id
    where ci.id = NEW.check_in_id;

  insert into public.notifications (user_id, actor_id, type, reference_id, body)
  values (v_checkin_owner, NEW.user_id, 'like', NEW.check_in_id,
          v_actor_name || ' craved your ' || v_pastry_name || ' check-in');
  return NEW;
end;
$$;

create trigger trg_notify_on_like
  after insert on public.check_in_likes
  for each row execute function fn_notify_on_like();

-- Create notification on comment (trigger function)
create or replace function fn_notify_on_comment()
returns trigger
language plpgsql
as $$
declare
  v_checkin_owner uuid;
  v_actor_name text;
  v_pastry_name text;
begin
  select user_id into v_checkin_owner from public.check_ins where id = NEW.check_in_id;
  if v_checkin_owner = NEW.user_id then return NEW; end if;
  select coalesce(display_name, username) into v_actor_name from public.profiles where id = NEW.user_id;
  select p.name into v_pastry_name
    from public.check_ins ci join public.pastries p on ci.pastry_id = p.id
    where ci.id = NEW.check_in_id;

  insert into public.notifications (user_id, actor_id, type, reference_id, body)
  values (v_checkin_owner, NEW.user_id, 'comment', NEW.check_in_id,
          v_actor_name || ' commented on your ' || v_pastry_name || ' check-in');
  return NEW;
end;
$$;

create trigger trg_notify_on_comment
  after insert on public.check_in_comments
  for each row execute function fn_notify_on_comment();

-- Friend suggestions: users who visit the same bakeries or have mutual follows
create or replace function fn_friend_suggestions(p_user_id uuid, p_limit integer default 5)
returns table(user_id uuid, username text, display_name text, avatar_url text, reason text, score integer)
language sql stable
as $$
  with already_following as (
    select following_id from public.follows where follower_id = p_user_id
  ),
  -- Score by shared bakeries
  bakery_overlap as (
    select ci.user_id,
           count(distinct ci.bakery_id)::integer as shared_bakeries
    from public.check_ins ci
    where ci.bakery_id in (select bakery_id from public.check_ins where user_id = p_user_id)
      and ci.user_id != p_user_id
      and ci.user_id not in (select following_id from already_following)
    group by ci.user_id
  ),
  -- Score by mutual follows
  mutual_follows as (
    select f2.following_id as user_id,
           count(*)::integer as mutual_count
    from public.follows f1
    join public.follows f2 on f1.following_id = f2.follower_id
    where f1.follower_id = p_user_id
      and f2.following_id != p_user_id
      and f2.following_id not in (select following_id from already_following)
    group by f2.following_id
  ),
  combined as (
    select coalesce(bo.user_id, mf.user_id) as uid,
           coalesce(bo.shared_bakeries, 0) * 10 + coalesce(mf.mutual_count, 0) * 15 as score,
           case
             when coalesce(mf.mutual_count, 0) > 0 then mf.mutual_count || ' mutual follows'
             else bo.shared_bakeries || ' shared bakeries'
           end as reason
    from bakery_overlap bo
    full outer join mutual_follows mf on bo.user_id = mf.user_id
  )
  select c.uid as user_id, p.username, p.display_name, p.avatar_url, c.reason, c.score
  from combined c
  join public.profiles p on c.uid = p.id
  order by c.score desc
  limit p_limit;
$$;
