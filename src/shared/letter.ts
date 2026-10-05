import type { Profile, Vacancy } from './types.ts';
export interface CandidateSource { id: string; filename: string; sha256: string; text: string }
export interface CandidateFact { id: string; sourceId: string; sourceHash: string; quote: string; paragraph: string; topics: string[]; always?: boolean; note?: string }
export interface LetterInfo { sources: string[]; warnings: string[] }
const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
export function draftLetter(vacancy: Vacancy, profile: Profile, sources: CandidateSource[] = [], facts: CandidateFact[] = []): { letter: string; letterInfo: LetterInfo } {
  const text = [vacancy.name, vacancy.description, vacancy.key_skills?.map(s => s.name).join(' ')].join(' ');
  const available = facts.filter(fact => {
    const source = sources.find(s => s.id === fact.sourceId);
    return source && source.sha256 === fact.sourceHash && fact.quote.trim() && normalize(source.text).includes(normalize(fact.quote)) && fact.paragraph.trim();
  });
  const score = (fact: CandidateFact) => fact.topics.filter(topic => {
    const escaped = topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^a-zа-я0-9])${escaped}(?:$|[^a-zа-я0-9])`, 'i').test(text);
  }).length;
  const chosen = [...available.filter(f => f.always).slice(0, 1), ...available.filter(f => !f.always && score(f) > 0).sort((a, b) => score(b) - score(a)).slice(0, 3)];
  const warnings = chosen.flatMap(f => f.note ? [f.note] : []);
  if (!chosen.length) warnings.push('Подтверждённые факты документов недоступны: письмо подготовлено по краткому профилю.');
  if (available.length < facts.length) warnings.push('Часть фактов пропущена: источник изменился или выдержка не подтверждена.');
  const paragraphs = chosen.length ? chosen.map(f => f.paragraph) : [profile.summary];
  const letter = `Здравствуйте!\n\nМеня заинтересовала вакансия «${vacancy.name}»${vacancy.employer?.name ? ' в компании ' + vacancy.employer.name : ''}.\n\n${paragraphs.join('\n\n')}\n\nБуду рад обсудить задачи позиции и то, как мой опыт может быть полезен вашей команде.\n\nС уважением,\n${profile.name}`;
  return { letter, letterInfo: { sources: [...new Set(chosen.map(f => sources.find(s => s.id === f.sourceId)!.filename))], warnings: [...new Set(warnings)] } };
}
