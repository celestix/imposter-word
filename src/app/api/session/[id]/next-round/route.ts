import { NextResponse } from "next/server";
import { nextRound } from "@/lib/game-store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = nextRound(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Could not start next round (must be in verdict phase)" },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true });
}
