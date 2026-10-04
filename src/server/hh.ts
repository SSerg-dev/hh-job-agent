import type { Vacancy } from '../shared/types.ts';
export class HHError extends Error {
  constructor(public status: number, public kind: string, message: string) { super(message); }
}
export interface HHSearch { items: Vacancy[]; found: number; pages: number; page: number; per_page: number }
export class HHClient {
  constructor(private fetcher: typeof fetch = fetch, private token: () => string | undefined = () => process.env.HH_ACCESS_TOKEN) {}
  async get<T>(path: string): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      let response: Response;
      try { const token = this.token(); response = await this.fetcher('https://api.hh.ru' + path, { headers: { 'HH-User-Agent': 'HHJobAgent/0.1 (personal job search)', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, signal: AbortSignal.timeout(12000), redirect: 'error' }); }
      catch { throw new HHError(502, 'network', 'HH недоступен или время ожидания истекло. Повторите позже.'); }
      if ((response.status === 429 || response.status >= 500) && attempt < 2) { await response.body?.cancel(); await new Promise(r => setTimeout(r, 700 * (attempt + 1))); continue; }
      const data = await response.json().catch(() => null) as { errors?: { type?: string; value?: string }[]; request_id?: string } | null;
      if (!response.ok) {
        const kind = data?.errors?.[0]?.value ?? data?.errors?.[0]?.type ?? 'unknown';
        const captcha = kind.includes('captcha');
        const oauth = data?.errors?.some(error => error.type === 'oauth');
        const reference = typeof data?.request_id === 'string' && /^[\w-]{1,120}$/.test(data.request_id) ? ` Код запроса для поддержки HH: ${data.request_id}.` : '';
        throw new HHError(response.status, kind, captcha ? 'HH требует CAPTCHA. Поиск остановлен; агент не обходит проверку.' : response.status === 403 ? (oauth ? 'HH отклонил авторизацию API. Проверьте или обновите официальный токен локально в .env.' : 'HH ограничил доступ к поиску. Причина не уточнена; проверьте регистрацию приложения и обратитесь в поддержку HH API.') + reference : response.status === 429 ? 'Лимит запросов HH. Повторите поиск позже.' : `HH вернул ошибку ${response.status}.`);
      }
      if (!data) throw new HHError(502, 'invalid_response', 'HH вернул некорректный ответ.');
      return data as T;
    }
    throw new HHError(502, 'unavailable', 'HH недоступен.');
  }
  async search(text: string, page = 0): Promise<HHSearch> {
    if (!Number.isInteger(page) || page < 0 || page > 99 || !text.trim() || text.length > 500) throw new HHError(400, 'invalid_query', 'Проверьте запрос и номер страницы.');
    const query = new URLSearchParams({ text, page: String(page), per_page: '20', order_by: 'publication_time' }); query.append('area', '2'); query.append('area', '1');
    const result = await this.get<HHSearch>('/vacancies?' + query);
    if (!Array.isArray(result.items) || !Number.isInteger(result.pages) || !Number.isInteger(result.found)) throw new HHError(502, 'invalid_response', 'HH вернул некорректную выдачу.');
    return result;
  }
  async vacancy(id: string): Promise<Vacancy> {
    if (!/^\d{1,20}$/.test(id)) throw new HHError(400, 'invalid_id', 'Некорректный номер вакансии.');
    const v = await this.get<Vacancy>('/vacancies/' + id);
    if (v.id !== id || typeof v.name !== 'string' || !v.area || typeof v.description !== 'string') throw new HHError(502, 'invalid_response', 'HH вернул неполное описание вакансии.');
    return v;
  }
}
