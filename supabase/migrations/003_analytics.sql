-- ============================================================
-- Pastry Buddy: Analytics Events Table
-- ============================================================

create table user_events (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid references profiles(id) on delete set null,
  event_name  text not null,
  properties  jsonb default '{}',
  page_path   text,
  created_at  timestamptz default now() not null
);

create index idx_user_events_name on user_events (event_name, created_at desc);
create index idx_user_events_user on user_events (user_id, created_at desc);
create index idx_user_events_created on user_events (created_at desc);

-- RLS: users can insert their own events, only service role can read all
alter table user_events enable row level security;

create policy "Users can insert their own events"
  on user_events for insert with check (
    auth.uid() = user_id or user_id is null
  );

create policy "Users can read their own events"
  on user_events for select using (auth.uid() = user_id);
