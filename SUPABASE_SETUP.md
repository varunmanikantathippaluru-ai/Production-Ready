# Supabase Setup Guide for IntelliDocs AI

## 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) → New Project.

## 2. Create the Database Tables

Go to **SQL Editor** in your Supabase dashboard and run the following SQL:

```sql
-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  preferred_language text default 'en',
  dark_mode boolean default false,
  email_notifications boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  file_type text not null,
  file_size bigint not null default 0,
  storage_path text not null,
  content text,
  page_count integer,
  status text default 'ready' check (status in ('pending', 'processing', 'ready', 'error')),
  conversation_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =============================================
-- CONVERSATIONS TABLE
-- =============================================
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  document_id uuid references public.documents on delete cascade not null,
  title text not null default 'New Conversation',
  message_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =============================================
-- MESSAGES TABLE
-- =============================================
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Service role bypass" on public.profiles
  for all using (true);

-- Documents policies
create policy "Users can manage own documents" on public.documents
  for all using (auth.uid() = user_id);

-- Conversations policies
create policy "Users can manage own conversations" on public.conversations
  for all using (auth.uid() = user_id);

-- Messages policies
create policy "Users can manage messages in own conversations" on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 3. Create Storage Bucket

Go to **Storage** in your Supabase dashboard:

1. Click **Create Bucket**
2. Name: `documents`
3. Make it **Private**
4. Click **Save**

Then add this storage policy (SQL Editor):

```sql
-- Allow service role to manage all objects (backend uses service role)
create policy "Service role full access"
  on storage.objects for all
  using (bucket_id = 'documents');
```

## 4. Configure Authentication

Go to **Authentication** → **Providers**:

- **Email**: Enable email/password + email confirmation
- **Google**: Enable and add your Google OAuth credentials
  - Create credentials at [console.cloud.google.com](https://console.cloud.google.com)
  - Add redirect URL: `https://<your-supabase-project>.supabase.co/auth/v1/callback`

## 5. Environment Variables

Your Replit project already has these secrets configured:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

The frontend uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` which are automatically
injected from your Supabase secrets via the Vite config.

## 6. Google Gemini API

Get your API key at [aistudio.google.com](https://aistudio.google.com/app/apikey).
Already configured as `GEMINI_API_KEY` in your Replit secrets.
