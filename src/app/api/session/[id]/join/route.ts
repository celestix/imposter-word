import { NextResponse } from "next/server";
import { joinSession } from "@/lib/game-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name : "";
  const player = joinSession(id, name);
  if (!player) {
    return NextResponse.json(
      { error: "Could not join session (not in lobby or invalid id)" },
      { status: 400 }
    );
  }
  return NextResponse.json({ player });
}
