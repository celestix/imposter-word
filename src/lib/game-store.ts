import { getRandomWord } from "./words";

export type GamePhase = "lobby" | "playing" | "verdict";

export type Player = {
  id: string;
  name: string;
  score: number;
};

export type Session = {
  id: string;
  players: Player[];
  phase: GamePhase;
  currentRound: number;
  currentWord: string;
  imposterId: string | null;
  votes: Record<string, string>; // playerId -> votedForPlayerId
  verdict: Verdict | null;
  createdAt: number;
};

export type Verdict = {
  imposterId: string;
  imposterName: string;
  votesByPlayer: Record<string, string>;
  voteCounts: Record<string, number>;
  imposterGuessedRight: boolean;
  roundScores: Record<string, number>;
};

// Persist sessions on globalThis so they survive Next.js dev server / HMR reloads
const globalForStore = globalThis as unknown as {
  __imposter_sessions?: Map<string, Session>;
};
const sessions =
  globalForStore.__imposter_sessions ?? new Map<string, Session>();
globalForStore.__imposter_sessions = sessions;

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createSession(): Session {
  const id = generateId();
  const session: Session = {
    id,
    players: [],
    phase: "lobby",
    currentRound: 0,
    currentWord: "",
    imposterId: null,
    votes: {},
    verdict: null,
    createdAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function joinSession(sessionId: string, name: string): Player | null {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== "lobby") return null;
  const player: Player = {
    id: generateId(),
    name: name.trim() || `Player ${session.players.length + 1}`,
    score: 0,
  };
  session.players.push(player);
  return player;
}

export function startGame(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session || session.players.length < 2) return false;
  session.phase = "playing";
  session.currentRound += 1;
  session.votes = {};
  session.verdict = null;
  const imposterIndex = Math.floor(Math.random() * session.players.length);
  session.imposterId = session.players[imposterIndex].id;
  session.currentWord = getRandomWord();
  return true;
}

export function getWordForPlayer(sessionId: string, playerId: string): string {
  const session = sessions.get(sessionId);
  if (!session) return "";
  if (session.imposterId === playerId) return "???";
  return session.currentWord;
}

export function submitVote(sessionId: string, voterId: string, votedForId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== "playing") return false;
  const voter = session.players.find((p) => p.id === voterId);
  const target = session.players.find((p) => p.id === votedForId);
  if (!voter || !target) return false;
  session.votes[voterId] = votedForId;
  if (Object.keys(session.votes).length === session.players.length) {
    computeVerdict(session);
  }
  return true;
}

function computeVerdict(session: Session): void {
  if (!session.imposterId) return;
  const imposter = session.players.find((p) => p.id === session.imposterId)!;
  const voteCounts: Record<string, number> = {};
  for (const p of session.players) {
    voteCounts[p.id] = 0;
  }
  for (const votedForId of Object.values(session.votes)) {
    voteCounts[votedForId] = (voteCounts[votedForId] ?? 0) + 1;
  }
  const imposterGuessedRight = Object.entries(session.votes).some(
    ([voterId, votedForId]) => voterId !== session.imposterId && votedForId === session.imposterId
  );
  const roundScores: Record<string, number> = {};
  for (const p of session.players) {
    roundScores[p.id] = 0;
  }
  for (const [voterId, votedForId] of Object.entries(session.votes)) {
    if (voterId === session.imposterId) continue;
    if (votedForId === session.imposterId) {
      roundScores[voterId] += 1;
    } else {
      roundScores[session.imposterId] += 1;
    }
  }
  if (!imposterGuessedRight) {
    roundScores[session.imposterId] += 2;
  }
  for (const p of session.players) {
    p.score += roundScores[p.id] ?? 0;
  }
  session.verdict = {
    imposterId: session.imposterId,
    imposterName: imposter.name,
    votesByPlayer: { ...session.votes },
    voteCounts,
    imposterGuessedRight,
    roundScores,
  };
  session.phase = "verdict";
}

export function nextRound(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== "verdict") return false;
  session.phase = "playing";
  session.currentRound += 1;
  session.votes = {};
  session.verdict = null;
  const imposterIndex = Math.floor(Math.random() * session.players.length);
  session.imposterId = session.players[imposterIndex].id;
  session.currentWord = getRandomWord();
  return true;
}

export function hasVoted(sessionId: string, playerId: string): boolean {
  const session = sessions.get(sessionId);
  return session ? playerId in session.votes : false;
}

export function allVoted(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  return Object.keys(session.votes).length === session.players.length;
}
