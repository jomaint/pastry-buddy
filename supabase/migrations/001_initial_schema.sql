-- ============================================================
-- Pastry Buddy: Initial Schema Migration
-- ============================================================

-- Extensions
create extension if not exists "pg_trgm";    -- fuzzy text search
create extension if not exists "cube";        -- n-dimensional cubes (required by earthdistance)
create extension if not exists "earthdistance"; -- lat/lng distance calculations

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends Supabase auth.users)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  display_name text,
  avatar_url  text,
  bio         text,
  favorite_categories text[] default '{}',
  level       int default 1 check (level >= 1 and level <= 10),
  xp          int default 0 check (xp >= 0),
  total_checkins int default 0 check (total_checkins >= 0),
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index idx_profiles_username_trgm on profiles using gin (username gin_trgm_ops);

-- Bakeries
create table bakeries (
  id              text primary key default gen_random_uuid()::text,
  name            text not null,
  slug            text unique not null,
  address         text,
  city            text,
  country         text,
  latitude        double precision,
  longitude       double precision,
  google_place_id text,
  photo_url       text,
  created_by      text not null default 'system',
  created_at      timestamptz default now() not null
);

create index idx_bakeries_slug on bakeries (slug);
create index idx_bakeries_city on bakeries (city);
create index idx_bakeries_name_trgm on bakeries using gin (name gin_trgm_ops);
create index idx_bakeries_geo on bakeries using gist (ll_to_earth(latitude, longitude))
  where latitude is not null and longitude is not null;

-- Pastries
create table pastries (
  id              text primary key default gen_random_uuid()::text,
  name            text not null,
  slug            text unique not null,
  category        text not null,
  bakery_id       text not null references bakeries(id) on delete cascade,
  description     text,
  photo_url       text,
  avg_rating      numeric(3,2),
  total_checkins  int default 0 check (total_checkins >= 0),
  created_by      text not null default 'system',
  created_at      timestamptz default now() not null
);

create index idx_pastries_slug on pastries (slug);
create index idx_pastries_bakery on pastries (bakery_id);
create index idx_pastries_category on pastries (category);
create index idx_pastries_name_trgm on pastries using gin (name gin_trgm_ops);
create index idx_pastries_rating on pastries (avg_rating desc nulls last);

-- Check-ins
create table check_ins (
  id            text primary key default gen_random_uuid()::text,
  user_id       uuid not null references profiles(id) on delete cascade,
  pastry_id     text not null references pastries(id) on delete cascade,
  bakery_id     text not null references bakeries(id) on delete cascade,
  rating        int not null check (rating >= 1 and rating <= 5),
  notes         text,
  photo_url     text,
  flavor_tags   text[] default '{}',
  taste_ratings jsonb,
  created_at    timestamptz default now() not null
);

create index idx_checkins_user on check_ins (user_id, created_at desc);
create index idx_checkins_pastry on check_ins (pastry_id);
create index idx_checkins_bakery on check_ins (bakery_id);
create index idx_checkins_created on check_ins (created_at desc);

-- Lists (user-curated pastry lists)
create table lists (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  description text,
  is_public   boolean default true,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index idx_lists_user on lists (user_id);

-- List items
create table list_items (
  id        text primary key default gen_random_uuid()::text,
  list_id   text not null references lists(id) on delete cascade,
  pastry_id text not null references pastries(id) on delete cascade,
  rank      int,
  notes     text,
  added_at  timestamptz default now() not null,
  unique (list_id, pastry_id)
);

create index idx_list_items_list on list_items (list_id);

-- Badges
create table badges (
  id          text primary key default gen_random_uuid()::text,
  name        text unique not null,
  description text not null,
  category    text not null,
  icon        text not null,
  criteria    jsonb not null default '{}',
  created_at  timestamptz default now() not null
);

-- User badges
create table user_badges (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid not null references profiles(id) on delete cascade,
  badge_id    text not null references badges(id) on delete cascade,
  unlocked_at timestamptz default now() not null,
  unique (user_id, badge_id)
);

create index idx_user_badges_user on user_badges (user_id);

-- Follows
create table follows (
  id           text primary key default gen_random_uuid()::text,
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz default now() not null,
  unique (follower_id, following_id),
  check (follower_id != following_id)
);

create index idx_follows_follower on follows (follower_id);
create index idx_follows_following on follows (following_id);

-- ============================================================
-- TRIGGERS: Denormalized counts
-- ============================================================

-- Update pastry avg_rating + total_checkins when check_in is inserted/deleted
create or replace function fn_update_pastry_stats()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update pastries set
      total_checkins = total_checkins + 1,
      avg_rating = (
        select round(avg(rating)::numeric, 2)
        from check_ins
        where pastry_id = new.pastry_id
      )
    where id = new.pastry_id;
  elsif tg_op = 'DELETE' then
    update pastries set
      total_checkins = greatest(total_checkins - 1, 0),
      avg_rating = (
        select round(avg(rating)::numeric, 2)
        from check_ins
        where pastry_id = old.pastry_id
      )
    where id = old.pastry_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger trg_checkin_pastry_stats
  after insert or delete on check_ins
  for each row execute function fn_update_pastry_stats();

-- Update profile total_checkins when check_in is inserted/deleted
create or replace function fn_update_profile_checkin_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update profiles set
      total_checkins = total_checkins + 1,
      updated_at = now()
    where id = new.user_id;
  elsif tg_op = 'DELETE' then
    update profiles set
      total_checkins = greatest(total_checkins - 1, 0),
      updated_at = now()
    where id = old.user_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger trg_checkin_profile_count
  after insert or delete on check_ins
  for each row execute function fn_update_profile_checkin_count();

-- Auto-update updated_at on profiles
create or replace function fn_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function fn_set_updated_at();

create trigger trg_lists_updated_at
  before update on lists
  for each row execute function fn_set_updated_at();

-- Auto-create profile on auth.users insert
create or replace function fn_handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function fn_handle_new_user();

-- ============================================================
-- VIEWS: Social feed
-- ============================================================

create or replace view feed_view as
select
  ci.id,
  ci.user_id,
  ci.pastry_id,
  ci.bakery_id,
  ci.rating,
  ci.notes,
  ci.photo_url,
  ci.flavor_tags,
  ci.taste_ratings,
  ci.created_at,
  -- profile
  p.username       as user_username,
  p.display_name   as user_display_name,
  p.avatar_url     as user_avatar_url,
  p.level          as user_level,
  -- pastry
  pa.name          as pastry_name,
  pa.slug          as pastry_slug,
  pa.category      as pastry_category,
  pa.photo_url     as pastry_photo_url,
  pa.avg_rating    as pastry_avg_rating,
  -- bakery
  b.name           as bakery_name,
  b.slug           as bakery_slug,
  b.city           as bakery_city
from check_ins ci
join profiles p  on p.id  = ci.user_id
join pastries pa on pa.id = ci.pastry_id
join bakeries b  on b.id  = ci.bakery_id
order by ci.created_at desc;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles    enable row level security;
alter table bakeries    enable row level security;
alter table pastries    enable row level security;
alter table check_ins   enable row level security;
alter table lists       enable row level security;
alter table list_items  enable row level security;
alter table badges      enable row level security;
alter table user_badges enable row level security;
alter table follows     enable row level security;

-- Profiles: anyone can read, users can update their own
create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Bakeries: anyone can read, authenticated users can insert
create policy "Bakeries are viewable by everyone"
  on bakeries for select using (true);

create policy "Authenticated users can create bakeries"
  on bakeries for insert with check (auth.role() = 'authenticated');

-- Pastries: anyone can read, authenticated users can insert
create policy "Pastries are viewable by everyone"
  on pastries for select using (true);

create policy "Authenticated users can create pastries"
  on pastries for insert with check (auth.role() = 'authenticated');

-- Check-ins: anyone can read, users can insert/delete their own
create policy "Check-ins are viewable by everyone"
  on check_ins for select using (true);

create policy "Users can create their own check-ins"
  on check_ins for insert with check (auth.uid() = user_id);

create policy "Users can delete their own check-ins"
  on check_ins for delete using (auth.uid() = user_id);

-- Lists: public lists are viewable by everyone, own lists always visible
create policy "Public lists are viewable by everyone"
  on lists for select using (is_public or auth.uid() = user_id);

create policy "Users can create their own lists"
  on lists for insert with check (auth.uid() = user_id);

create policy "Users can update their own lists"
  on lists for update using (auth.uid() = user_id);

create policy "Users can delete their own lists"
  on lists for delete using (auth.uid() = user_id);

-- List items: viewable if list is visible, users can modify items in their own lists
create policy "List items are viewable if list is visible"
  on list_items for select using (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
      and (lists.is_public or lists.user_id = auth.uid())
    )
  );

create policy "Users can add items to their own lists"
  on list_items for insert with check (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
      and lists.user_id = auth.uid()
    )
  );

create policy "Users can update items in their own lists"
  on list_items for update using (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
      and lists.user_id = auth.uid()
    )
  );

create policy "Users can remove items from their own lists"
  on list_items for delete using (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
      and lists.user_id = auth.uid()
    )
  );

-- Badges: viewable by everyone (system-managed)
create policy "Badges are viewable by everyone"
  on badges for select using (true);

-- User badges: viewable by everyone, system-managed inserts
create policy "User badges are viewable by everyone"
  on user_badges for select using (true);

-- Follows: viewable by everyone, users manage their own follows
create policy "Follows are viewable by everyone"
  on follows for select using (true);

create policy "Users can follow others"
  on follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow others"
  on follows for delete using (auth.uid() = follower_id);
