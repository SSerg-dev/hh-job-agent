import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, request } from 'node:http';
import { Store } from '../src/server/store.ts';
import { defaultProfile, validateProfile } from '../src/shared/profile.ts';
import { createHandler } from '../src/server/app.ts';
test('profile round-trip persists salary/geography distinctions after database reopen', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hh-profile-')); const path = join(dir, 'agent.sqlite');
  try { const a = new Store(path); const p = a.saveProfile({ ...defaultProfile, name: 'Candidate', minNetSalary: 180000 }); a.close(); const b = new Store(path); assert.deepEqual(b.profile(), p); assert.deepEqual(b.profile().locations.moscow, ['remote']); assert.equal(b.profile().allowMissingSalary, true); b.close(); } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('profile rejects unsafe and malformed criteria', () => {
  for (const delta of [{ minNetSalary: NaN }, { minNetSalary: -1 }, { roles: ['lead'] }, { name: '' }, { skills: [] }, { allowMissingSalary: 'true' }, { locations: { spb: ['office'], moscow: ['office'] } }]) assert.throws(() => validateProfile({ ...defaultProfile, ...delta }));
});
test('API accepts local profile writes, rejects foreign origin/host, body limits and private files', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hh-api-')); const dist = join(dir, 'dist'); mkdirSync(dist); writeFileSync(join(dist, 'index.html'), '<html>HH Agent</html>'); writeFileSync(join(dir, '.env'), 'secret');
  const store = new Store(':memory:'); let origin = '';
  const server = createServer((req, res) => createHandler(store, { origin, dist })(req, res)); await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  try {
    assert.equal((await fetch(origin)).status, 200);
    const put = (value: unknown, extra: Record<string, string> = {}) => fetch(origin + '/api/profile', { method: 'PUT', headers: { Origin: origin, 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(value) });
    assert.equal((await put(defaultProfile)).status, 200);
    assert.equal((await put({})).status, 400);
    assert.equal((await put(defaultProfile, { Origin: 'https://evil.example' })).status, 403);
    const foreignHostStatus = await new Promise<number>(resolve => {
      const req = request(origin + '/api/profile', { headers: { Host: 'evil.example' } }, res => { res.resume(); resolve(res.statusCode!); }); req.end();
    });
    assert.equal(foreignHostStatus, 403);
    assert.equal((await fetch(origin + '/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
    assert.equal((await put({ oversized: 'x'.repeat(70000) })).status, 413);
    for (const path of ['/.env', '/data/agent.sqlite', '/src/server/index.ts', '/%2eenv', '/assets/..%5c.env']) assert.equal((await fetch(origin + path)).status, 404);
  } finally { await new Promise<void>(r => server.close(() => r())); store.close(); rmSync(dir, { recursive: true, force: true }); }
});
