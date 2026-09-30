"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch, redirectToLogin, setAccessToken } from "@/lib/auth-client";
import { readHarnessOrigin } from "@/lib/harness-origin";
import { HarnessProjectContextBridge, type HarnessBridgeUser } from "@/components/HarnessProjectContextBridge";

/** 初始化 CAS 会话；未认证与任一后续 401 均回到统一登录。 */
export function AuthSessionGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<HarnessBridgeUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function loadSession(): Promise<HarnessBridgeUser | null> {
      readHarnessOrigin();
      const currentUrl = new URL(window.location.href);
      const code = currentUrl.searchParams.get("code");
      if (code) {
        try {
          const exchange = await authenticatedFetch("/api/auth/cas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          if (!exchange.ok) return null;
          const payload = await exchange.json() as { token?: unknown; user?: HarnessBridgeUser };
          if (typeof payload.token !== "string" || !payload.user?.userId) return null;
          setAccessToken(payload.token);
          return payload.user;
        } finally {
          currentUrl.searchParams.delete("code");
          window.history.replaceState({}, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
        }
      }
      const response = await authenticatedFetch("/api/auth/me");
      if (!response.ok) return null;
      const payload = await response.json() as { user?: HarnessBridgeUser };
      return payload.user?.userId ? payload.user : null;
    }
    void loadSession().then((nextUser) => {
      if (cancelled) return;
      setUser(nextUser);
      if (!nextUser) redirectToLogin();
    }).catch(() => {
      if (!cancelled) {
        setUser(null);
        redirectToLogin();
      }
    });
    return () => { cancelled = true; };
  }, []);

  if (user === undefined || user === null) {
    return <main className="flex min-h-dvh items-center justify-center text-sm text-slate-500">正在跳转到统一登录…</main>;
  }
  return <><HarnessProjectContextBridge user={user} />{children}</>;
}
