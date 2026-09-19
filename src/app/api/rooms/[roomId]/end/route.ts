import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { deleteDailyRoom } from "@/lib/daily";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");

export async function POST(_request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const token = (await cookies()).get(`twm_admin_${roomId}`)?.value;
  if (!token) return NextResponse.json({ error: "Only the room creator can end this room." }, { status: 403 });
  const { data: room, error } = await supabase.from("rooms").select("daily_room_name,admin_token").eq("id", roomId).single();
  if (error || !room || room.admin_token !== token) return NextResponse.json({ error: "Only the room creator can end this room." }, { status: 403 });
  await supabase.from("rooms").update({ is_active: false }).eq("id", roomId);
  await deleteDailyRoom(room.daily_room_name);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(`twm_admin_${roomId}`, "", { httpOnly: true, expires: new Date(0), path: `/room/${roomId}` });
  return response;
}