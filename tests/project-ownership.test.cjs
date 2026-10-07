const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const rows = [{ _id: 'a', name: 'A', key: 'a', ownerUserId: 'alice' }, { _id: 'b', name: 'B', key: 'b', ownerUserId: 'bob' }];
function setup(userId) {
  const saved = [];
  const model = {
    find(filter) { const found = rows.filter(p => p.ownerUserId === filter.ownerUserId); return { sort: () => Promise.resolve(found) }; },
    async createIndex() {},
    async insertOne(project) { saved.push(project); return { insertedId: 'new' }; },
    async create(project) { saved.push(project); return project; },
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/app/api/projects/route.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const deps = {
    'next/server': { NextResponse: Response },
    '@/lib/auth-server': { getAuthenticatedUser: async () => userId ? { userId } : null },
    '@/lib/mongodb': { default: async () => {} },
    '@/models': { Project: model },
    'uuid': { v4: () => 'new-key' },
    '@/lib/api-response': { successResponse: data => Response.json({ data }), errorResponse: (msg, status) => Response.json({ msg }, { status }) },
  };
  vm.runInNewContext(source, { exports, console, require(name) { if (!(name in deps)) throw new Error(name); return deps[name]; } });
  return { route: exports, saved };
}
test('project lists are separated by authenticated user; new users see an empty list', async () => {
  for (const [user, expected] of [['alice', ['a']], ['bob', ['b']], ['new-user', []]]) {
    const { route } = setup(user);
    const response = await route.GET(new Request('http://localhost/api/projects'));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.data.map(p => p.key), expected);
  }
});
test('project creation ignores a forged owner and uses the authenticated user', async () => {
  const { route, saved } = setup('alice');
  const response = await route.POST(new Request('http://localhost/api/projects', { method: 'POST', body: JSON.stringify({ name: 'new', key: 'new', ownerUserId: 'bob' }) }));
  assert.equal(response.status, 200);
  assert.equal(saved[0].ownerUserId, 'alice');
});
test('project listing and creation require authentication', async () => {
  const { route, saved } = setup(null);
  assert.equal((await route.GET(new Request('http://localhost'))).status, 401);
  assert.equal((await route.POST(new Request('http://localhost', { method: 'POST' }))).status, 401);
  assert.equal(saved.length, 0);
});
