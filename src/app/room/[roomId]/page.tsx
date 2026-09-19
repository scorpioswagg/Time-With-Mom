"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import DailyIframe from "@daily-co/daily-js";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Copy,
  Check,
  MessageCircle,
  Send,
  User,
} from "lucide-react";

type RoomData = {
  id: string;
  daily_room_url: string;
  daily_room_name: string;
  name?: string;
};

type Message = {
  id: string;
  room_id: string;
  sender_name: string;
  type: "text" | "video" | "audio";
  content: string;
  created_at: string;
};

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const isAdmin = searchParams.get("admin") === "1";

  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callObject, setCallObject] = useState<any>(null);
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [localAudio, setLocalAudio] = useState(true);
  const [localVideo, setLocalVideo] = useState(true);
  const [name, setName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showLeaveMessage, setShowLeaveMessage] = useState(false);
  const [leaveText, setLeaveText] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("Connecting...");

  // Load room data
  useEffect(() => {
    async function loadRoom() {
      try {
        const res = await fetch(`/api/rooms?id=${roomId}`);
        if (!res.ok) {
          // Room may not exist in DB yet; create a fallback
          setRoom({
            id: roomId,
            daily_room_url: `https://timewithmom.daily.co/twm-${roomId}`,
            daily_room_name: `twm-${roomId}`,
          });
        } else {
          const data = await res.json();
          setRoom(data);
        }
      } catch {
        setRoom({
          id: roomId,
          daily_room_url: `https://timewithmom.daily.co/twm-${roomId}`,
          daily_room_name: `twm-${roomId}`,
        });
      } finally {
        setLoading(false);
      }
    }
    loadRoom();
  }, [roomId]);

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?roomId=${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
  }, [roomId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Join Daily call once name is set and room is ready
  useEffect(() => {
    if (!room || !nameSet || joined) return;

    let call: any;

    async function joinCall() {
      try {
        setStatus("Joining call...");
        call = DailyIframe.createCallObject({
          audioSource: true,
          videoSource: true,
        });

        call.on("joined-meeting", () => {
          setJoined(true);
          setStatus("In call");
          updateParticipantCount(call);
        });

        call.on("participant-joined", () => updateParticipantCount(call));
        call.on("participant-left", () => updateParticipantCount(call));
        call.on("left-meeting", () => {
          setJoined(false);
          setStatus("Left call");
        });

        call.on("error", (e: any) => {
          console.error("Daily error", e);
          setStatus("Connection issue – you can still leave a message");
          setShowLeaveMessage(true);
        });

        await call.join({
          url: room!.daily_room_url,
          userName: name || "Guest",
        });

        setCallObject(call);
      } catch (err) {
        console.error(err);
        setStatus("Could not join video – leave a message instead");
        setShowLeaveMessage(true);
      }
    }

    joinCall();

    return () => {
      if (call) {
        call.destroy();
      }
    };
  }, [room, nameSet, joined, name]);

  function updateParticipantCount(call: any) {
    const count = Object.keys(call.participants() || {}).length;
    setParticipants(count);
    if (count <= 1 && !isAdmin) {
      // Only one person (or none) – offer leave message option after a bit
      setTimeout(() => {
        if (Object.keys(call.participants() || {}).length <= 1) {
          setShowLeaveMessage(true);
        }
      }, 4000);
    }
  }

  const toggleAudio = () => {
    if (!callObject) return;
    callObject.setLocalAudio(!localAudio);
    setLocalAudio(!localAudio);
  };

  const toggleVideo = () => {
    if (!callObject) return;
    callObject.setLocalVideo(!localVideo);
    setLocalVideo(!localVideo);
  };

  const leaveCall = () => {
    if (callObject) {
      callObject.leave();
      callObject.destroy();
    }
    window.location.href = "/";
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    setNewMessage("");
    // Optimistic
    const temp: Message = {
      id: Date.now().toString(),
      room_id: roomId,
      sender_name: name || "Guest",
      type: "text",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          senderName: name || "Guest",
          type: "text",
          content: text,
        }),
      });
    } catch {}
  };

  const leaveMessage = async () => {
    if (!leaveText.trim()) return;
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          senderName: name || "Guest",
          type: "text",
          content: leaveText.trim(),
        }),
      });
      setLeaveText("");
      setShowLeaveMessage(false);
      alert("Message saved! The room owner will see it when they open the room.");
      loadMessages();
    } catch {
      alert("Could not save message. Please try again.");
    }
  };

  const copyRoomLink = async () => {
    const link = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500">Loading room...</p>
        </div>
      </div>
    );
  }

  // Name entry gate (optional but nice)
  if (!nameSet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-rose-50 to-white dark:from-zinc-950 dark:to-zinc-900">
        <div className="max-w-sm w-full space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Join the room
            </h1>
            <p className="text-zinc-500 text-sm">
              Optional – enter a name so others know who you are
            </p>
          </div>
          <input
            type="text"
            placeholder="Your name (or leave blank)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            onKeyDown={(e) => e.key === "Enter" && setNameSet(true)}
            autoFocus
          />
          <button
            onClick={() => setNameSet(true)}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition"
          >
            Continue
          </button>
          <button
            onClick={() => {
              setName("Guest");
              setNameSet(true);
            }}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{name || "Guest"}</p>
            <p className="text-xs text-zinc-400">{status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={copyRoomLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          )}
          <span className="text-xs text-zinc-400">
            {participants} {participants === 1 ? "person" : "people"}
          </span>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative bg-black flex items-center justify-center min-h-[40vh]">
          {joined && callObject ? (
            <div
              id="daily-video-container"
              className="w-full h-full"
              ref={(el) => {
                // Daily attaches its own UI when using createCallObject without iframe
                // For simplicity we use the built-in Daily UI via createFrame in production;
                // here we show status + controls.
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-zinc-500" />
                </div>
                <p className="text-lg font-medium">{name || "You"}</p>
                <p className="text-sm text-zinc-400 mt-1">
                  {participants <= 1
                    ? "Waiting for others to join..."
                    : `${participants} people in the call`}
                </p>
                <p className="text-xs text-zinc-500 mt-4 max-w-xs">
                  Video is active. Use the controls below. Share the link so loved ones can join instantly.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center p-6">
              <p className="text-zinc-400">{status}</p>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 backdrop-blur px-4 py-3 rounded-2xl border border-zinc-700">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition ${
                localAudio
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-red-600 hover:bg-red-500"
              }`}
              title={localAudio ? "Mute" : "Unmute"}
            >
              {localAudio ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition ${
                localVideo
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-red-600 hover:bg-red-500"
              }`}
              title={localVideo ? "Turn camera off" : "Turn camera on"}
            >
              {localVideo ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={leaveCall}
              className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition"
              title="Leave call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar: Chat + Messages */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col bg-zinc-900 max-h-[50vh] lg:max-h-none">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-rose-400" />
            <span className="font-medium text-sm">Messages</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-6">
                No messages yet. Say hi!
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-rose-400">
                    {m.sender_name}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-zinc-200 break-words">{m.content}</p>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                onClick={sendChatMessage}
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leave a message modal / panel when alone */}
      {showLeaveMessage && participants <= 1 && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold">No one is here yet</h2>
            <p className="text-sm text-zinc-400">
              Leave a message for when they open the room. They&apos;ll see it right away.
            </p>
            <textarea
              value={leaveText}
              onChange={(e) => setLeaveText(e.target.value)}
              placeholder="Hi Mom, just thinking of you..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={leaveMessage}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-medium text-sm"
              >
                Save message
              </button>
              <button
                onClick={() => setShowLeaveMessage(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm"
              >
                Keep waiting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}