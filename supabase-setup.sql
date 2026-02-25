-- ═══════════════════════════════════════════════════════════════
-- NexaConnect — Phase 2: Full Database Schema
-- Run this in Supabase SQL Editor (replaces Phase 1 schema)
-- ═══════════════════════════════════════════════════════════════

-- User profiles table (kept from Phase 1, updated tier default)
create table if not exists user_profiles (
  id uuid references auth.users primary key,
  email text,
  name text,
  role text check (role in ('participant', 'provider', 'admin')),
  tier text default 'starter',
  created_at timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "Users can read own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

-- ───────────────────────────────────────────────────────────────

-- Providers table
create table if not exists providers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  email text,
  tier text default 'starter' check (tier in ('starter', 'professional', 'premium')),
  verified boolean default false,
  categories text[] default '{}',
  suburb text,
  state text default 'NSW',
  postcode text,
  phone text,
  website text,
  description text default '',
  short_description text default 'New provider on NexaConnect',
  photos text[] default '{}',
  rating numeric default 0,
  review_count integer default 0,
  response_rate integer default 0,
  response_time text default 'N/A',
  wait_time text default 'TBA',
  plan_types text[] default '{"Plan Managed"}',
  availability jsonb default '{"mon":"9am-5pm","tue":"9am-5pm","wed":"9am-5pm","thu":"9am-5pm","fri":"9am-5pm","sat":"Closed","sun":"Closed"}',
  service_areas text[] default '{}',
  founded integer,
  team_size text default '1',
  languages text[] default '{"English"}',
  features text[] default '{}',
  views_this_month integer default 0,
  enquiries_this_month integer default 0,
  bookings_this_month integer default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- Participants table
create table if not exists participants (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  email text,
  suburb text,
  state text default 'NSW',
  ndis_number text,
  plan_type text default 'Plan Managed',
  goals text[] default '{}',
  categories text[] default '{}',
  favourites uuid[] default '{}',
  created_at timestamptz default now()
);

-- Reviews
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  provider_id uuid references providers not null,
  participant_id uuid references participants not null,
  participant_name text,
  rating integer check (rating between 1 and 5),
  text text,
  response text,
  response_date date,
  created_at timestamptz default now()
);

-- Enquiries
create table if not exists enquiries (
  id uuid default gen_random_uuid() primary key,
  provider_id uuid references providers not null,
  participant_id uuid references participants not null,
  participant_name text,
  provider_name text,
  subject text,
  status text default 'active' check (status in ('active', 'closed')),
  messages jsonb default '[]',
  created_at timestamptz default now()
);

-- Bookings
create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  provider_id uuid references providers not null,
  participant_id uuid references participants not null,
  participant_name text,
  provider_name text,
  service text,
  date date,
  time text,
  duration text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  notes text,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security Policies
-- ═══════════════════════════════════════════════════════════════

-- Providers RLS
alter table providers enable row level security;
create policy "Anyone can read providers" on providers for select using (true);
create policy "Owners can update own provider" on providers for update using (auth.uid() = user_id);
create policy "Auth users can insert provider" on providers for insert with check (auth.uid() = user_id);

-- Participants RLS
alter table participants enable row level security;
create policy "Participants can read own" on participants for select using (auth.uid() = user_id);
create policy "Participants can update own" on participants for update using (auth.uid() = user_id);
create policy "Auth users can insert participant" on participants for insert with check (auth.uid() = user_id);

-- Reviews RLS
alter table reviews enable row level security;
create policy "Anyone can read reviews" on reviews for select using (true);
create policy "Participants can insert reviews" on reviews for insert with check (true);
create policy "Provider can respond to own reviews" on reviews for update using (
  exists (select 1 from providers where providers.id = reviews.provider_id and providers.user_id = auth.uid())
);

-- Enquiries RLS
alter table enquiries enable row level security;
create policy "Involved parties can read enquiries" on enquiries for select using (
  exists (select 1 from providers where providers.id = enquiries.provider_id and providers.user_id = auth.uid())
  or exists (select 1 from participants where participants.id = enquiries.participant_id and participants.user_id = auth.uid())
);
create policy "Auth users can insert enquiries" on enquiries for insert with check (true);
create policy "Involved parties can update enquiries" on enquiries for update using (
  exists (select 1 from providers where providers.id = enquiries.provider_id and providers.user_id = auth.uid())
  or exists (select 1 from participants where participants.id = enquiries.participant_id and participants.user_id = auth.uid())
);

-- Bookings RLS
alter table bookings enable row level security;
create policy "Involved parties can read bookings" on bookings for select using (
  exists (select 1 from providers where providers.id = bookings.provider_id and providers.user_id = auth.uid())
  or exists (select 1 from participants where participants.id = bookings.participant_id and participants.user_id = auth.uid())
);
create policy "Auth users can insert bookings" on bookings for insert with check (true);
create policy "Involved parties can update bookings" on bookings for update using (
  exists (select 1 from providers where providers.id = bookings.provider_id and providers.user_id = auth.uid())
  or exists (select 1 from participants where participants.id = bookings.participant_id and participants.user_id = auth.uid())
);
