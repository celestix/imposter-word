import { NextResponse } from "next/server";
import { getSession, getWordForPlayer } from "@/lib/game-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json(
      { error: "playerId required" },
      { status: 400 }
    );
  }
  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.phase !== "playing" && session.phase !== "verdict") {
    return NextResponse.json(
      { error: "Game not in play" },
      { status: 400 }
    );
  }
  const word = getWordForPlayer(id, playerId);
  return NextResponse.json({ word });
}
