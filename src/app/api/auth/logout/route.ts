import { NextResponse } from "next/server";
import { readBearerToken } from "@/lib/auth-server";
import { gatewayFetch } from "@/lib/gateway";

/** 经网关撤销中央登录态，页面仅在成功或 401 后清除凭据。 */
export async function POST(request: Request) {
  const token = readBearerToken(request);
  if (!token) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  try {
    const response = await gatewayFetch("/user/api/v1/users/logout", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 401) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.code !== 0 || body.data !== null) {
      return NextResponse.json({ error: "LOGOUT_SERVICE_FAILED" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "LOGOUT_SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
