const assert = require("node:assert/strict");
const test = require("node:test");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(path, dependencies, fetch, browser = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(join(__dirname, path), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, { exports, Headers, AbortSignal, fetch, URL, process: { env: {} }, ...browser, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected import ${name}`);
    return dependencies[name];
  } });
  return exports;
}
test("logout forwards current token to Gateway and handles invalid/failing responses", async () => {
  let upstream = Response.json({ code: 0, data: null, msg: "success" });
  let calls = 0;
  const route = load("../src/app/api/auth/logout/route.ts", {
    "next/server": { NextResponse: Response },
    "@/lib/auth-server": { readBearerToken: r => r.headers.get("authorization")?.replace("Bearer ", "") || null },
    "@/lib/gateway": { gatewayFetch: async (path, init) => {
      calls++;
      assert.equal(path, "/user/api/v1/users/logout");
      assert.equal(init.method, "POST");
      assert.equal(init.headers.authorization, "Bearer current-token");
      if (upstream instanceof Error) throw upstream;
      return upstream;
    } },
  });
  const request = () => new Request("http://localhost/api/auth/logout", { method: "POST", headers: { authorization: "Bearer current-token" } });
  assert.equal((await route.POST(new Request("http://localhost"))).status, 401);
  assert.equal(calls, 0);
  assert.deepEqual(await (await route.POST(request())).json(), { ok: true });
  for (const [response, expected] of [
    [new Response(null, { status: 401 }), 401],
    [new Response(null, { status: 500 }), 502],
    [Response.json({ code: 500 }), 502],
    [new Response("not json"), 502],
    [new Error("offline"), 503],
  ]) {
    upstream = response;
    assert.equal((await route.POST(request())).status, expected);
  }
});
test("browser retains credentials on failed logout and clears only on success or 401", async () => {
  let response;
  const client = load("../src/lib/auth-client.ts", {}, async (url, init) => {
    assert.equal(url, "/api/auth/logout");
    assert.equal(init.method, "POST");
    assert.equal(new Headers(init.headers).get("authorization"), "Bearer current-token");
    if (response instanceof Error) throw response;
    return response;
  });
  for (const failed of [new Response(null, { status: 503 }), Response.json({ ok: false }), new Error("offline")]) {
    client.setAccessToken("current-token");
    response = failed;
    await assert.rejects(client.logout());
    assert.equal(client.readAuthorization(), "Bearer current-token");
  }
  for (const accepted of [Response.json({ ok: true }), new Response(null, { status: 401 })]) {
    client.setAccessToken("current-token");
    response = accepted;
    await client.logout();
    assert.equal(client.readAuthorization(), null);
  }
});

test("successful and already-invalid logout automatically redirect with callback preserved", async () => {
  for (const response of [Response.json({ ok: true }), new Response(null, { status: 401 })]) {
    let destination;
    const client = load("../src/lib/auth-client.ts", {}, async () => response, {
      window: { location: { href: "http://localhost:6500/logs?code=stale&q=test", replace: url => { destination = url; } } },
    });
    client.setAccessToken("current-token");
    await client.logout();
    const url = new URL(destination);
    assert.equal(url.pathname, "/pc/login");
    assert.equal(url.searchParams.get("service"), "http://localhost:6500/logs?q=test");
    assert.equal(url.searchParams.has("logout"), false);
    assert.equal(client.readAuthorization(), null);
  }
});
