import { HHError } from './hh.ts';

export interface ImportedVacancy {
  sourceUrl: string; name: string; employer: string; description: string;
  city: string; format: string; salary: string; tax: string; skills: string; warnings: string[];
}
export function vacancyUrl(value: unknown): { id: string; url: string } {
  if (typeof value !== 'string' || value.length > 2000) throw new HHError(400, 'invalid_url', 'Вставьте ссылку на вакансию HH.');
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new HHError(400, 'invalid_url', 'Некорректная ссылка на вакансию HH.'); }
  const match = url.pathname.match(/^\/vacancy\/(\d{1,20})\/?$/);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !/^(?:[a-z0-9-]+\.)?hh\.ru$/.test(url.hostname) || !match) throw new HHError(400, 'invalid_url', 'Нужна HTTPS-ссылка вида https://spb.hh.ru/vacancy/123456.');
  return { id: match[1], url: `https://${url.hostname}/vacancy/${match[1]}` };
}
function decode(text: string): string {
  const entities: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', ndash: '–', mdash: '—', laquo: '«', raquo: '»', hellip: '…', bull: '•' };
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (all, code: string) => {
    if (!code.startsWith('#')) return entities[code.toLowerCase()] ?? all;
    const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '\uFFFD';
  });
}
function plain(html: string): string {
  return decode(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '').replace(/<br\s*\/?\s*>|<\/(?:p|div|li|h[1-6])\s*>/gi, '\n').replace(/<li\b[^>]*>/gi, '• ').replace(/<[^>]*>/g, '')).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
export function parseVacancyPage(html: string, source: { id: string; url: string }): ImportedVacancy {
  const template = html.match(/<template\b[^>]*\bid=["']HH-Lux-InitialState["'][^>]*>([\s\S]*?)<\/template\s*>/i);
  let v;
  try { v = JSON.parse(decode(template?.[1] ?? '')).vacancyView.vacancyFull.vacancy; } catch { throw new HHError(502, 'page_changed', 'Не удалось прочитать данные вакансии. HH мог изменить страницу или потребовать вход. Вставьте текст вручную.'); }
  if (!v || String(v.vacancyId) !== source.id || typeof v.name !== 'string' || !v.name.trim() || typeof v.description !== 'string' || !v.description.trim()) throw new HHError(502, 'invalid_response', 'HH вернул неполное описание вакансии. Вставьте текст вручную.');
  if (v.status?.archived || v.status?.disabled) throw new HHError(410, 'archived', 'Вакансия архивная или недоступна.');
  const warnings: string[] = [];
  const formats = Array.isArray(v.workFormats) ? v.workFormats : [];
  const format = formats.length === 1 && ['REMOTE', 'HYBRID', 'ON_SITE'].includes(formats[0]) ? formats[0] : '';
  if (!format) warnings.push('Формат работы не определён однозначно — поле оставлено пустым.');
  const city = ['1', '2'].includes(String(v.area?.id)) ? String(v.area.id) : v.area?.id && typeof v.area?.name === 'string' && v.area.name.trim() ? 'other' : '';
  if (city === 'other') warnings.push(`Город: ${v.area.name}. Он вне текущих критериев.`);
  if (!city) warnings.push('Город не указан — поле оставлено пустым.');
  const compensation = v.compensation;
  let salary = '', tax = '';
  if (!compensation || compensation.noCompensation) warnings.push('Зарплата не указана в объявлении.');
  else {
    const monthly = (compensation.mode ?? compensation.compensationMode) === 'MONTH';
    if (monthly && compensation.currencyCode === 'RUR' && Number.isSafeInteger(compensation.from) && compensation.from > 0 && compensation.from <= 10000000) {
      salary = String(compensation.from);
      tax = typeof compensation.gross === 'boolean' ? (compensation.gross ? 'gross' : 'net') : '';
      if (compensation.to) warnings.push(`Верхняя граница зарплаты: ${compensation.to} ₽. В форме указана только нижняя граница.`);
      if (!tax) warnings.push('Не уточнено, указана зарплата до налогов или на руки — поле оставлено пустым.');
    } else warnings.push('Зарплата указана, но нижняя граница в рублях за месяц не подтверждена — поле оставлено пустым.');
  }
  const description = `Источник: ${source.url}\n\n${plain(v.description)}`;
  const skills = Array.isArray(v.keySkills) ? v.keySkills.filter((s: unknown) => typeof s === 'string').join(', ') : '';
  if (v.name.length > 300 || description.length > 24000 || skills.length > 2000) throw new HHError(502, 'too_large', 'Данные вакансии превышают размер формы. Вставьте сокращённый текст вручную.');
  return { sourceUrl: source.url, name: v.name.trim(), employer: typeof v.company?.name === 'string' ? v.company.name.slice(0, 300) : '', description, city, format, salary, tax, skills, warnings };
}
export class HHPageImporter {
  constructor(private fetcher: typeof fetch = fetch) {}
  async load(value: unknown): Promise<ImportedVacancy> {
    const source = vacancyUrl(value);
    let response: Response;
    try { response = await this.fetcher(source.url, { headers: { Accept: 'text/html', 'User-Agent': 'HHJobAgent/0.1 (personal vacancy reader)' }, redirect: 'error', signal: AbortSignal.timeout(20000) }); }
    catch { throw new HHError(502, 'network', 'Не удалось загрузить страницу HH. Попробуйте позже или вставьте текст вручную.'); }
    if (!response.ok) { await response.body?.cancel(); throw new HHError(response.status === 404 ? 404 : 502, 'unavailable', `HH не отдал страницу вакансии (HTTP ${response.status}). Можно вставить текст вручную.`); }
    if (!response.headers.get('content-type')?.includes('text/html')) { await response.body?.cancel(); throw new HHError(502, 'invalid_response', 'HH вернул неподдерживаемый ответ.'); }
    const reader = response.body?.getReader();
    if (!reader) throw new HHError(502, 'invalid_response', 'HH вернул пустую страницу.');
    const decoder = new TextDecoder(); let html = '', size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 5_000_000) { await reader.cancel(); throw new HHError(502, 'too_large', 'Страница HH слишком велика. Вставьте текст вакансии вручную.'); }
        html += decoder.decode(value, { stream: true });
      }
      html += decoder.decode();
    } catch (e) { if (e instanceof HHError) throw e; throw new HHError(502, 'network', 'Загрузка страницы HH прервалась. Повторите позже.'); }
    return parseVacancyPage(html, source);
  }
}
