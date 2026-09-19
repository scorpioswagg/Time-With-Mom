-- Run once in Supabase SQL Editor.
alter table public.rooms add column if not exists admin_token text;
do $$ begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end $$;
alter table public.messages enable row level security;
drop policy if exists "Allow all on messages" on public.messages;
create policy "Allow public message reads" on public.messages for select using (true);
create policy "Allow public message inserts" on public.messages for insert with check (true);
