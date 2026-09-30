import { NextResponse } from "next/server";
import { gatewayFetch, getUser } from "@/lib/gateway";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { code } = await request.json() as { code?: unknown };
    if (typeof code !== "string" || !code.trim()) return NextResponse.json({ error: "INVALID_CAS_CODE" }, { status: 422 });
    const response = await gatewayFetch("/user/api/v1/users/cas/token", { method: "POST", body: JSON.stringify({ code: code.trim() }) });
    const result = await response.json().catch(() => null) as { code?: number; data?: { token?: string }; msg?: string } | null;
    if (!response.ok || result?.code !== 0 || !result.data?.token) return NextResponse.json({ error: result?.msg ?? "INVALID_CAS_CODE" }, { status: response.status || 401 });
    const user = await getUser(result.data.token);
    if (!user) return NextResponse.json({ error: "INVALID_ACCESS_TOKEN" }, { status: 401 });
    return NextResponse.json({ user, token: result.data.token }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to exchange CAS code", error);
    return NextResponse.json({ error: "CAS_SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
