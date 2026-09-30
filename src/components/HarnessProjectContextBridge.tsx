"use client";

import { useEffect, useRef } from "react";
import { readAuthorization } from "@/lib/auth-client";
import { readHarnessOrigin } from "@/lib/harness-origin";

const EMBED_MESSAGE_VERSION = 1 as const;

export interface HarnessBridgeUser {
  userId: string;
  name: string;
}

/** 向承载本页的 Harness iframe 父窗口发布当前项目及登录上下文。 */
export function HarnessProjectContextBridge({ user }: { user: HarnessBridgeUser }) {
  const published = useRef(false);

  useEffect(() => {
    const targetOrigin = readHarnessOrigin();
    const authorization = readAuthorization();
    if (published.current || targetOrigin === null || window.parent === window || !authorization || !user.userId) return;
    window.parent.postMessage({
      source: "metacode-host",
      type: "harness:context",
      version: EMBED_MESSAGE_VERSION,
      payload: {
        project: {
          systemCode: process.env.NEXT_PUBLIC_HARNESS_PROJECT_ID?.trim() || "metaphorical",
          projectId: process.env.NEXT_PUBLIC_HARNESS_PROJECT_ID?.trim() || "metaphorical",
          projectName: process.env.NEXT_PUBLIC_HARNESS_PROJECT_NAME?.trim() || "Metaphorical",
        },
        user: { userId: user.userId, userName: user.name },
        authorization,
      },
    }, targetOrigin);
    published.current = true;
  }, [user.name, user.userId]);

  return null;
}
