import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HHClient, HHError } from '../src/server/hh.ts';
test('HH search sends geography and bounded pagination; detail preserves full data', async () => {
  const calls: string[] = [];
  const client = new HHClient(async input => { calls.push(String(input)); return Response.json(String(input).includes('?') ? { items: [], found: 0, pages: 1, page: 2, per_page: 20 } : { id: '123', name: 'Senior .NET', area: { id: '2', name: 'SPb' }, description: 'C#' }); });
  const result = await client.search('.NET OR C#', 2); assert.equal(result.page, 2);
  const url = new URL(calls[0]); assert.deepEqual(url.searchParams.getAll('area'), ['2', '1']); assert.equal(url.searchParams.get('page'), '2');
  assert.equal((await client.vacancy('123')).description, 'C#');
  await assert.rejects(client.search('x', 100), HHError); await assert.rejects(client.vacancy('../token'), HHError);
});
test('generic forbidden does not claim authentication is required; OAuth error is distinguished', async () => {
  let calls = 0;
  const forbidden = new HHClient(async () => { calls++; return Response.json({ errors: [{ type: 'forbidden' }], request_id: 'request-123' }, { status: 403 }); });
  await assert.rejects(forbidden.search('.NET'), error => error instanceof HHError && error.kind === 'forbidden' && error.message.includes('Причина не уточнена') && error.message.includes('request-123') && !error.message.includes('понадобится авторизация'));
  assert.equal(calls, 1);
  const oauth = new HHClient(async () => Response.json({ errors: [{ type: 'oauth', value: 'bad_authorization' }] }, { status: 403 }));
  await assert.rejects(oauth.search('.NET'), /отклонил авторизацию API/);
});
test('CAPTCHA stops immediately with an actionable message; malformed success is rejected', async () => {
  let calls = 0; const client = new HHClient(async () => { calls++; return Response.json({ errors: [{ type: 'captcha_required' }] }, { status: 403 }); });
  await assert.rejects(client.search('.NET'), /CAPTCHA/); assert.equal(calls, 1);
  const bad = new HHClient(async () => Response.json({ items: 'bad' })); await assert.rejects(bad.search('.NET'), /некорректную/);
});
