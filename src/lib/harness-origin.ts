/** 将候选地址限制为可用于 postMessage 的 HTTP(S) Origin。 */
function parseHarnessOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}

/** 读取 iframe 父窗口 Origin，并在 CAS 回跳前保留它。 */
export function readHarnessOrigin(): string | null {
  if (window.parent === window) return null;
  const configured = parseHarnessOrigin(process.env.NEXT_PUBLIC_HARNESS_UI_ORIGIN);
  const ancestor = parseHarnessOrigin(window.location.ancestorOrigins?.[0]);
  if (configured || ancestor) return configured ?? ancestor;
  const saved = parseHarnessOrigin(sessionStorage.getItem("metaphorical-harness-origin"));
  if (saved) return saved;
  if (new URL(window.location.href).searchParams.has("code")) return null;
  const initial = parseHarnessOrigin(document.referrer);
  if (initial) sessionStorage.setItem("metaphorical-harness-origin", initial);
  return initial;
}
