-- NexaConnect Supabase Setup
-- Run this in your Supabase SQL Editor (supabase.com > SQL Editor)

-- User profiles table
create table user_profiles (
  id uuid references auth.users primary key,
  email text,
  name text,
  role text check (role in ('participant', 'provider', 'admin')),
  tier text default 'free',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table user_profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on user_profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- Users can insert their own profile (on registration)
create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);
