import { NextResponse } from "next/server";
import { createSession, joinSession } from "@/lib/game-store";

export async function POST(request: Request) {
  const session = createSession();
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  let player = null;
  if (name) {
    player = joinSession(session.id, name);
  }
  const { currentWord: _w, imposterId: _i, ...safe } = session;
  return NextResponse.json({
    sessionId: session.id,
    session: safe,
    player: player ?? undefined,
  });
}
