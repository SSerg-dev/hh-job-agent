import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HHPageImporter, parseVacancyPage, vacancyUrl } from '../src/server/hh-import.ts';
import { Store } from '../src/server/store.ts';
import { createHandler } from '../src/server/app.ts';
import { createServer } from 'node:http';
const source = { id: '137302282', url: 'https://spb.hh.ru/vacancy/137302282' };
const vacancy = { vacancyId: 137302282, name: 'Forward Deployed Engineer (AI / Fullstack)', company: { name: 'Napoleon IT' }, area: { id: 2, name: 'Санкт-Петербург' }, description: '<p>LLM &amp; RAG</p><ul><li>MCP</li></ul><script>evil()</script>', workFormats: ['HYBRID'], keySkills: ['LLM', 'Docker'], compensation: { noCompensation: true } };
const page = (v: unknown = vacancy) => '<template id="HH-Lux-InitialState" style="display:none">' + JSON.stringify({ vacancyView: { vacancyFull: { vacancy: v } } }).replace(/&/g, '&amp;').replace(/"/g, '&#34;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</template>';
test('HH link validation strips tracking and rejects unsafe destinations before network', async () => {
  assert.deepEqual(vacancyUrl(source.url + '?hhtmFrom=negotiation_list#x'), source);
  let calls = 0; const client = new HHPageImporter(async () => { calls++; return new Response(page(), { headers: { 'Content-Type': 'text/html' } }); });
  for (const url of ['http://hh.ru/vacancy/123', 'https://hh.ru.evil.example/vacancy/123', 'https://localhost/vacancy/123', 'https://user:pass@hh.ru/vacancy/123', 'https://hh.ru:444/vacancy/123', 'https://hh.ru/search/vacancy', 'https://hh.ru/vacancy/123/extra', null]) await assert.rejects(client.load(url));
  assert.equal(calls, 0);
});
test('HH public page imports source, literal text, skills and explicit hybrid without inventing salary', () => {
  const result = parseVacancyPage(page(), source);
  assert.equal(result.name, vacancy.name); assert.equal(result.employer, 'Napoleon IT'); assert.equal(result.city, '2'); assert.equal(result.format, 'HYBRID'); assert.equal(result.skills, 'LLM, Docker');
  assert.equal(result.salary, ''); assert.equal(result.tax, 'unknown'); assert.ok(result.warnings.some(x => x.includes('не указана')));
  assert.ok(result.description.startsWith('Источник: ' + source.url)); assert.ok(result.description.includes('LLM & RAG\n• MCP')); assert.ok(!result.description.includes('evil()')); assert.ok(!result.description.includes('<script'));
  assert.throws(() => parseVacancyPage(page({ ...vacancy, vacancyId: 999 }), source));
  assert.throws(() => parseVacancyPage('<html>login or CAPTCHA</html>', source));
  assert.throws(() => parseVacancyPage(page({ ...vacancy, status: { archived: true } }), source));
});
test('salary conversion only accepts explicit monthly RUB lower bound and preserves tax distinction', () => {
  const parse = (compensation: unknown) => parseVacancyPage(page({ ...vacancy, compensation }), source);
  assert.equal(parse({ from: 180000, to: 240000, currencyCode: 'RUR', mode: 'MONTH', gross: false }).tax, 'net');
  assert.equal(parse({ from: 180000, currencyCode: 'RUR', compensationMode: 'MONTH', gross: true }).tax, 'gross');
  const unknownTax = parse({ from: 180000, currencyCode: 'RUR', mode: 'MONTH' }); assert.equal(unknownTax.salary, '180000'); assert.equal(unknownTax.tax, 'unknown');
  for (const c of [{ to: 200000, currencyCode: 'RUR', mode: 'MONTH' }, { from: 200000, currencyCode: 'USD', mode: 'MONTH' }, { from: 2000, currencyCode: 'RUR', mode: 'HOUR' }, { from: 200000, currencyCode: 'RUR' }]) { const result = parse(c); assert.equal(result.salary, ''); assert.ok(result.warnings.length); }
  const ambiguous = parseVacancyPage(page({ ...vacancy, workFormats: ['REMOTE', 'HYBRID'], area: { id: 88, name: 'Другой город' } }), source); assert.equal(ambiguous.format, 'unknown'); assert.equal(ambiguous.city, 'other');
});
test('page importer uses bounded public fetch without credentials; stops on redirects, failures and oversized pages', async () => {
  const importer = new HHPageImporter(async (url, options) => { assert.equal(String(url), source.url); assert.equal(options?.redirect, 'error'); assert.ok(options?.signal); assert.ok(!('Authorization' in (options?.headers as Record<string, string>))); return new Response(page(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } }); });
  assert.equal((await importer.load(source.url)).name, vacancy.name);
  for (const response of [new Response('forbidden', { status: 403 }), new Response('missing', { status: 404 }), new Response('{}', { headers: { 'Content-Type': 'application/json' } }), new Response('x'.repeat(5_000_001), { headers: { 'Content-Type': 'text/html' } })]) await assert.rejects(new HHPageImporter(async () => response).load(source.url));
  await assert.rejects(new HHPageImporter(async () => { throw new Error('redirect or timeout'); }).load(source.url));
});
test('import endpoint enforces local origin and only prefills; does not create a stored vacancy', async () => {
  const store = new Store(':memory:'); const server = createServer(); await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + (server.address() as {port:number}).port;
  let calls = 0;
  server.on('request', createHandler(store, { origin, dist: '.', importer: new HHPageImporter(async () => { calls++; return new Response(page(), { headers: { 'Content-Type': 'text/html' } }); }) }));
  try {
    const send = (url: unknown, requestOrigin = origin) => fetch(origin + '/api/manual/import', { method: 'POST', headers: { Origin: requestOrigin, 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
    assert.equal((await send(source.url, 'https://foreign.example')).status, 403); assert.equal(calls, 0);
    assert.equal((await send('https://localhost/vacancy/123')).status, 400); assert.equal(calls, 0);
    const result = await send(source.url); assert.equal(result.status, 200); assert.equal((await result.json()).format, 'HYBRID'); assert.equal(calls, 1);
    assert.equal(store.get('manual'), undefined);
  } finally { await new Promise<void>(r => server.close(() => r())); store.close(); }
});
