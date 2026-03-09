-- ============================================================
-- Pastry Buddy: Onboarding & First-Time User Experience
-- ============================================================

-- Add onboarding tracking columns to profiles
alter table profiles
  add column if not exists onboarding_completed boolean default false,
  add column if not exists onboarding_step text default 'welcome';

-- ============================================================
-- fn_complete_onboarding(p_user_id, p_favorite_categories)
-- Marks onboarding as complete and seeds taste profile.
-- ============================================================

create or replace function fn_complete_onboarding(
  p_user_id uuid,
  p_favorite_categories text[]
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set
    onboarding_completed = true,
    onboarding_step = 'done',
    favorite_categories = p_favorite_categories,
    updated_at = now()
  where id = p_user_id;
end;
$$;

-- ============================================================
-- fn_update_onboarding_step(p_user_id, p_step)
-- Updates which onboarding step the user is on.
-- ============================================================

create or replace function fn_update_onboarding_step(
  p_user_id uuid,
  p_step text
)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set
    onboarding_step = p_step,
    updated_at = now()
  where id = p_user_id;
end;
$$;

-- ============================================================
-- fn_getting_started_checklist(p_user_id)
-- Returns the user's getting-started progress as JSONB.
-- ============================================================

create or replace function fn_getting_started_checklist(p_user_id uuid)
returns jsonb
language sql
stable
security definer
as $$
  select jsonb_build_object(
    'has_set_categories', (
      select coalesce(array_length(favorite_categories, 1), 0) > 0
      from profiles where id = p_user_id
    ),
    'has_first_checkin', (
      select exists(select 1 from check_ins where user_id = p_user_id limit 1)
    ),
    'has_followed_someone', (
      select exists(select 1 from follows where follower_id = p_user_id limit 1)
    ),
    'has_created_list', (
      select exists(select 1 from lists where user_id = p_user_id limit 1)
    ),
    'has_five_checkins', (
      select count(*) >= 5 from check_ins where user_id = p_user_id
    ),
    'checkin_count', (
      select total_checkins from profiles where id = p_user_id
    ),
    'onboarding_completed', (
      select coalesce(onboarding_completed, false) from profiles where id = p_user_id
    )
  );
$$;
