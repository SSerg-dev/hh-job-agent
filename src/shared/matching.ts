import type { HHSalary, Match, Profile, Vacancy } from './types.ts';
export function plainText(html: string): string { return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim(); }
const patterns: Record<string, RegExp> = {
  'c#': /(?:^|[^a-z0-9])c\s*#(?:$|[^a-z0-9])/i, '.net': /(?:\.net|\bdotnet\b)/i,
  'asp.net core': /asp[.\s-]*net\s*core/i, 'vue': /\bvue(?:\.js)?\b/i, 'angular': /\bangular\b/i,
  'rest api': /\brest(?:ful)?\b/i, 'microservices': /microservices?|микросервис/i,
  'openai api': /\bopenai\b/i, 'rag': /\brag\b|retrieval.augmented/i,
};
function norm(s: string) { return s.toLowerCase().replace(/[.\s_-]+/g, '').replace(/\.js$/i, ''); }
function mentions(text: string, skill: string) {
  const special = patterns[skill.toLowerCase()]; if (special) return special.test(text);
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-zа-я0-9])${escaped}(?:$|[^a-zа-я0-9])`, 'i').test(text);
}
function knownSkill(required: string, skills: string[]) {
  const aliases: Record<string, string> = { dotnet: 'net', csharp: 'c#', vuejs: 'vue', rest: 'restapi', restfulapi: 'restapi', openai: 'openaiapi', retrievalaugmentedgeneration: 'rag', modelcontextprotocol: 'mcp' };
  const key = (s: string) => aliases[norm(s)] ?? norm(s);
  return skills.some(s => key(s) === key(required));
}
function salaryLabel(salary: HHSalary | null | undefined): string {
  if (!salary) return 'Зарплата не указана';
  const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);
  const range = salary.from != null && salary.to != null ? `${fmt(salary.from)}–${fmt(salary.to)}` : salary.from != null ? `от ${fmt(salary.from)}` : salary.to != null ? `до ${fmt(salary.to)}` : 'Сумма не указана';
  return `${range} ${['RUR', 'RUB'].includes(salary.currency ?? '') ? '₽' : salary.currency ?? ''} · ${salary.gross === false ? 'на руки' : salary.gross === true ? 'до налогов' : 'налоги не уточнены'}${salary.mode && salary.mode.id !== 'MONTH' ? ' · ' + (salary.mode.name ?? salary.mode.id) : ''}`;
}
export function evaluateVacancy(v: Vacancy, profile: Profile): Match {
  let decision: Match['decision'] = 'eligible'; const reasons: string[] = [];
  const reject = (s: string) => { decision = 'rejected'; reasons.push(s); };
  const review = (s: string) => { if (decision !== 'rejected') decision = 'review'; reasons.push(s); };
  const text = plainText([v.name, v.description, v.snippet?.requirement, v.snippet?.responsibility, v.key_skills?.map(s => s.name).join(' ')].filter(Boolean).join(' '));
  if (/(?:tech[\s-]*lead|team[\s-]*lead|тим[\s-]*лид|тех[\s-]*лид|руководител|начальник|head of|chief|director|lead developer|lead engineer)/i.test(v.name)) reject('Руководящие и Tech Lead роли исключены.');
  if (/\bjunior\b|\bintern\b|стаж[её]р|младший/i.test(v.name)) reject('Начальный уровень не соответствует целевым Senior ролям.');
  const dotnet = /\.net|\bc\s*#|\bdotnet\b/i.test(text);
  const fullstack = /full[\s-]*stack|фул[л]?ст[еэ]к/i.test(v.name) && dotnet && /angular|vue/i.test(text);
  const ai = /(?:\bai\b|\bllm\b|\brag\b|\bmcp\b|искусствен|нейросет|агент)/i.test(v.name) && /engineer|developer|инженер|разработчик/i.test(v.name);
  const backend = dotnet && /backend|back[\s-]*end|б[еэ]кенд|разработчик|developer|engineer/i.test(v.name) && !/front[\s-]*end|фронт[еэ]нд/i.test(v.name) && !/full[\s-]*stack|фул[л]?ст[еэ]к/i.test(v.name);
  if (!(profile.roles.includes('dotnet') && backend || profile.roles.includes('fullstack') && fullstack || profile.roles.includes('ai') && ai)) reject('Название и стек не подтверждают выбранные направления.');
  else reasons.push('Есть признаки выбранной инженерной специализации.');
  if (ai && !/\b(?:rag|mcp|openai)\b|(?:llm|large language model).{0,80}(?:integrat|applicat|agent)|(?:интеграц|приложен|агент).{0,80}(?:llm|языков.*модел)/i.test(text)) review('Описание не подтверждает направление AI/LLM интеграций.');
  if (ai) {
    const missing = ['Python', 'PyTorch', 'TensorFlow'].filter(s => mentions(text, s) && !knownSkill(s, profile.skills));
    if (missing.length || /model training|training models|fine[\s-]*tun|обучени[ея]\s+модел|computer vision/i.test(text)) review('Есть признаки ML/обучения моделей или неподтверждённого стека; требуется проверка.');
  }
  if (!ai && !/senior|старший|ведущий/i.test(v.name) && !['moreThan6', 'between3And6'].includes(v.experience?.id ?? '')) review('Senior уровень требует уточнения.');
  let formats = v.work_format?.map(f => f.id) ?? [];
  if (!formats.length && v.schedule?.id === 'remote') formats = ['REMOTE'];
  const map: Record<string, 'remote' | 'hybrid' | 'office'> = { REMOTE: 'remote', HYBRID: 'hybrid', ON_SITE: 'office' };
  const labels: Record<string, string> = { REMOTE: 'Удалёнка', HYBRID: 'Гибрид', ON_SITE: 'Офис' };
  if (!v.area.id || v.area.id === 'unknown') review('Город не указан; географию нужно проверить.');
  else if (!['1', '2'].includes(v.area.id)) reject('География вне Москвы и Санкт-Петербурга.');
  else if (!formats.length || formats.some(f => !map[f])) review('Формат работы не определён однозначно.');
  else {
    const allowed = v.area.id === '1' ? profile.locations.moscow : profile.locations.spb;
    if (!formats.some(f => (allowed as string[]).includes(map[f]))) reject(v.area.id === '1' ? 'Москва: разрешена только удалёнка.' : 'Формат не входит в выбранные для Санкт-Петербурга.');
    else if (v.area.id === '1' && formats.some(f => f !== 'REMOTE')) review('У вакансии Москвы смешанные форматы; нужна проверка полной удалёнки.');
    else reasons.push('Город и формат соответствуют критериям.');
  }
  const salary = v.salary_range ?? v.salary;
  if (salary == null) { if (!profile.allowMissingSalary) reject('Вакансии без зарплаты отключены.'); else reasons.push('Без зарплаты: отклик разрешён пользователем.'); }
  else if (!['RUR', 'RUB'].includes(salary.currency ?? '') || salary.gross !== false || salary.mode && salary.mode.id !== 'MONTH') review('Нужно подтвердить месячную сумму в рублях на руки.');
  else if (salary.from != null && salary.from >= profile.minNetSalary) reasons.push('Минимальная зарплата на руки соответствует критерию.');
  else if (salary.to != null && salary.to < profile.minNetSalary) reject('Зарплата на руки ниже установленного минимума.');
  else if (salary.from != null && salary.to == null && salary.from < profile.minNetSalary) review('Нижняя граница ниже минимума; итоговую сумму нужно уточнить.');
  else review('Диапазон не гарантирует требуемую зарплату на руки.');
  const matchedSkills = profile.skills.filter(s => mentions(text, s));
  const gaps = (v.key_skills ?? []).map(s => s.name).filter(s => !knownSkill(s, profile.skills));
  if (gaps.length) review('Часть заявленных навыков не подтверждена профилем.');
  const fullDetails = typeof v.description === 'string';
  if (!fullDetails) review('Для окончательной оценки нужно полное описание.');
  if (!matchedSkills.length) review('Нет подтверждённых совпадений навыков.');
  if (v.archived) reject('Вакансия в архиве.');
  if (v.has_test) review('Для отклика требуется тест HH.');
  const required = v.key_skills?.length ?? 0;
  return { decision, reasons, matchedSkills, gaps, coverage: required ? Math.round((required - gaps.length) / required * 100) : null, salaryLabel: salaryLabel(salary), formatLabel: formats.map(f => labels[f] ?? f).join(' / ') || 'Формат не уточнён', fullDetails };
}
