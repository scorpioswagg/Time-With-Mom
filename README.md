# Time With Mom

**Instant video calling + messaging for the people who matter most.**

Create a room → copy one link → Mom taps it → the call opens. No account, download, or app install.

## Production features

- One-click room creation.
- Admin is taken directly into the room and receives a private admin session cookie.
- Guests open the shared URL directly; there is no required name form.
- Up to 4 participants through Daily.co.
- Browser-native camera/microphone permissions with Daily's call UI.
- Real-time text chat through Supabase Realtime.
- If the admin is not present, guests can leave persistent text, voice, or short video messages.
- Voice/video recordings are limited to 15 seconds.
- Admin can copy the room link and securely end the room.
- Rooms are configured to expire after 24 hours at Daily.
- Responsive desktop/mobile UI.
- Deployable to Vercel.

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS
- Daily.co for WebRTC/video/audio
- Supabase for rooms and persistent messages
- Vercel for hosting

## Required environment variables

Set these locally in `.env.local` and in Vercel Project Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-or-service-role-key
DAILY_API_KEY=your-daily-api-key
```

Never commit real keys.

## Supabase setup

Run the original schema from the SQL in the previous README version, then run:

```text
supabase/production-upgrade.sql
```

That migration adds the private admin token field and enables Supabase Realtime for messages.

For the base schema, the two required tables are:

- `rooms`: room id, Daily room information, active state, creation time, and private admin token.
- `messages`: persistent text/audio/video messages associated with a room.

Because this app intentionally supports no-login guests, message read/insert policies are public. Do not store sensitive information in messages.

## Run locally

```bash
git clone https://github.com/scorpioswagg/Time-With-Mom.git
cd Time-With-Mom
npm install
cp .env.example .env.local
# fill in the four environment variables
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

1. Import `scorpioswagg/Time-With-Mom` into Vercel.
2. Select the `main` branch after the production pull request is merged.
3. Add the four environment variables above.
4. Deploy.
5. Open the generated Vercel URL and click **Create Room**.

Daily camera/microphone access requires HTTPS in production; Vercel provides HTTPS automatically.

## User flow

### Admin

1. Click **Create Room**.
2. The room opens immediately.
3. Click **Copy link**.
4. Send the link to Mom/family.
5. See participants and chat in the room.
6. Click **End room** when finished.

### Guest

1. Tap the shared link.
2. The room opens immediately.
3. Allow camera/microphone access when the browser asks.
4. If the admin is present, join the call.
5. If the admin is away, leave text, voice, or a short video message.

## Important production notes

The app deliberately does not expose the admin token in the shared URL. The browser that creates the room receives an HttpOnly admin cookie, so merely knowing a room URL does not grant the ability to end it.

Daily is responsible for adaptive media quality, echo cancellation, noise suppression, automatic gain control, and the browser-compatible WebRTC transport.

The message media implementation currently stores short recordings as data URLs in the messages table. This keeps deployment simple and avoids another storage service, but for a large public deployment the next upgrade should move recordings to Supabase Storage and keep only their URLs in the database.

## Project structure

```
src/app/page.tsx
src/app/room/[roomId]/page.tsx
src/app/api/rooms/route.ts
src/app/api/rooms/[roomId]/end/route.ts
src/app/api/messages/route.ts
src/lib/daily.ts
src/lib/supabase.ts
supabase/production-upgrade.sql
```

## License

MIT.
