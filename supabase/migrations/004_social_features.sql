-- ============================================================
-- Pastry Buddy: Social Features & Progressive Unlocking
-- ============================================================

-- ============================================================
-- 1. fn_user_streak(p_user_id) → integer
-- Calculates consecutive-day check-in streak for a user.
-- ============================================================

create or replace function fn_user_streak(p_user_id uuid)
returns integer
language sql
stable
security definer
as $$
  with daily_checkins as (
    select distinct (created_at at time zone 'America/Los_Angeles')::date as checkin_date
    from check_ins
    where user_id = p_user_id
    order by checkin_date desc
  ),
  streak as (
    select
      checkin_date,
      checkin_date - (row_number() over (order by checkin_date desc))::int as grp
    from daily_checkins
  )
  select coalesce(
    (
      select count(*)::int
      from streak
      where grp = (
        -- Only count the streak group that includes today or yesterday
        select grp from streak
        where checkin_date >= (current_date at time zone 'America/Los_Angeles')::date - 1
        order by checkin_date desc
        limit 1
      )
    ),
    0
  );
$$;

-- ============================================================
-- 2. fn_taste_similarity(p_user_a, p_user_b) → integer (0-99)
-- Computes taste similarity between two users:
--   60% rating correlation on shared pastries
--   40% flavor tag Jaccard similarity
-- Returns null if insufficient data (< 3 check-ins each).
-- ============================================================

create or replace function fn_taste_similarity(p_user_a uuid, p_user_b uuid)
returns integer
language plpgsql
stable
security definer
as $$
declare
  v_a_count int;
  v_b_count int;
  v_shared_count int;
  v_rating_score float := 0;
  v_flavor_score float := 0;
  v_blended float;
  v_a_tags text[];
  v_b_tags text[];
  v_intersection int;
  v_union int;
begin
  -- Require minimum check-ins from both users
  select count(*) into v_a_count from check_ins where user_id = p_user_a;
  select count(*) into v_b_count from check_ins where user_id = p_user_b;
  if v_a_count < 3 or v_b_count < 3 then
    return null;
  end if;

  -- Rating correlation on shared pastries (use max rating per pastry per user)
  select
    count(*),
    case when count(*) >= 2
      then 1.0 - (sum(abs(a_rating - b_rating))::float / (count(*) * 4.0))
      else 0
    end
  into v_shared_count, v_rating_score
  from (
    select
      a.pastry_id,
      max(a.rating) as a_rating,
      max(b.rating) as b_rating
    from check_ins a
    join check_ins b on a.pastry_id = b.pastry_id and b.user_id = p_user_b
    where a.user_id = p_user_a
    group by a.pastry_id
  ) shared;

  -- Flavor tag Jaccard similarity
  select array_agg(distinct tag) into v_a_tags
  from check_ins, unnest(flavor_tags) as tag
  where user_id = p_user_a;

  select array_agg(distinct tag) into v_b_tags
  from check_ins, unnest(flavor_tags) as tag
  where user_id = p_user_b;

  if v_a_tags is not null and v_b_tags is not null
     and array_length(v_a_tags, 1) > 0 and array_length(v_b_tags, 1) > 0
  then
    select count(*) into v_intersection
    from unnest(v_a_tags) t(tag)
    where tag = any(v_b_tags);

    v_union := (
      select count(distinct tag) from (
        select unnest(v_a_tags) as tag
        union
        select unnest(v_b_tags)
      ) all_tags
    );

    if v_union > 0 then
      v_flavor_score := v_intersection::float / v_union::float;
    end if;
  end if;

  -- Blend: 60/40 if shared pastries exist, otherwise flavor-only
  if v_shared_count >= 2 then
    v_blended := v_rating_score * 0.6 + v_flavor_score * 0.4;
  else
    v_blended := v_flavor_score;
  end if;

  -- Scale to 40-99 range
  return least(99, greatest(40, round(40 + v_blended * 59)::int));
end;
$$;

-- ============================================================
-- 3. fn_pastry_match_score(p_user_id, p_pastry_id) → integer (0-99)
-- How well a pastry matches a user's taste profile based on
-- flavor tag overlap and category preference.
-- ============================================================

create or replace function fn_pastry_match_score(p_user_id uuid, p_pastry_id text)
returns integer
language plpgsql
stable
security definer
as $$
declare
  v_user_tags text[];
  v_pastry_tags text[];
  v_pastry_category text;
  v_user_categories text[];
  v_tag_overlap float := 0;
  v_cat_bonus float := 0;
  v_intersection int;
  v_union int;
  v_score float;
begin
  -- Get user's flavor tag profile
  select array_agg(distinct tag) into v_user_tags
  from check_ins, unnest(flavor_tags) as tag
  where user_id = p_user_id;

  if v_user_tags is null or array_length(v_user_tags, 1) is null then
    return null; -- not enough data
  end if;

  -- Get pastry's flavor tags and category
  select p.flavor_tags, p.category
  into v_pastry_tags, v_pastry_category
  from pastries p
  where p.id = p_pastry_id;

  if v_pastry_tags is null or array_length(v_pastry_tags, 1) is null then
    -- Fall back to category-only scoring
    select array_agg(distinct pa.category order by count(*) desc)
    into v_user_categories
    from check_ins ci
    join pastries pa on pa.id = ci.pastry_id
    where ci.user_id = p_user_id
    group by pa.category;

    if v_pastry_category = any(v_user_categories) then
      return 60; -- category match only
    end if;
    return 40;
  end if;

  -- Tag Jaccard similarity
  select count(*) into v_intersection
  from unnest(v_user_tags) t(tag)
  where tag = any(v_pastry_tags);

  v_union := (
    select count(distinct tag) from (
      select unnest(v_user_tags) as tag
      union
      select unnest(v_pastry_tags)
    ) all_tags
  );

  if v_union > 0 then
    v_tag_overlap := v_intersection::float / v_union::float;
  end if;

  -- Category bonus: +15pts if pastry is in user's preferred categories
  select array_agg(cat) into v_user_categories
  from (
    select pa.category as cat, count(*) as cnt
    from check_ins ci
    join pastries pa on pa.id = ci.pastry_id
    where ci.user_id = p_user_id
    group by pa.category
    order by cnt desc
    limit 3
  ) top_cats;

  if v_pastry_category = any(v_user_categories) then
    v_cat_bonus := 0.15;
  end if;

  -- Scale to 30-99 range
  v_score := v_tag_overlap * 0.85 + v_cat_bonus;
  return least(99, greatest(30, round(30 + v_score * 69)::int));
end;
$$;

-- ============================================================
-- 4. fn_user_unlocked_features(p_user_id) → jsonb
-- Returns which features a user has unlocked based on check-in count.
-- Thresholds:
--   1+  check-ins → basic_profile
--   3+  check-ins → recommendations, discover_filters
--   5+  check-ins → taste_profile, lists
--   10+ check-ins → badges, streaks
--   15+ check-ins → taste_match, leaderboard
--   25+ check-ins → advanced_stats
-- ============================================================

create or replace function fn_user_unlocked_features(p_user_id uuid)
returns jsonb
language sql
stable
security definer
as $$
  select jsonb_build_object(
    'total_checkins', p.total_checkins,
    'basic_profile', p.total_checkins >= 1,
    'recommendations', p.total_checkins >= 3,
    'discover_filters', p.total_checkins >= 3,
    'taste_profile', p.total_checkins >= 5,
    'lists', p.total_checkins >= 5,
    'badges', p.total_checkins >= 10,
    'streaks', p.total_checkins >= 10,
    'taste_match', p.total_checkins >= 15,
    'leaderboard', p.total_checkins >= 15,
    'advanced_stats', p.total_checkins >= 25
  )
  from profiles p
  where p.id = p_user_id;
$$;
