import { NextResponse } from "next/server";
import { startGame } from "@/lib/game-store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = startGame(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Could not start game (need at least 2 players)" },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true });
}
