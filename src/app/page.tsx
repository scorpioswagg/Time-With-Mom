"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Heart, Video, MessageCircle } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roomLink, setRoomLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Time With Mom" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create room");
      }

      const data = await res.json();
      const link = `${window.location.origin}/room/${data.id}`;
      setRoomLink(link);

      // Automatically navigate admin into the room after a short delay
      // so they can copy the link first if they want
      setTimeout(() => {
        router.push(`/room/${data.id}?admin=1`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!roomLink) return;
    await navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-rose-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 mb-2">
            <Heart className="w-8 h-8" fill="currentColor" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Time With Mom
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Instant video calls & messages. No accounts. No downloads. Just love.
          </p>
        </div>

        {!roomLink ? (
          <div className="space-y-4">
            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full py-4 px-8 text-lg font-semibold rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 dark:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating room...
                </>
              ) : (
                <>
                  <Video className="w-6 h-6" />
                  Create Room
                </>
              )}
            </button>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <Video className="w-5 h-5 text-rose-500 mb-2" />
                <h3 className="font-medium text-zinc-900 dark:text-white">Video Call</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Up to 4 people. Crystal clear video & audio.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <MessageCircle className="w-5 h-5 text-rose-500 mb-2" />
                <h3 className="font-medium text-zinc-900 dark:text-white">Leave Messages</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Guests can leave text, video or audio when you&apos;re away.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-6 rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-100 dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
              Your room is ready
            </p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
              <code className="flex-1 text-sm text-left truncate text-zinc-800 dark:text-zinc-200">
                {roomLink}
              </code>
              <button
                onClick={copyLink}
                className="shrink-0 p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                title="Copy link"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                )}
              </button>
            </div>
            <p className="text-sm text-zinc-500">
              Share this link. Anyone who clicks it joins instantly.
              <br />
              Taking you into the room...
            </p>
          </div>
        )}

        <p className="text-xs text-zinc-400 pt-8">
          Works in Chrome, Safari, Firefox & Edge · No install required
        </p>
      </div>
    </main>
  );
}