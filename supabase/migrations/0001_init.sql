-- Triman MVP schema: profiles, coaching conversations, training plans,
-- readiness check-ins and Strava integration. All user-owned tables carry
-- Row Level Security so a user can only ever see their own rows.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  sports text[] not null default '{}',
  level text check (level in ('beginner', 'intermediate', 'advanced', 'elite')),
  weekly_hours numeric(4, 1),
  injuries_notes text,
  preferred_coach text not null default 'charly' check (preferred_coach in ('charly', 'claudia', 'max')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create an empty profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- conversations (one thread per user per coach)
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  coach_id text not null check (coach_id in ('charly', 'claudia', 'max')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, coach_id)
);

alter table public.conversations enable row level security;

create policy "conversations_select_own" on public.conversations
  for select using (auth.uid() = user_id);
create policy "conversations_insert_own" on public.conversations
  for insert with check (auth.uid() = user_id);
create policy "conversations_update_own" on public.conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversations_delete_own" on public.conversations
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  coach_id text not null check (coach_id in ('charly', 'claudia', 'max')),
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "messages_select_own" on public.messages
  for select using (auth.uid() = user_id);
create policy "messages_insert_own" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- training_plans + training_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  coach_id text not null check (coach_id in ('charly', 'claudia', 'max')),
  title text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_plans enable row level security;

create policy "training_plans_select_own" on public.training_plans
  for select using (auth.uid() = user_id);
create policy "training_plans_insert_own" on public.training_plans
  for insert with check (auth.uid() = user_id);
create policy "training_plans_update_own" on public.training_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "training_plans_delete_own" on public.training_plans
  for delete using (auth.uid() = user_id);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date not null,
  sport text not null,
  session_type text not null,
  duration_minutes integer,
  description text,
  rationale text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_sessions_plan_date_idx
  on public.training_sessions (plan_id, session_date);

alter table public.training_sessions enable row level security;

create policy "training_sessions_select_own" on public.training_sessions
  for select using (auth.uid() = user_id);
create policy "training_sessions_insert_own" on public.training_sessions
  for insert with check (auth.uid() = user_id);
create policy "training_sessions_update_own" on public.training_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "training_sessions_delete_own" on public.training_sessions
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- readiness_checkins
-- ---------------------------------------------------------------------------
create table if not exists public.readiness_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  energy smallint not null check (energy between 1 and 5),
  sleep_quality smallint not null check (sleep_quality between 1 and 5),
  muscle_soreness smallint not null check (muscle_soreness between 1 and 5),
  stress smallint not null check (stress between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists readiness_checkins_user_created_idx
  on public.readiness_checkins (user_id, created_at desc);

alter table public.readiness_checkins enable row level security;

create policy "readiness_checkins_select_own" on public.readiness_checkins
  for select using (auth.uid() = user_id);
create policy "readiness_checkins_insert_own" on public.readiness_checkins
  for insert with check (auth.uid() = user_id);
create policy "readiness_checkins_delete_own" on public.readiness_checkins
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- strava_connections + strava_activities
-- ---------------------------------------------------------------------------
create table if not exists public.strava_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  strava_athlete_id bigint not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.strava_connections enable row level security;

create policy "strava_connections_select_own" on public.strava_connections
  for select using (auth.uid() = user_id);
create policy "strava_connections_insert_own" on public.strava_connections
  for insert with check (auth.uid() = user_id);
create policy "strava_connections_update_own" on public.strava_connections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "strava_connections_delete_own" on public.strava_connections
  for delete using (auth.uid() = user_id);

create table if not exists public.strava_activities (
  id bigint primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  sport_type text,
  start_date timestamptz,
  moving_time_seconds integer,
  distance_meters numeric,
  average_speed numeric,
  average_heartrate numeric,
  average_watts numeric,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists strava_activities_user_start_idx
  on public.strava_activities (user_id, start_date desc);

alter table public.strava_activities enable row level security;

create policy "strava_activities_select_own" on public.strava_activities
  for select using (auth.uid() = user_id);
create policy "strava_activities_insert_own" on public.strava_activities
  for insert with check (auth.uid() = user_id);
create policy "strava_activities_update_own" on public.strava_activities
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "strava_activities_delete_own" on public.strava_activities
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.conversations;
create trigger set_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.training_plans;
create trigger set_updated_at before update on public.training_plans
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.training_sessions;
create trigger set_updated_at before update on public.training_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.strava_connections;
create trigger set_updated_at before update on public.strava_connections
  for each row execute function public.set_updated_at();
