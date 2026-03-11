-- ============================================================
-- Pastry Buddy: Rename bakeries → places
-- Renames the table, FK columns, indexes, views, RLS policies,
-- and all functions that reference bakeries / bakery_id.
-- ============================================================

-- ============================================================
-- 1. RENAME TABLE
-- ============================================================

alter table bakeries rename to places;

-- ============================================================
-- 2. RENAME FK COLUMNS
-- ============================================================

alter table pastries  rename column bakery_id to place_id;
alter table check_ins rename column bakery_id to place_id;

-- ============================================================
-- 3. RECREATE INDEXES on renamed columns
-- ============================================================

-- Indexes on the places table itself were auto-renamed with the table,
-- but we drop and recreate for clarity and consistent naming.

drop index if exists idx_bakeries_slug;
drop index if exists idx_bakeries_city;
drop index if exists idx_bakeries_name_trgm;
drop index if exists idx_bakeries_geo;

create index idx_places_slug      on places (slug);
create index idx_places_city      on places (city);
create index idx_places_name_trgm on places using gin (name gin_trgm_ops);
create index idx_places_geo       on places using gist (ll_to_earth(latitude, longitude))
  where latitude is not null and longitude is not null;

-- Indexes on pastries.place_id and check_ins.place_id
drop index if exists idx_pastries_bakery;
drop index if exists idx_checkins_bakery;

create index idx_pastries_place on pastries (place_id);
create index idx_checkins_place on check_ins (place_id);

-- ============================================================
-- 4. RECREATE feed_view (must DROP first — column renames not allowed)
-- ============================================================

drop view if exists feed_view;
create view feed_view as
select
  ci.id,
  ci.user_id,
  ci.pastry_id,
  ci.place_id,
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
  -- place
  b.name           as place_name,
  b.slug           as place_slug,
  b.city           as place_city
from check_ins ci
join profiles p  on p.id  = ci.user_id
join pastries pa on pa.id = ci.pastry_id
join places b    on b.id  = ci.place_id
order by ci.created_at desc;

-- ============================================================
-- 5. RECREATE RLS POLICIES for the renamed table
-- ============================================================

-- Drop old policies (they still reference "bakeries" internally)
drop policy if exists "Bakeries are viewable by everyone"      on places;
drop policy if exists "Authenticated users can create bakeries" on places;

-- Recreate with updated names
create policy "Places are viewable by everyone"
  on places for select using (true);

create policy "Authenticated users can create places"
  on places for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- 6. RECREATE MATERIALIZED VIEW: user_taste_profiles
--    (references bakery_id → place_id)
-- ============================================================

drop materialized view if exists user_taste_profiles cascade;

create materialized view user_taste_profiles as
select
  ci.user_id,
  -- Top flavor tags (up to 10, ranked by frequency)
  (
    select array_agg(tag order by cnt desc)
    from (
      select unnest(ci2.flavor_tags) as tag, count(*) as cnt
      from check_ins ci2
      where ci2.user_id = ci.user_id
      group by tag
      order by cnt desc
      limit 10
    ) t
  ) as top_flavor_tags,
  -- Category preferences (ordered by frequency)
  (
    select array_agg(cat order by cnt desc)
    from (
      select pa.category as cat, count(*) as cnt
      from check_ins ci3
      join pastries pa on pa.id = ci3.pastry_id
      where ci3.user_id = ci.user_id
      group by pa.category
      order by cnt desc
    ) c
  ) as preferred_categories,
  -- Average rating this user gives
  round(avg(ci.rating)::numeric, 2) as avg_given_rating,
  -- Total check-ins (for weighting)
  count(*) as total_checkins,
  -- Distinct places visited
  count(distinct ci.place_id) as places_visited,
  -- Last activity
  max(ci.created_at) as last_active
from check_ins ci
group by ci.user_id;

-- Unique index required for concurrent refresh
create unique index idx_utp_user_id on user_taste_profiles (user_id);

-- ============================================================
-- 7. RECREATE FUNCTIONS
-- ============================================================

-- 7a. fn_refresh_taste_profiles (unchanged body, but depends on
--     materialized view which was just recreated)
create or replace function fn_refresh_taste_profiles()
returns void as $$
begin
  refresh materialized view concurrently user_taste_profiles;
end;
$$ language plpgsql security definer;

-- 7b. fn_recommend_pastries_content
--     (bakeries → places, bakery_id → place_id, bakery_name → place_name,
--      bakery_city → place_city)

drop function if exists fn_recommend_pastries_content(uuid, int) cascade;

create or replace function fn_recommend_pastries_content(
  p_user_id uuid,
  p_limit int default 10
)
returns table (
  pastry_id text,
  pastry_name text,
  pastry_slug text,
  pastry_category text,
  place_name text,
  place_city text,
  avg_rating numeric,
  total_checkins int,
  score numeric,
  reason text
) as $$
declare
  v_tags text[];
  v_cats text[];
begin
  -- Get user taste profile
  select utp.top_flavor_tags, utp.preferred_categories
  into v_tags, v_cats
  from user_taste_profiles utp
  where utp.user_id = p_user_id;

  -- Fallback: if no taste profile, return trending pastries
  if v_tags is null and v_cats is null then
    return query
      select
        p.id, p.name, p.slug, p.category,
        b.name, b.city,
        p.avg_rating, p.total_checkins,
        coalesce(p.avg_rating, 0)::numeric as score,
        'Trending in the community'::text as reason
      from pastries p
      join places b on b.id = p.place_id
      where p.id not in (select ci.pastry_id from check_ins ci where ci.user_id = p_user_id)
      order by p.total_checkins desc, p.avg_rating desc nulls last
      limit p_limit;
    return;
  end if;

  return query
    select
      p.id,
      p.name,
      p.slug,
      p.category,
      b.name,
      b.city,
      p.avg_rating,
      p.total_checkins,
      (
        -- Flavor tag overlap score (0-5 points)
        coalesce((
          select count(*)::numeric
          from unnest(v_tags) ut(tag)
          join (
            select unnest(ci_inner.flavor_tags) as ftag
            from check_ins ci_inner
            where ci_inner.pastry_id = p.id
          ) ptags on ptags.ftag = ut.tag
        ), 0) * 1.0
        -- Category match (0 or 3 points)
        + case when p.category = any(v_cats[1:3]) then 3.0 else 0.0 end
        -- Rating bonus (0-2.5 points)
        + coalesce(p.avg_rating, 0)::numeric * 0.5
        -- Popularity bonus (log scale, 0-2 points)
        + least(ln(greatest(p.total_checkins, 1) + 1), 2.0)::numeric
      ) as score,
      case
        when p.category = any(v_cats[1:2]) then 'Matches your favorite category: ' || p.category
        when exists (
          select 1 from unnest(v_tags) ut(tag)
          join (
            select unnest(ci_inner.flavor_tags) as ftag
            from check_ins ci_inner where ci_inner.pastry_id = p.id
          ) ptags on ptags.ftag = ut.tag
        ) then 'Has flavors you love'
        else 'Highly rated by the community'
      end as reason
    from pastries p
    join places b on b.id = p.place_id
    where p.id not in (select ci.pastry_id from check_ins ci where ci.user_id = p_user_id)
    order by score desc, p.avg_rating desc nulls last
    limit p_limit;
end;
$$ language plpgsql stable security definer;

-- 7c. fn_recommend_pastries_collaborative
--     (bakeries → places, bakery_id → place_id)

drop function if exists fn_recommend_pastries_collaborative(uuid, int) cascade;

create or replace function fn_recommend_pastries_collaborative(
  p_user_id uuid,
  p_limit int default 10
)
returns table (
  pastry_id text,
  pastry_name text,
  pastry_slug text,
  pastry_category text,
  place_name text,
  place_city text,
  avg_rating numeric,
  total_checkins int,
  score numeric,
  reason text
) as $$
begin
  return query
    with
    -- Pastries the target user rated highly (>= 4)
    my_favorites as (
      select ci.pastry_id, ci.rating
      from check_ins ci
      where ci.user_id = p_user_id and ci.rating >= 4
    ),
    -- Find similar users: those who also rated the same pastries highly
    similar_users as (
      select
        ci.user_id as sim_user_id,
        count(*) as overlap_count,
        avg(abs(ci.rating - mf.rating))::numeric as rating_diff
      from check_ins ci
      join my_favorites mf on mf.pastry_id = ci.pastry_id
      where ci.user_id != p_user_id
        and ci.rating >= 4
      group by ci.user_id
      having count(*) >= 2  -- at least 2 shared high-rated pastries
      order by overlap_count desc, rating_diff asc
      limit 20
    ),
    -- Pastries these similar users loved that I haven't tried
    candidates as (
      select
        ci.pastry_id,
        count(distinct ci.user_id) as recommender_count,
        avg(ci.rating)::numeric as avg_sim_rating
      from check_ins ci
      join similar_users su on su.sim_user_id = ci.user_id
      where ci.rating >= 4
        and ci.pastry_id not in (select pastry_id from my_favorites)
        and ci.pastry_id not in (
          select ci2.pastry_id from check_ins ci2 where ci2.user_id = p_user_id
        )
      group by ci.pastry_id
    )
    select
      p.id,
      p.name,
      p.slug,
      p.category,
      b.name,
      b.city,
      p.avg_rating,
      p.total_checkins,
      (
        c.recommender_count * 2.0
        + c.avg_sim_rating * 0.5
        + coalesce(p.avg_rating, 0) * 0.3
      )::numeric as score,
      'Loved by ' || c.recommender_count || ' user'
        || case when c.recommender_count > 1 then 's' else '' end
        || ' with similar taste' as reason
    from candidates c
    join pastries p on p.id = c.pastry_id
    join places b on b.id = p.place_id
    order by score desc
    limit p_limit;
end;
$$ language plpgsql stable security definer;

-- 7d. fn_similar_pastries
--     (bakeries → places, bakery_id → place_id)

drop function if exists fn_similar_pastries(text, int) cascade;

create or replace function fn_similar_pastries(
  p_pastry_id text,
  p_limit int default 6
)
returns table (
  pastry_id text,
  pastry_name text,
  pastry_slug text,
  pastry_category text,
  place_name text,
  place_city text,
  avg_rating numeric,
  total_checkins int,
  score numeric
) as $$
declare
  v_category text;
  v_place_id text;
  v_tags text[];
begin
  -- Get the source pastry's attributes
  select p.category, p.place_id
  into v_category, v_place_id
  from pastries p where p.id = p_pastry_id;

  -- Collect the most common flavor tags from this pastry's check-ins
  select array_agg(tag order by cnt desc)
  into v_tags
  from (
    select unnest(ci.flavor_tags) as tag, count(*) as cnt
    from check_ins ci
    where ci.pastry_id = p_pastry_id
    group by tag
    order by cnt desc
    limit 5
  ) t;

  return query
    select
      p.id, p.name, p.slug, p.category,
      b.name, b.city,
      p.avg_rating, p.total_checkins,
      (
        -- Same category = big boost
        case when p.category = v_category then 5.0 else 0.0 end
        -- Different place = slight boost (diversity)
        + case when p.place_id != v_place_id then 1.0 else 0.0 end
        -- Flavor tag overlap
        + coalesce((
          select count(*)::numeric
          from unnest(v_tags) ut(tag)
          join (
            select unnest(ci_inner.flavor_tags) as ftag
            from check_ins ci_inner where ci_inner.pastry_id = p.id
          ) ptags on ptags.ftag = ut.tag
        ), 0) * 1.5
        -- Rating bonus
        + coalesce(p.avg_rating, 0)::numeric * 0.5
      )::numeric as score
    from pastries p
    join places b on b.id = p.place_id
    where p.id != p_pastry_id
    order by score desc, p.avg_rating desc nulls last
    limit p_limit;
end;
$$ language plpgsql stable security definer;

-- 7e. fn_recommend_bakeries → fn_recommend_places
--     (complete rename: function name, return columns, body)

drop function if exists fn_recommend_bakeries(uuid, int) cascade;

create or replace function fn_recommend_places(
  p_user_id uuid,
  p_limit int default 6
)
returns table (
  place_id text,
  place_name text,
  place_slug text,
  place_city text,
  pastry_count bigint,
  avg_place_rating numeric,
  score numeric,
  reason text
) as $$
declare
  v_cats text[];
begin
  select utp.preferred_categories
  into v_cats
  from user_taste_profiles utp
  where utp.user_id = p_user_id;

  return query
    select
      b.id,
      b.name,
      b.slug,
      b.city,
      count(p.id) as pastry_count,
      round(avg(p.avg_rating)::numeric, 2) as avg_place_rating,
      (
        -- Has pastries in user's preferred categories
        coalesce((
          select count(*)::numeric
          from pastries p2
          where p2.place_id = b.id
            and p2.category = any(coalesce(v_cats[1:3], array[]::text[]))
        ), 0) * 2.0
        -- Overall place quality
        + coalesce(avg(p.avg_rating), 0)::numeric
        -- Variety bonus
        + least(count(distinct p.category), 5)::numeric * 0.5
      )::numeric as score,
      case
        when exists (
          select 1 from pastries p3
          where p3.place_id = b.id
            and p3.category = any(coalesce(v_cats[1:2], array[]::text[]))
        ) then 'Known for ' || (
          select p4.category from pastries p4
          where p4.place_id = b.id
            and p4.category = any(coalesce(v_cats[1:2], array[]::text[]))
          limit 1
        ) || ' you love'
        else 'Highly rated place'
      end as reason
    from places b
    join pastries p on p.place_id = b.id
    where b.id not in (
      select distinct ci.place_id from check_ins ci where ci.user_id = p_user_id
    )
    group by b.id, b.name, b.slug, b.city
    order by score desc
    limit p_limit;
end;
$$ language plpgsql stable security definer;

-- 7f. fn_top_bakeries → fn_top_places (from 006_leaderboards.sql)

drop function if exists fn_top_bakeries(int, text) cascade;

create or replace function fn_top_places(
  p_limit int default 10,
  p_timeframe text default 'week'
)
returns table(
  rank bigint,
  place_id text,
  place_name text,
  place_slug text,
  place_city text,
  checkin_count bigint,
  unique_visitors bigint,
  avg_rating numeric
)
language plpgsql
stable
security definer
as $$
declare
  v_since timestamptz;
begin
  v_since := case p_timeframe
    when 'week' then date_trunc('week', now())
    when 'month' then date_trunc('month', now())
    else '1970-01-01'::timestamptz
  end;

  return query
  select
    row_number() over (order by count(ci.id) desc)::bigint as rank,
    b.id as place_id,
    b.name as place_name,
    b.slug as place_slug,
    b.city as place_city,
    count(ci.id)::bigint as checkin_count,
    count(distinct ci.user_id)::bigint as unique_visitors,
    round(avg(ci.rating)::numeric, 1) as avg_rating
  from check_ins ci
  join places b on b.id = ci.place_id
  where ci.created_at >= v_since
  group by b.id, b.name, b.slug, b.city
  order by count(ci.id) desc
  limit p_limit;
end;
$$;

-- 7g. fn_top_pastries (from 006, references bakeries → places)

drop function if exists fn_top_pastries(int, text) cascade;

create or replace function fn_top_pastries(
  p_limit int default 10,
  p_timeframe text default 'week'
)
returns table(
  rank bigint,
  pastry_id text,
  pastry_name text,
  pastry_slug text,
  pastry_category text,
  place_name text,
  checkin_count bigint,
  avg_rating numeric
)
language plpgsql
stable
security definer
as $$
declare
  v_since timestamptz;
  v_min_checkins int;
begin
  v_since := case p_timeframe
    when 'week' then date_trunc('week', now())
    when 'month' then date_trunc('month', now())
    else '1970-01-01'::timestamptz
  end;

  -- Lower threshold for shorter timeframes
  v_min_checkins := case p_timeframe
    when 'week' then 1
    when 'month' then 2
    else 3
  end;

  return query
  select
    row_number() over (order by round(avg(ci.rating)::numeric, 2) desc, count(ci.id) desc)::bigint as rank,
    p.id as pastry_id,
    p.name as pastry_name,
    p.slug as pastry_slug,
    p.category as pastry_category,
    b.name as place_name,
    count(ci.id)::bigint as checkin_count,
    round(avg(ci.rating)::numeric, 1) as avg_rating
  from check_ins ci
  join pastries p on p.id = ci.pastry_id
  join places b on b.id = p.place_id
  where ci.created_at >= v_since
  group by p.id, p.name, p.slug, p.category, b.name
  having count(ci.id) >= v_min_checkins
  order by round(avg(ci.rating)::numeric, 2) desc, count(ci.id) desc
  limit p_limit;
end;
$$;

-- 7h. fn_friend_suggestions (from 007, references bakery_id → place_id)

create or replace function fn_friend_suggestions(p_user_id uuid, p_limit integer default 5)
returns table(user_id uuid, username text, display_name text, avatar_url text, reason text, score integer)
language sql stable
as $$
  with already_following as (
    select following_id from public.follows where follower_id = p_user_id
  ),
  -- Score by shared places
  place_overlap as (
    select ci.user_id,
           count(distinct ci.place_id)::integer as shared_places
    from public.check_ins ci
    where ci.place_id in (select place_id from public.check_ins where user_id = p_user_id)
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
    select coalesce(po.user_id, mf.user_id) as uid,
           coalesce(po.shared_places, 0) * 10 + coalesce(mf.mutual_count, 0) * 15 as score,
           case
             when coalesce(mf.mutual_count, 0) > 0 then mf.mutual_count || ' mutual follows'
             else po.shared_places || ' shared places'
           end as reason
    from place_overlap po
    full outer join mutual_follows mf on po.user_id = mf.user_id
  )
  select c.uid as user_id, p.username, p.display_name, p.avatar_url, c.reason, c.score
  from combined c
  join public.profiles p on c.uid = p.id
  order by c.score desc
  limit p_limit;
$$;
