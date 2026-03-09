-- ============================================================
-- Pastry Buddy: Recommendation Engine
-- ============================================================

-- ============================================================
-- MATERIALIZED VIEW: User taste profiles
-- Aggregates each user's check-in data into a taste fingerprint.
-- ============================================================

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
  -- Distinct bakeries visited
  count(distinct ci.bakery_id) as bakeries_visited,
  -- Last activity
  max(ci.created_at) as last_active
from check_ins ci
group by ci.user_id;

-- Unique index required for concurrent refresh
create unique index idx_utp_user_id on user_taste_profiles (user_id);

-- ============================================================
-- FUNCTION: Refresh taste profiles
-- Called after batch check-in inserts or on a schedule.
-- ============================================================

create or replace function fn_refresh_taste_profiles()
returns void as $$
begin
  refresh materialized view concurrently user_taste_profiles;
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCTION: Content-based pastry recommendations
-- Recommends pastries the user hasn't tried, ranked by:
--   1. Flavor tag overlap with user's top tags
--   2. Category match with user's preferred categories
--   3. High community rating
-- ============================================================

create or replace function fn_recommend_pastries_content(
  p_user_id uuid,
  p_limit int default 10
)
returns table (
  pastry_id text,
  pastry_name text,
  pastry_slug text,
  pastry_category text,
  bakery_name text,
  bakery_city text,
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
      join bakeries b on b.id = p.bakery_id
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
    join bakeries b on b.id = p.bakery_id
    where p.id not in (select ci.pastry_id from check_ins ci where ci.user_id = p_user_id)
    order by score desc, p.avg_rating desc nulls last
    limit p_limit;
end;
$$ language plpgsql stable security definer;

-- ============================================================
-- FUNCTION: Collaborative filtering recommendations
-- "Users who liked what you liked also enjoyed..."
-- ============================================================

create or replace function fn_recommend_pastries_collaborative(
  p_user_id uuid,
  p_limit int default 10
)
returns table (
  pastry_id text,
  pastry_name text,
  pastry_slug text,
  pastry_category text,
  bakery_name text,
  bakery_city text,
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
    join bakeries b on b.id = p.bakery_id
    order by score desc
    limit p_limit;
end;
$$ language plpgsql stable security definer;

-- ============================================================
-- FUNCTION: Similar pastries (for detail pages)
-- Given a pastry, find others with same category + overlapping tags.
-- ============================================================

create or replace function fn_similar_pastries(
  p_pastry_id text,
  p_limit int default 6
)
returns table (
  pastry_id text,
  pastry_name text,
  pastry_slug text,
  pastry_category text,
  bakery_name text,
  bakery_city text,
  avg_rating numeric,
  total_checkins int,
  score numeric
) as $$
declare
  v_category text;
  v_bakery_id text;
  v_tags text[];
begin
  -- Get the source pastry's attributes
  select p.category, p.bakery_id
  into v_category, v_bakery_id
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
        -- Different bakery = slight boost (diversity)
        + case when p.bakery_id != v_bakery_id then 1.0 else 0.0 end
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
    join bakeries b on b.id = p.bakery_id
    where p.id != p_pastry_id
    order by score desc, p.avg_rating desc nulls last
    limit p_limit;
end;
$$ language plpgsql stable security definer;

-- ============================================================
-- FUNCTION: Recommended bakeries for a user
-- Based on category preferences and unvisited bakeries.
-- ============================================================

create or replace function fn_recommend_bakeries(
  p_user_id uuid,
  p_limit int default 6
)
returns table (
  bakery_id text,
  bakery_name text,
  bakery_slug text,
  bakery_city text,
  pastry_count bigint,
  avg_bakery_rating numeric,
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
      round(avg(p.avg_rating)::numeric, 2) as avg_bakery_rating,
      (
        -- Has pastries in user's preferred categories
        coalesce((
          select count(*)::numeric
          from pastries p2
          where p2.bakery_id = b.id
            and p2.category = any(coalesce(v_cats[1:3], array[]::text[]))
        ), 0) * 2.0
        -- Overall bakery quality
        + coalesce(avg(p.avg_rating), 0)::numeric
        -- Variety bonus
        + least(count(distinct p.category), 5)::numeric * 0.5
      )::numeric as score,
      case
        when exists (
          select 1 from pastries p3
          where p3.bakery_id = b.id
            and p3.category = any(coalesce(v_cats[1:2], array[]::text[]))
        ) then 'Known for ' || (
          select p4.category from pastries p4
          where p4.bakery_id = b.id
            and p4.category = any(coalesce(v_cats[1:2], array[]::text[]))
          limit 1
        ) || ' you love'
        else 'Highly rated bakery'
      end as reason
    from bakeries b
    join pastries p on p.bakery_id = b.id
    where b.id not in (
      select distinct ci.bakery_id from check_ins ci where ci.user_id = p_user_id
    )
    group by b.id, b.name, b.slug, b.city
    order by score desc
    limit p_limit;
end;
$$ language plpgsql stable security definer;
