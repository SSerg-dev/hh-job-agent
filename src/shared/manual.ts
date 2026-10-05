import { randomUUID } from 'node:crypto';
import { evaluateVacancy } from './matching.ts';
import type { Profile, Vacancy, Match } from './types.ts';
import type { LetterInfo } from './letter.ts';
export interface ManualEntry { id: string; vacancy: Vacancy; letter: string; letterInfo?: LetterInfo; createdAt: string }
export interface ManualResult extends ManualEntry { match: Match }
export function createManual(value: unknown, profile: Profile): ManualEntry {
  if (!value || typeof value !== 'object') throw new Error('Заполните вакансию.');
  const x = value as Record<string, unknown>;
  const text = (key: string, max: number, required = false) => { const v = x[key]; if (typeof v !== 'string' || v.length > max || required && !v.trim()) throw new Error('Проверьте поле ' + key); return v.trim(); };
  const name = text('name', 300, true), description = text('description', 24000, true), employer = text('employer', 300), skills = text('skills', 2000);
  if (!['', '1', '2', 'other'].includes(String(x.city)) || !['', 'REMOTE', 'HYBRID', 'ON_SITE', 'unknown'].includes(String(x.format))) throw new Error('Проверьте город и формат.');
  const salary = x.salary === '' || x.salary == null ? null : Number(x.salary);
  if (salary !== null && (!Number.isSafeInteger(salary) || salary < 1 || salary > 10000000)) throw new Error('Проверьте зарплату.');
  if (!['', 'net', 'gross', 'unknown'].includes(String(x.tax))) throw new Error('Проверьте тип зарплаты.');
  const id = randomUUID();
  const vacancy: Vacancy = { id, name, description, employer: { name: employer }, area: { id: x.city === '' ? 'unknown' : String(x.city), name: x.city === '2' ? 'Санкт-Петербург' : x.city === '1' ? 'Москва' : x.city === '' ? 'Город не указан' : 'Другой город' }, work_format: x.format === 'unknown' || x.format === '' ? [] : [{ id: String(x.format), name: String(x.format) }], key_skills: skills.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name })), salary: salary === null ? null : { from: salary, currency: 'RUR', gross: x.tax === 'net' ? false : x.tax === 'gross' ? true : undefined, mode: { id: 'MONTH' } } };
  const match = evaluateVacancy(vacancy, profile);
  const evidence = match.matchedSkills;
  const letter = `Здравствуйте!\n\nМеня заинтересовала вакансия «${name}»${employer ? ' в компании ' + employer : ''}.\n\n${profile.summary}\n\n${evidence.length ? 'В описании вакансии отмечены технологии, представленные в моём профиле: ' + evidence.join(', ') + '. Готов обсудить, как мой опыт может быть полезен вашей команде.' : 'Буду рад обсудить задачи позиции и соответствие моего опыта вашим требованиям.'}\n\nСпасибо за рассмотрение кандидатуры.\n${profile.name}`;
  return { id, vacancy, letter, createdAt: new Date().toISOString() };
}
