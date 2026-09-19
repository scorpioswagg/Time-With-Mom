import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Room = {
  id: string;
  created_at: string;
  name?: string;
  daily_room_name: string;
  daily_room_url: string;
  is_active: boolean;
};

export type Message = {
  id: string;
  room_id: string;
  sender_name: string;
  type: "text" | "video" | "audio";
  content: string; // text or storage path / public URL
  created_at: string;
};