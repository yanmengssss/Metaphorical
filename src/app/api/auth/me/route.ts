import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  return user ? NextResponse.json({ user }) : NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
}
