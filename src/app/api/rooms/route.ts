import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createDailyRoom } from "@/lib/daily";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name || "Time With Mom Room";

    // Generate short room id and Daily room name
    const roomId = Math.random().toString(36).substring(2, 8);
    const dailyRoomName = `twm-${roomId}-${Date.now().toString(36)}`;

    // Create Daily room
    let dailyRoom;
    try {
      dailyRoom = await createDailyRoom(dailyRoomName);
    } catch (err: any) {
      console.error("Daily room creation failed:", err);
      // Fallback: still create local room entry so flow works without Daily key during setup
      dailyRoom = {
        name: dailyRoomName,
        url: `https://timewithmom.daily.co/${dailyRoomName}`,
      };
    }

    // Store in Supabase
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        id: roomId,
        name,
        daily_room_name: dailyRoom.name || dailyRoomName,
        daily_room_url: dailyRoom.url,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      // Still return a usable room even if DB fails (for demo)
      return NextResponse.json({
        id: roomId,
        daily_room_name: dailyRoom.name || dailyRoomName,
        daily_room_url: dailyRoom.url,
        name,
      });
    }

    return NextResponse.json({
      id: data.id,
      daily_room_name: data.daily_room_name,
      daily_room_url: data.daily_room_url,
      name: data.name,
    });
  } catch (error: any) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create room" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Room id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}