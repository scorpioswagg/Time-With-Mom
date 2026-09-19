# Time With Mom

**Instant video calling + messaging.** No accounts. No downloads. Just a link.

Create a room → share the link → anyone who clicks joins the video call immediately (or can leave a message if no one is there yet).

Built for the people who matter most.

---

## Features

- **One-click room creation** – Admin gets a shareable link instantly
- **Zero-friction join** – Guests click the link and are ready to talk (optional name only)
- **Video calls** for up to 4 people (Daily.co powered – high quality, adaptive bitrate, noise suppression)
- **Real-time text chat** while in the room
- **Leave a message** when the room is empty (text; video/audio can be extended)
- Fully responsive, works on mobile & desktop
- Modern browsers only (Chrome, Safari, Firefox, Edge) – no plugins

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | Next.js 15 (App Router) + Tailwind  |
| Video        | Daily.co                            |
| Database / Realtime | Supabase                       |
| Hosting      | Vercel                              |

---

## Quick Start (Local)

### 1. Clone & install

```bash
git clone https://github.com/scorpioswagg/Time-With-Mom.git
cd Time-With-Mom
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in the values (see below for how to get them).

### 3. Supabase setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run this schema:

```sql
-- Rooms table
create table public.rooms (
  id text primary key,
  name text,
  daily_room_name text not null,
  daily_room_url text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text references public.rooms(id) on delete cascade,
  sender_name text not null default 'Guest',
  type text not null default 'text' check (type in ('text', 'video', 'audio')),
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS (optional but recommended)
alter table public.rooms enable row level security;
alter table public.messages enable row level security;

-- Allow public read/write for simplicity (tighten later if needed)
create policy "Allow all on rooms" on public.rooms for all using (true) with check (true);
create policy "Allow all on messages" on public.messages for all using (true) with check (true);
```

3. Copy **Project URL** and **anon key** + **service_role key** into `.env.local`.

### 4. Daily.co setup

1. Sign up at [daily.co](https://www.daily.co)
2. Create an API key in the dashboard
3. Put it in `.env.local` as `DAILY_API_KEY`

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel (one-click)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project** → Import `scorpioswagg/Time-With-Mom`
3. In **Environment Variables**, add:

   | Name                         | Value                          |
   |------------------------------|--------------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL`   | your Supabase project URL      |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key      |
   | `SUPABASE_SERVICE_ROLE_KEY`  | your Supabase service_role key |
   | `DAILY_API_KEY`              | your Daily.co API key          |

4. Click **Deploy**

That’s it. Your app will be live at `https://your-project.vercel.app`

---

## How it works

### Admin (room creator)
1. Open the homepage
2. Click **Create Room**
3. Copy the generated link (or the app will take you into the room automatically)
4. Share the link via text, email, WhatsApp, etc.

### Guest
1. Click the shared link
2. Optionally enter a name → Continue
3. Instantly join the live video call if someone is already there
4. If the room is empty → friendly prompt to leave a text message that the admin will see later

### Controls
- Mute / Unmute mic
- Camera on / off
- Leave call
- Real-time chat sidebar

---

## Project structure

```
src/
  app/
    page.tsx              # Landing – Create Room
    room/[roomId]/page.tsx # Join / video / messages
    api/
      rooms/route.ts      # Create & fetch rooms
      messages/route.ts   # Save & load messages
  lib/
    daily.ts              # Daily.co API helpers
    supabase.ts           # Supabase client + types
    utils.ts
```

---

## Notes & limitations

- Video quality and features depend on your Daily.co plan (free tier is excellent for personal use).
- Max 4 participants is enforced via Daily room properties.
- Messages currently support text. Video/audio message recording can be added later with MediaRecorder + Supabase Storage.
- Rooms expire after 24 hours by default (configurable in `src/lib/daily.ts`).

---

## License

MIT – made with love for the people who raised us.
