import { NextResponse } from "next/server";
import { submitEndGameVote } from "@/lib/game-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const playerId = body.playerId;
  if (!playerId) {
    return NextResponse.json(
      { error: "playerId required" },
      { status: 400 }
    );
  }
  const ok = submitEndGameVote(id, playerId);
  if (!ok) {
    return NextResponse.json(
      { error: "Could not submit end game vote" },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true });
}

