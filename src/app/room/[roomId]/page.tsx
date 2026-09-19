"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import DailyIframe from "@daily-co/daily-js";
import {
  Copy,
  Check,
  MessageCircle,
  Send,
  User,
  X,
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
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [name, setName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showLeaveMessage, setShowLeaveMessage] = useState(false);
  const [leaveText, setLeaveText] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("Connecting...");
  const [showChat, setShowChat] = useState(true);

  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load room data
  useEffect(() => {
    async function loadRoom() {
      try {
        const res = await fetch(`/api/rooms?id=${roomId}`);
        if (!res.ok) {
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
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Create and join Daily frame once name is set
  useEffect(() => {
    if (!room || !nameSet || !containerRef.current || callFrameRef.current) return;

    let frame: any;

    async function startCall() {
      try {
        setStatus("Joining call...");

        frame = DailyIframe.createFrame(containerRef.current!, {
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "0",
            borderRadius: "0",
          },
          showLeaveButton: true,
          showFullscreenButton: true,
          activeSpeakerMode: false,
        });

        callFrameRef.current = frame;

        frame.on("joined-meeting", (event: any) => {
          setJoined(true);
          setStatus("In call");
          const count = Object.keys(event?.participants || frame.participants() || {}).length;
          setParticipants(count || 1);
        });

        frame.on("participant-joined", () => {
          const p = frame.participants();
          setParticipants(Object.keys(p || {}).length);
        });

        frame.on("participant-left", () => {
          const p = frame.participants();
          const count = Object.keys(p || {}).length;
          setParticipants(count);
          if (count <= 1) {
            setTimeout(() => setShowLeaveMessage(true), 3000);
          }
        });

        frame.on("left-meeting", () => {
          setJoined(false);
          setStatus("Left call");
          window.location.href = "/";
        });

        frame.on("error", (e: any) => {
          console.error("Daily error", e);
          setStatus("Connection issue – you can still leave a message");
          setShowLeaveMessage(true);
        });

        await frame.join({
          url: room!.daily_room_url,
          userName: name || "Guest",
        });
      } catch (err) {
        console.error(err);
        setStatus("Could not join video – leave a message instead");
        setShowLeaveMessage(true);
      }
    }

    startCall();

    return () => {
      if (frame) {
        try {
          frame.destroy();
        } catch {}
      }
      callFrameRef.current = null;
    };
  }, [room, nameSet, name]);

  const sendChatMessage = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    setNewMessage("");
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
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur z-10">
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
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 lg:hidden"
            title="Toggle chat"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-400 hidden sm:inline">
            {participants} {participants === 1 ? "person" : "people"}
          </span>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Video container – Daily iframe lives here */}
        <div className="flex-1 relative bg-black min-h-[50vh] lg:min-h-0">
          <div ref={containerRef} className="absolute inset-0 w-full h-full" />
          {!joined && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-10 pointer-events-none">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-zinc-300">{status}</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        <div
          className={`${
            showChat ? "flex" : "hidden"
          } lg:flex w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 flex-col bg-zinc-900 max-h-[45vh] lg:max-h-none`}
        >
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-rose-400" />
              <span className="font-medium text-sm">Messages</span>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="lg:hidden p-1 text-zinc-400"
            >
              <X className="w-4 h-4" />
            </button>
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

      {/* Leave a message when alone */}
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