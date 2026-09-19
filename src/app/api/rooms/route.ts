import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { createDailyRoom } from "@/lib/daily";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name || "Time With Mom Room";
    const roomId = randomBytes(5).toString("hex");
    const adminToken = randomBytes(32).toString("hex");
    const dailyRoomName = `twm-${roomId}-${Date.now().toString(36)}`;
    const dailyRoom = await createDailyRoom(dailyRoomName);
    const { data, error } = await supabase.from("rooms").insert({
      id: roomId, name, daily_room_name: dailyRoom.name || dailyRoomName,
      daily_room_url: dailyRoom.url, admin_token: adminToken, is_active: true
    }).select().single();
    if (error) throw new Error(`Database error: ${error.message}`);
    const response = NextResponse.json({ id: data.id, daily_room_name: data.daily_room_name, daily_room_url: data.daily_room_url, name: data.name });
    response.cookies.set(`twm_admin_${roomId}`, adminToken, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: `/room/${roomId}`, maxAge: 60 * 60 * 24 * 30
    });
    return response;
  } catch (error: any) {
    console.error("Create room error:", error);
    return NextResponse.json({ error: error.message || "Failed to create room" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Room id required" }, { status: 400 });
  const { data, error } = await supabase.from("rooms").select("id,name,daily_room_name,daily_room_url,is_active,created_at").eq("id", id).single();
  if (error || !data || !data.is_active) return NextResponse.json({ error: "Room not found or ended" }, { status: 404 });
  return NextResponse.json(data);
}