# Time With Mom

**Instant video calling + messaging.** No accounts. No downloads. Just a link.

Create a room → share the link → anyone who clicks joins the video call immediately (or can leave a message if no one is there yet).

Built for the people who matter most.

---

## Features

- **One-click room creation** – Admin gets a shareable link instantly
- **Zero-friction join** – Guests click the link and are ready to talk (optional name only)
- **High-quality video calls** for up to 4 people (Daily.co – adaptive bitrate, noise suppression, echo cancellation)
- **Real-time text chat** while in the room
- **Leave a message** when the room is empty (text + optional short audio recording)
- Fully responsive, works on mobile & desktop
- Modern browsers only (Chrome, Safari, Firefox, Edge) – no plugins

---

## Tech Stack

| Layer              | Technology                         |
|--------------------|------------------------------------|
| Frontend           | Next.js 15 (App Router) + Tailwind |
| Video              | Daily.co                           |
| Database / Realtime| Supabase                           |
| Hosting            | Vercel                             |

---

## Environment Variables

Create a `.env.local` (or set these in Vercel):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # or legacy anon key
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...            # or legacy service_role key
DAILY_API_KEY=your-daily-api-key
```

### How to get the keys

**Supabase**
1. Go to [supabase.com](https://supabase.com) → create a project
2. Project Settings → **API Keys**
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (or legacy **anon** key) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Secret key** (or legacy **service_role** key) → `SUPABASE_SERVICE_ROLE_KEY`

**Daily.co**
1. Go to [dashboard.daily.co](https://dashboard.daily.co) and sign up
2. Left sidebar → **Developers**
3. Copy the API key → `DAILY_API_KEY`

---

## Supabase Database Setup

Go to **SQL Editor** in your Supabase project and run:

```sql
-- Rooms table
create table if not exists public.rooms (
  id text primary key,
  name text,
  daily_room_name text not null,
  daily_room_url text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text references public.rooms(id) on delete cascade,
  sender_name text not null default 'Guest',
  type text not null default 'text' check (type in ('text', 'video', 'audio')),
  content text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.rooms enable row level security;
alter table public.messages enable row level security;

-- Open policies (suitable for this personal app)
create policy "Allow all on rooms" on public.rooms
  for all using (true) with check (true);

create policy "Allow all on messages" on public.messages
  for all using (true) with check (true);
```

---

## Local Development

```bash
git clone https://github.com/scorpioswagg/Time-With-Mom.git
cd Time-With-Mom
npm install
cp .env.example .env.local
# → fill in the four values above
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. **Add New Project** → Import `scorpioswagg/Time-With-Mom`
3. Add the four environment variables listed above
4. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`

---

## How to use

### Admin (you)
1. Open the homepage
2. Click **Create Room**
3. Copy the link that appears (or the app takes you straight into the room)
4. Share the link via text / WhatsApp / email

### Guest (Mom, family, friends)
1. Click the shared link
2. Optionally type a name → Continue
3. If someone is already in the room → they join the live video call immediately
4. If the room is empty → they can leave a text (or short audio) message that you will see when you open the room later

### In-call controls
- Mute / Unmute microphone
- Camera On / Off
- Leave Call
- Real-time text chat in the sidebar

---

## Project structure

```
src/
  app/
    page.tsx                 # Landing page – Create Room
    room/[roomId]/page.tsx  # Join / video / messages
    api/
      rooms/route.ts         # Create & fetch rooms
      messages/route.ts      # Save & load messages
  lib/
    daily.ts                 # Daily.co helpers
    supabase.ts              # Supabase client + types
    utils.ts
```

---

## Notes

- Max 4 participants is enforced by Daily room settings
- Rooms expire after 24 hours by default
- Free Daily plan includes 10,000 participant-minutes / month
- Free Supabase plan is more than enough for personal use

---

## License

MIT – made with love for the people who raised us.
