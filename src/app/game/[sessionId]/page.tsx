"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

type Player = { id: string; name: string; score: number };
type Verdict = {
  imposterId: string;
  imposterName: string;
  votesByPlayer: Record<string, string>;
  voteCounts: Record<string, number>;
  imposterGuessedRight: boolean;
  roundScores: Record<string, number>;
};
type Session = {
  id: string;
  players: Player[];
  phase: "lobby" | "playing" | "verdict";
  currentRound: number;
  votes: Record<string, string>;
  verdict: Verdict | null;
};

const POLL_MS = 2000;

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const isHost = searchParams.get("host") === "1";

  const [session, setSession] = useState<Session | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [hostName, setHostName] = useState("");
  const [joining, setJoining] = useState(false);
  const [word, setWord] = useState<string | null>(null);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [nextRoundLoading, setNextRoundLoading] = useState(false);
  const [error, setError] = useState("");

  const storageKey = sessionId ? `imposter-player-${sessionId}` : "";
  const nameKey = sessionId ? `${storageKey}-name` : "";

  const loadStoredPlayer = useCallback(() => {
    if (typeof window === "undefined" || !storageKey) return;
    const id = localStorage.getItem(storageKey);
    const name = localStorage.getItem(nameKey);
    if (id) setPlayerId(id);
    if (name) setPlayerName(name);
  }, [storageKey, nameKey]);

  useEffect(() => {
    loadStoredPlayer();
  }, [loadStoredPlayer]);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/session/${sessionId}`);
      if (!res.ok) {
        if (res.status === 404) setSession(null);
        return;
      }
      const data = await res.json();
      setSession(data);
    } catch {
      setSession(null);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
    const t = setInterval(fetchSession, POLL_MS);
    return () => clearInterval(t);
  }, [fetchSession]);

  const fetchWord = useCallback(async () => {
    if (!sessionId || !playerId || session?.phase !== "playing") return;
    try {
      const res = await fetch(
        `/api/session/${sessionId}/word?playerId=${encodeURIComponent(playerId)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setWord(data.word ?? "");
    } catch {
      setWord(null);
    }
  }, [sessionId, playerId, session?.phase]);

  useEffect(() => {
    if (session?.phase === "playing" && playerId) {
      fetchWord();
    } else {
      setWord(null);
    }
  }, [session?.phase, sessionId, playerId, fetchWord]);

  async function handleHostJoin() {
    setError("");
    const name = hostName.trim() || "Host";
    setJoining(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      localStorage.setItem(storageKey, data.player.id);
      localStorage.setItem(nameKey, data.player.name);
      setPlayerId(data.player.id);
      setPlayerName(data.player.name);
      await fetchSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setJoining(false);
    }
  }

  async function handleStartGame() {
    setError("");
    setStarting(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/start`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start");
      }
      await fetchSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setStarting(false);
    }
  }

  async function handleVote() {
    if (!selectedVote || selectedVote === playerId) return;
    setError("");
    setVoting(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, votedForId: selectedVote }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to vote");
      }
      await fetchSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setVoting(false);
    }
  }

  async function handleNextRound() {
    setError("");
    setNextRoundLoading(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/next-round`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start next round");
      }
      setSelectedVote(null);
      await fetchSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setNextRoundLoading(false);
    }
  }

  const hasVoted = session && playerId && playerId in session.votes;
  const otherPlayers = session?.players.filter((p) => p.id !== playerId) ?? [];
  const votedForId = session?.votes[playerId ?? ""];
  const votedForName = votedForId
    ? session?.players.find((p) => p.id === votedForId)?.name
    : null;
  const verdict = session?.verdict;

  if (!sessionId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-[var(--muted)]">Invalid session</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-[var(--bg)]">
        <p className="text-[var(--muted)] text-center max-w-sm">
          Session not found. The ID may be wrong, or the session may have been
          cleared (e.g. after a server restart in development).
        </p>
        <a
          href="/"
          className="text-[var(--accent)] hover:underline font-medium"
        >
          ← Create or join a game
        </a>
      </main>
    );
  }

  if (isHost && !playerId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)]">
        <div className="w-full max-w-sm space-y-6">
          <div className="rounded-xl bg-[var(--card)] p-6 border border-[var(--muted)]">
            <p className="text-[var(--muted)] text-sm mb-1">Share this session ID</p>
            <p className="text-2xl font-mono font-bold text-white tracking-wider break-all">
              {sessionId}
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your name"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--card)] border border-[var(--muted)] text-white placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              type="button"
              onClick={handleHostJoin}
              disabled={joining}
              className="w-full px-4 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold disabled:opacity-50"
            >
              {joining ? "Joining…" : "Join as host"}
            </button>
          </div>
          {error && <p className="text-[var(--danger)] text-sm">{error}</p>}
        </div>
      </main>
    );
  }

  if (!playerId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-[var(--muted)]">Join from the home page with this session ID.</p>
      </main>
    );
  }

  const inLobby = session.phase === "lobby";
  const playing = session.phase === "playing";
  const showVerdict = session.phase === "verdict";

  return (
    <main className="min-h-screen p-6 bg-[var(--bg)]">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="grid grid-cols-3 items-center gap-4">
          <a href="/" className="text-[var(--muted)] hover:text-white text-sm">
            ← Home
          </a>
          <h1 className="text-xl font-bold text-white text-center">
            Imposter Word
          </h1>
          <p className="text-[var(--muted)] text-sm text-right">
            {playerName} · Round {session.currentRound || 0}
          </p>
        </header>

        {inLobby && (
          <div className="rounded-xl bg-[var(--card)] p-6 border border-[var(--muted)] space-y-6">
            <div>
              <p className="text-[var(--muted)] text-sm mb-1">Session ID (share so others can join)</p>
              <p className="font-mono text-lg text-white break-all">{sessionId}</p>
            </div>
            <div>
              <p className="text-[var(--muted)] text-sm mb-2">Players ({session.players.length})</p>
              <ul className="space-y-1">
                {session.players.map((p) => (
                  <li key={p.id} className="text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    {p.name}
                    {p.id === playerId && (
                      <span className="text-xs text-[var(--muted)]">(you)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={handleStartGame}
              disabled={session.players.length < 2 || starting}
              className="w-full px-4 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {starting ? "Starting…" : "Start game"}
            </button>
          </div>
        )}

        {playing && (
          <>
            <div className="rounded-xl bg-[var(--card)] p-8 border border-[var(--muted)] text-center">
              <p className="text-[var(--muted)] text-sm mb-2">Your word</p>
              <p className="text-4xl font-bold text-white tracking-wide">
                {word === null ? "…" : word}
              </p>
              {word === "???" && (
                <p className="text-[var(--muted)] text-sm mt-2">
                  You are the imposter. Guess the word from others&apos; hints.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-[var(--card)] p-6 border border-[var(--muted)]">
              <p className="text-[var(--muted)] text-sm mb-3">Vote for who you think is the imposter</p>
              <div className="space-y-2">
                {otherPlayers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedVote(p.id)}
                    disabled={hasVoted}
                    className={`w-full px-4 py-3 rounded-lg text-left font-medium transition ${
                      selectedVote === p.id
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg)] text-white border border-[var(--muted)] hover:border-[var(--accent)]"
                    } ${hasVoted ? "opacity-70 cursor-default" : ""}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {!hasVoted && selectedVote && (
                <button
                  type="button"
                  onClick={handleVote}
                  disabled={voting}
                  className="mt-4 w-full px-4 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold disabled:opacity-50"
                >
                  {voting ? "Submitting…" : "Submit vote"}
                </button>
              )}
              {hasVoted && (
                <p className="mt-3 text-[var(--muted)] text-sm">
                  You voted for {votedForName ?? "…"}. Waiting for others…
                </p>
              )}
            </div>
          </>
        )}

        {showVerdict && verdict && (
          <div className="rounded-xl bg-[var(--card)] p-6 border border-[var(--muted)] space-y-6">
            <div className="text-center">
              <p className="text-[var(--muted)] text-sm">The imposter was</p>
              <p className="text-2xl font-bold text-[var(--danger)] mt-1">
                {verdict.imposterName}
              </p>
              <p className="text-[var(--muted)] text-sm mt-2">
                {verdict.imposterGuessedRight
                  ? "They were caught!"
                  : "Nobody guessed right. +2 for the imposter."}
              </p>
            </div>
            <div>
              <p className="text-[var(--muted)] text-sm mb-2">Round scores</p>
              <ul className="space-y-1">
                {session.players.map((p) => (
                  <li key={p.id} className="flex justify-between text-white">
                    <span>
                      {p.name}
                      {p.id === playerId && " (you)"}
                    </span>
                    <span className="font-mono">
                      +{verdict.roundScores[p.id] ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[var(--muted)] text-sm mb-2">Total scores</p>
              <ul className="space-y-1">
                {session.players.map((p) => (
                  <li key={p.id} className="flex justify-between text-white">
                    <span>{p.name}{p.id === playerId && " (you)"}</span>
                    <span className="font-mono font-semibold">{p.score}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={handleNextRound}
              disabled={nextRoundLoading}
              className="w-full px-4 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold disabled:opacity-50"
            >
              {nextRoundLoading ? "Starting…" : "Next round"}
            </button>
          </div>
        )}

        {error && (
          <p className="text-[var(--danger)] text-sm text-center">{error}</p>
        )}
      </div>
    </main>
  );
}
