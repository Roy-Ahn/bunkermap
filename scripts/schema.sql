-- Create the bunkers table
create table public.bunkers (
  id text primary key,
  title text not null,
  location text not null,
  lat numeric not null,
  lng numeric not null,
  description text,
  status text,
  depth text,
  capacity text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.bunkers enable row level security;

-- Allow public read access (for the frontend app)
create policy "Public bunkers are viewable by everyone"
  on public.bunkers for select
  using ( true );

-- Restrict everything else to service role / authenticated users as needed

-- Temporary policy to allow seeding script to work with the anon key
create policy "Public bunkers are insertable by everyone"
  on public.bunkers for insert
  with check ( true );
