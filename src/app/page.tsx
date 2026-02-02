"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [createName, setCreateName] = useState("");
  const [joinSessionId, setJoinSessionId] = useState("");
  const [joinName, setJoinName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create session");
      const sessionId = data.sessionId;
      if (data.player) {
        if (typeof window !== "undefined") {
          const key = `imposter-player-${sessionId}`;
          localStorage.setItem(key, data.player.id);
          localStorage.setItem(`${key}-name`, data.player.name);
        }
        router.push(`/game/${sessionId}`);
      } else {
        router.push(`/game/${sessionId}?host=1`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    setError("");
    const sid = joinSessionId.trim();
    const name = joinName.trim();
    if (!sid || !name) {
      setError("Session ID and name are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/session/${sid}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      if (typeof window !== "undefined") {
        const key = `imposter-player-${sid}`;
        localStorage.setItem(key, data.player.id);
        localStorage.setItem(`${key}-name`, data.player.name);
      }
      router.push(`/game/${sid}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)]">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Imposter Word
        </h1>
        <p className="text-[var(--muted)] mt-2">
          One imposter. One word. Can you find them?
        </p>
      </div>

      {mode === "choose" && (
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={() => setMode("create")}
            className="px-8 py-4 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] transition"
          >
            Create game
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className="px-8 py-4 rounded-xl bg-[var(--card)] text-white font-semibold border border-[var(--muted)] hover:border-[var(--accent)] transition"
          >
            Join game
          </button>
        </div>
      )}

      {mode === "create" && (
        <div className="w-full max-w-sm space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--card)] border border-[var(--muted)] text-white placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create & join"}
            </button>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="px-4 py-3 rounded-lg bg-[var(--card)] text-[var(--muted)]"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {mode === "join" && (
        <div className="w-full max-w-sm space-y-4">
          <input
            type="text"
            placeholder="Session ID"
            value={joinSessionId}
            onChange={(e) => setJoinSessionId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--card)] border border-[var(--muted)] text-white placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <input
            type="text"
            placeholder="Your name"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--card)] border border-[var(--muted)] text-white placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleJoin}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold disabled:opacity-50"
            >
              {loading ? "Joining…" : "Join"}
            </button>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="px-4 py-3 rounded-lg bg-[var(--card)] text-[var(--muted)]"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-[var(--danger)] text-sm max-w-sm text-center">
          {error}
        </p>
      )}
    </main>
  );
}
