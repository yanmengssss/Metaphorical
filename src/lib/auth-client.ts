"use client";

let accessToken: string | null = null;
let redirectingToLogin = false;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function readAuthorization(): string | null {
  return accessToken ? `Bearer ${accessToken}` : null;
}

export function authenticatedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const authorization = readAuthorization();
  if (authorization) headers.set("Authorization", authorization);
  return fetch(url, { ...init, headers, credentials: "omit" });
}

/** 业务接口遇到未登录或过期凭据时，统一回到 CAS 登录页。 */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const response = await authenticatedFetch(url, init);
  if (response.status === 401) redirectToLogin();
  return response;
}

export function redirectToLogin(): void {
  if (typeof window === "undefined" || redirectingToLogin) return;
  redirectingToLogin = true;
  setAccessToken(null);
  const callback = new URL(window.location.href);
  callback.searchParams.delete("code");
  const userService = (process.env.NEXT_PUBLIC_USER_SERVICE_WEB_URL ?? process.env.NEXT_PUBLIC_USER_LOGIN_URL ?? "http://localhost:4500").replace(/\/+$/u, "");
  const loginUrl = new URL(`${userService}/pc/login`);
  loginUrl.searchParams.set("service", callback.toString());
  window.location.replace(loginUrl.toString());
}

/** 中央退出成功或凭据已失效后，清理本地 token 并返回统一登录页。 */
export async function logout(): Promise<void> {
  const response = await authenticatedFetch("/api/auth/logout", { method: "POST" });
  if (response.status !== 401) {
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.ok !== true) throw new Error("退出登录失败，请稍后重试。");
  }
  setAccessToken(null);
  redirectToLogin();
}
