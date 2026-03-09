-- ============================================================
-- Pastry Buddy: Leaderboard System
-- ============================================================

-- ============================================================
-- 1. fn_weekly_leaderboard(p_user_id, p_scope, p_limit)
-- Returns ranked users by check-in count within the current week.
-- Scope: 'friends' (followed users + self) or 'global'.
-- ============================================================

create or replace function fn_weekly_leaderboard(
  p_user_id uuid,
  p_scope text default 'friends',
  p_limit int default 20
)
returns table(
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  checkin_count bigint,
  is_self boolean
)
language plpgsql
stable
security definer
as $$
declare
  v_week_start timestamptz := date_trunc('week', now());
begin
  return query
  with eligible_users as (
    select p.id as uid
    from profiles p
    where
      case when p_scope = 'friends' then
        p.id = p_user_id
        or p.id in (select f.following_id from follows f where f.follower_id = p_user_id)
      else
        true
      end
  ),
  counts as (
    select
      eu.uid,
      count(ci.id) as cnt
    from eligible_users eu
    left join check_ins ci on ci.user_id = eu.uid and ci.created_at >= v_week_start
    group by eu.uid
  )
  select
    row_number() over (order by c.cnt desc, p.username asc)::bigint as rank,
    p.id as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    c.cnt as checkin_count,
    (p.id = p_user_id) as is_self
  from counts c
  join profiles p on p.id = c.uid
  where c.cnt > 0
  order by c.cnt desc, p.username asc
  limit p_limit;
end;
$$;

-- ============================================================
-- 2. fn_top_bakeries(p_limit, p_timeframe)
-- Most checked-in bakeries within a timeframe.
-- Timeframe: 'week', 'month', or 'all'.
-- ============================================================

create or replace function fn_top_bakeries(
  p_limit int default 10,
  p_timeframe text default 'week'
)
returns table(
  rank bigint,
  bakery_id text,
  bakery_name text,
  bakery_slug text,
  bakery_city text,
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
    b.id as bakery_id,
    b.name as bakery_name,
    b.slug as bakery_slug,
    b.city as bakery_city,
    count(ci.id)::bigint as checkin_count,
    count(distinct ci.user_id)::bigint as unique_visitors,
    round(avg(ci.rating)::numeric, 1) as avg_rating
  from check_ins ci
  join bakeries b on b.id = ci.bakery_id
  where ci.created_at >= v_since
  group by b.id, b.name, b.slug, b.city
  order by count(ci.id) desc
  limit p_limit;
end;
$$;

-- ============================================================
-- 3. fn_top_pastries(p_limit, p_timeframe)
-- Highest rated pastries with minimum 2 check-ins.
-- Timeframe: 'week', 'month', or 'all'.
-- ============================================================

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
  bakery_name text,
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
    b.name as bakery_name,
    count(ci.id)::bigint as checkin_count,
    round(avg(ci.rating)::numeric, 1) as avg_rating
  from check_ins ci
  join pastries p on p.id = ci.pastry_id
  join bakeries b on b.id = p.bakery_id
  where ci.created_at >= v_since
  group by p.id, p.name, p.slug, p.category, b.name
  having count(ci.id) >= v_min_checkins
  order by round(avg(ci.rating)::numeric, 2) desc, count(ci.id) desc
  limit p_limit;
end;
$$;

-- ============================================================
-- 4. fn_user_rank(p_user_id)
-- User's all-time rank by total check-ins and percentile.
-- ============================================================

create or replace function fn_user_rank(p_user_id uuid)
returns table(
  rank bigint,
  total_users bigint,
  percentile int,
  total_checkins int,
  weekly_checkins bigint,
  weekly_rank bigint
)
language plpgsql
stable
security definer
as $$
declare
  v_week_start timestamptz := date_trunc('week', now());
begin
  return query
  with all_ranks as (
    select
      p.id,
      p.total_checkins as tc,
      row_number() over (order by p.total_checkins desc, p.created_at asc) as rk
    from profiles p
    where p.total_checkins > 0
  ),
  total as (
    select count(*)::bigint as cnt from all_ranks
  ),
  weekly as (
    select
      ci.user_id,
      count(*) as wk_cnt,
      row_number() over (order by count(*) desc) as wk_rk
    from check_ins ci
    where ci.created_at >= v_week_start
    group by ci.user_id
  )
  select
    coalesce(ar.rk, total.cnt + 1)::bigint as rank,
    total.cnt as total_users,
    case when total.cnt > 0
      then greatest(1, (100 - (coalesce(ar.rk, total.cnt + 1)::float / total.cnt * 100))::int)
      else 0
    end as percentile,
    coalesce(p.total_checkins, 0) as total_checkins,
    coalesce(w.wk_cnt, 0)::bigint as weekly_checkins,
    coalesce(w.wk_rk, 0)::bigint as weekly_rank
  from profiles p
  cross join total
  left join all_ranks ar on ar.id = p.id
  left join weekly w on w.user_id = p.id
  where p.id = p_user_id;
end;
$$;
