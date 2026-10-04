import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import type { Store } from './store.ts';
import { HHClient, HHError } from './hh.ts';
import { evaluateVacancy } from '../shared/matching.ts';
import { createManual, type ManualEntry } from '../shared/manual.ts';
import type { SearchResult, Vacancy } from '../shared/types.ts';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function json(res: ServerResponse, value: unknown, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }
export async function body(req: IncomingMessage): Promise<unknown> {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new HttpError(415, 'Ожидается JSON.');
  let size = 0; const chunks: Buffer[] = [];
  for await (const chunk of req) { size += chunk.length; if (size > 65536) throw new HttpError(413, 'Запрос слишком большой.'); chunks.push(Buffer.from(chunk)); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400, 'Некорректный JSON.'); }
}
export function createHandler(store: Store, options: { origin: string; dist: string; hh?: HHClient }) {
  const hh = options.hh ?? new HHClient();
  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (req.headers.host !== new URL(options.origin).host) throw new HttpError(403, 'Недопустимый адрес сервера.');
      if (req.headers.origin && req.headers.origin !== options.origin) throw new HttpError(403, 'Недопустимый источник запроса.');
      if (!['GET', 'HEAD'].includes(req.method ?? '') && req.headers.origin !== options.origin) throw new HttpError(403, 'Изменения доступны только из локального приложения.');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
      const url = new URL(req.url ?? '/', options.origin);
      if (url.pathname === '/api/manual' && req.method === 'GET') return json(res, (store.get<ManualEntry[]>('manual') ?? []).map(entry => ({ ...entry, match: evaluateVacancy(entry.vacancy, store.profile()) })));
      if (url.pathname === '/api/manual' && req.method === 'POST') {
        const input = await body(req); let entry: ManualEntry;
        try { entry = createManual(input, store.profile()); } catch (e) { throw new HttpError(400, (e as Error).message); }
        const entries = store.get<ManualEntry[]>('manual') ?? [];
        if (entries.length >= 100) throw new HttpError(400, 'Достигнут лимит 100 ручных вакансий.');
        store.set('manual', [entry, ...entries]); return json(res, { ...entry, match: evaluateVacancy(entry.vacancy, store.profile()) }, 201);
      }
      if (url.pathname === '/api/manual' && req.method === 'PUT') {
        const input = await body(req) as { id?: unknown; letter?: unknown };
        if (!input || typeof input.id !== 'string' || typeof input.letter !== 'string' || input.letter.length > 20000 || !input.letter.trim()) throw new HttpError(400, 'Проверьте письмо.');
        const entries = store.get<ManualEntry[]>('manual') ?? []; const entry = entries.find(e => e.id === input.id);
        if (!entry) throw new HttpError(404, 'Вакансия не найдена.');
        entry.letter = input.letter; store.set('manual', entries); return json(res, entry);
      }
      if (url.pathname === '/api/health' && req.method === 'GET') return json(res, { version: '0.1.0', accountConnected: false, configured: false, mode: 'preview' });
      if (url.pathname === '/api/search' && req.method === 'GET') {
        const cached = store.get<SearchResult>('search');
        return json(res, cached ? { ...cached, items: cached.items.map(item => ({ vacancy: item.vacancy, match: evaluateVacancy(item.vacancy, store.profile()) })) } : null);
      }
      if (url.pathname === '/api/search' && req.method === 'POST') {
        const input = await body(req) as { query?: unknown; page?: unknown };
        if (!input || typeof input.query !== 'string' || input.page !== undefined && typeof input.page !== 'number') throw new HttpError(400, 'Некорректный запрос поиска.');
        const result = await hh.search(input.query, input.page as number | undefined);
        const profile = store.profile();
        const search: SearchResult = { items: result.items.map(vacancy => ({ vacancy, match: evaluateVacancy(vacancy, profile) })), found: result.found, pages: result.pages, page: result.page, perPage: result.per_page, query: input.query, fetchedAt: new Date().toISOString() };
        store.set('search', search); return json(res, search);
      }
      const detail = url.pathname.match(/^\/api\/vacancies\/(\d{1,20})$/);
      if (detail && req.method === 'GET') {
        const vacancy = await hh.vacancy(detail[1]); store.set('vacancy:' + vacancy.id, { vacancy, fetchedAt: new Date().toISOString() });
        const cached = store.get<SearchResult>('search');
        if (cached) { cached.items = cached.items.map(item => item.vacancy.id === vacancy.id ? { vacancy, match: evaluateVacancy(vacancy, store.profile()) } : item); store.set('search', cached); }
        return json(res, { vacancy, match: evaluateVacancy(vacancy, store.profile()) });
      }
      if (url.pathname === '/api/cached-vacancies' && req.method === 'GET') {
        const cached = store.get<SearchResult>('search');
        return json(res, cached?.items.map(i => i.vacancy) ?? [] as Vacancy[]);
      }
      if (url.pathname === '/api/profile') {
        if (req.method === 'GET') return json(res, store.profile());
        if (req.method === 'PUT') {
          const value = await body(req);
          try { return json(res, store.saveProfile(value)); } catch (e) { throw new HttpError(400, (e as Error).message); }
        }
        throw new HttpError(405, 'Метод не поддерживается.');
      }
      if (url.pathname.startsWith('/api/')) throw new HttpError(404, 'API ещё не доступен.');
      if (!['GET', 'HEAD'].includes(req.method ?? '')) throw new HttpError(405, 'Метод не поддерживается.');
      let pathname: string;
      try { pathname = decodeURIComponent(url.pathname); } catch { throw new HttpError(400, 'Некорректный путь.'); }
      if (pathname.includes('\\') || pathname.split('/').some(p => p.startsWith('.') || p === '..') || pathname.includes('\0')) throw new HttpError(404, 'Файл не найден.');
      const root = resolve(options.dist); let file = resolve(root, '.' + pathname);
      if (file !== root && !file.startsWith(root + sep)) throw new HttpError(404, 'Файл не найден.');
      if (pathname === '/') file = resolve(root, 'index.html');
      try { if (!(await stat(file)).isFile()) throw new Error(); }
      catch { if (extname(pathname)) throw new HttpError(404, 'Файл не найден.'); file = resolve(root, 'index.html'); }
      const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
      const bytes = await readFile(file).catch(() => { throw new HttpError(503, 'Сначала выполните сборку: npm run build.'); });
      res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch (error) { const e = error as Error; if (!res.headersSent) json(res, { error: e.message }, error instanceof HttpError ? error.status : error instanceof HHError ? (error.status === 403 ? 403 : error.status === 400 ? 400 : 502) : 500); else res.end(); }
  };
}
