// Server-side Daily.co helpers (used in API routes)

const DAILY_API_KEY = process.env.DAILY_API_KEY || "";
const DAILY_API_URL = "https://api.daily.co/v1";

export async function createDailyRoom(roomName: string) {
  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: roomName,
      properties: {
        enable_chat: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
        max_participants: 4,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h expiry
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create Daily room: ${err}`);
  }

  return response.json();
}

export async function getDailyRoom(roomName: string) {
  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function deleteDailyRoom(roomName: string) {
  await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
  });
}