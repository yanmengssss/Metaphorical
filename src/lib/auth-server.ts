import { getUser, type AuthenticatedUser } from "@/lib/gateway";

export function readBearerToken(request: Request): string | null {
  return request.headers.get("authorization")?.trim().match(/^Bearer\s+(\S+)$/iu)?.[1] ?? null;
}

export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  const token = readBearerToken(request);
  return token ? getUser(token) : null;
}
