import { NextResponse } from "next/server";
import { submitKickVote } from "@/lib/game-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const playerId = body.playerId;
  const targetId = body.targetId;
  if (!playerId || !targetId) {
    return NextResponse.json(
      { error: "playerId and targetId required" },
      { status: 400 }
    );
  }
  const ok = submitKickVote(id, playerId, targetId);
  if (!ok) {
    return NextResponse.json(
      { error: "Could not submit kick vote" },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true });
}

