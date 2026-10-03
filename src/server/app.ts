import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import type { Store } from './store.ts';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function json(res: ServerResponse, value: unknown, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }
export async function body(req: IncomingMessage): Promise<unknown> {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new HttpError(415, 'Ожидается JSON.');
  let size = 0; const chunks: Buffer[] = [];
  for await (const chunk of req) { size += chunk.length; if (size > 65536) throw new HttpError(413, 'Запрос слишком большой.'); chunks.push(Buffer.from(chunk)); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400, 'Некорректный JSON.'); }
}
export function createHandler(store: Store, options: { origin: string; dist: string }) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (req.headers.host !== new URL(options.origin).host) throw new HttpError(403, 'Недопустимый адрес сервера.');
      if (req.headers.origin && req.headers.origin !== options.origin) throw new HttpError(403, 'Недопустимый источник запроса.');
      if (!['GET', 'HEAD'].includes(req.method ?? '') && req.headers.origin !== options.origin) throw new HttpError(403, 'Изменения доступны только из локального приложения.');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
      const url = new URL(req.url ?? '/', options.origin);
      if (url.pathname === '/api/health' && req.method === 'GET') return json(res, { version: '0.1.0', accountConnected: false, configured: false, mode: 'preview' });
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
    } catch (error) { const e = error as Error; if (!res.headersSent) json(res, { error: e.message }, error instanceof HttpError ? error.status : 500); else res.end(); }
  };
}
