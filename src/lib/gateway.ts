const gatewayUrl = (process.env.GATEWAY_URL ?? process.env.USER_SERVICE_GATEWAY_URL ?? process.env.USER_SERVICE_API_URL ?? "http://127.0.0.1:4400").replace(/\/+$/u, "");

export async function gatewayFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  return fetch(`${gatewayUrl}${path}`, { ...init, headers, cache: "no-store" });
}

export interface AuthenticatedUser {
  userId: string;
  name: string;
  email?: string;
  avatar?: string | null;
}

interface ApiEnvelope<T> {
  code: number;
  data: T;
  msg: string;
}

export async function getUser(token: string): Promise<AuthenticatedUser | null> {
  const response = await gatewayFetch("/user/api/v1/users", { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null) as ApiEnvelope<Partial<AuthenticatedUser>> | null;
  const user = response.ok && payload?.code === 0 ? payload.data : null;
  return user && typeof user.userId === "string" && typeof user.name === "string" ? user as AuthenticatedUser : null;
}
