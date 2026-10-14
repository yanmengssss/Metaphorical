/* eslint-disable @typescript-eslint/no-require-imports -- Node tests use CommonJS, matching the existing test suite. */
const assert = require("node:assert/strict");
const test = require("node:test");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function dashboard() {
  const state = [], effects = [], requests = [];
  let cursor = 0;
  const window = { location: { href: "http://localhost/?projectId=p1&tableId=t1&embed=yes#logs" } };
  window.history = { pushState: (_, __, url) => { window.location.href = new URL(url, window.location.href).href; } };
  const react = {
    Suspense: "Suspense",
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = value; }];
    },
    useRef(initial) { return react.useState({ current: initial })[0]; },
    useEffect(fn, deps) {
      const index = cursor++;
      const previous = state[index];
      if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) {
        previous?.cleanup?.();
        state[index] = { deps };
        effects.push(() => { state[index].cleanup = fn(); });
      }
    },
  };
  const jsx = (type, props, key) => ({ type, props, key });
  const exports = {};
  const source = readFileSync(require.resolve("../src/app/page.tsx"), "utf8") + "\nexport { DashboardContent };";
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, {
    exports, window, URL, AbortController,
    require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "next/navigation") return { useSearchParams: () => new URL(window.location.href).searchParams };
      if (name === "sonner") return { toast: { error() {} } };
      if (name === "@/lib/auth-client") return { apiFetch: (url, init) => new Promise(resolve => requests.push({ url, init, resolve })) };
      return new Proxy({}, { get: (_, key) => key });
    },
  });
  function render() {
    cursor = 0;
    const tree = exports.DashboardContent();
    effects.splice(0).forEach(fn => fn());
    return tree;
  }
  function find(node, type) {
    if (!node || typeof node !== "object") return [];
    return [...(node.type === type ? [node] : []), ...[node.props?.children].flat(Infinity).flatMap(child => find(child, type))];
  }
  return { render, find, requests, window };
}

test("project/table selections update the URL immediately and reset the log view", () => {
  const app = dashboard();
  let tree = app.render();
  const firstKey = app.find(tree, "TableLogsView")[0].key;
  app.find(tree, "Select")[1].props.onValueChange("t2");
  tree = app.render();
  assert.equal(app.find(tree, "Select")[1].props.value, "t2");
  assert.notEqual(app.find(tree, "TableLogsView")[0].key, firstKey);
  app.find(tree, "Select")[0].props.onValueChange("p2");
  tree = app.render();
  assert.equal(app.find(tree, "Select")[0].props.value, "p2");
  assert.equal(app.find(tree, "Select")[1].props.value, "all");
  assert.equal(new URL(app.window.location.href).searchParams.get("embed"), "yes");
  assert.equal(new URL(app.window.location.href).hash, "#logs");
  app.find(tree, "Select")[0].props.onValueChange("all");
  tree = app.render();
  assert.equal(app.find(tree, "Select")[1].props.disabled, true);
});

test("a late response from the previous project cannot replace the current tables", async () => {
  const app = dashboard();
  const first = app.render();
  const oldRequest = app.requests.find(r => r.url === "/api/projects/p1/tables");
  app.find(first, "Select")[0].props.onValueChange("p2");
  app.render();
  assert.equal(oldRequest.init.signal.aborted, true);
  const currentRequest = app.requests.find(r => r.url === "/api/projects/p2/tables");
  currentRequest.resolve({ json: async () => ({ code: 200, data: [{ _id: "new", label: "New table" }] }) });
  await new Promise(resolve => setImmediate(resolve));
  oldRequest.resolve({ json: async () => ({ code: 200, data: [{ _id: "old", label: "Old table" }] }) });
  await new Promise(resolve => setImmediate(resolve));
  const items = app.find(app.render(), "SelectItem").map(item => item.props.value);
  assert.ok(items.includes("new"));
  assert.ok(!items.includes("old"));
});
