import { NextResponse } from "next/server";
import { submitVote } from "@/lib/game-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const playerId = body.playerId;
  const votedForId = body.votedForId;
  if (!playerId || !votedForId) {
    return NextResponse.json(
      { error: "playerId and votedForId required" },
      { status: 400 }
    );
  }
  const ok = submitVote(id, playerId, votedForId);
  if (!ok) {
    return NextResponse.json(
      { error: "Could not submit vote" },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true });
}
