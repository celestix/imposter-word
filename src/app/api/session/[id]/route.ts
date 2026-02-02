import { NextResponse } from "next/server";
import { getSession } from "@/lib/game-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const { currentWord: _w, imposterId: _i, ...safe } = session;
  return NextResponse.json(safe);
}
