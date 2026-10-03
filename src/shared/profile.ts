import type { Profile } from './types.ts';
export const defaultProfile: Profile = {
  name: 'Sergei Shabailov',
  title: 'Senior Software Engineer · .NET / Full Stack / AI Integration',
  summary: 'Более 20 лет разработки enterprise и промышленных систем. Backend на C# и .NET, Angular и Vue, REST API, микросервисы и Azure. Практический фокус: интеграция LLM, RAG и автоматизация инженерных процессов.',
  skills: ['C#', '.NET', 'ASP.NET Core', 'Entity Framework', 'SQL Server', 'PostgreSQL', 'Angular', 'Vue', 'TypeScript', 'JavaScript', 'Azure', 'Docker', 'REST API', 'Microservices', 'OpenAI API', 'RAG', 'MCP', 'AI workflow orchestration'],
  roles: ['dotnet', 'fullstack', 'ai'], minNetSalary: 160000, allowMissingSalary: true,
  locations: { spb: ['remote', 'hybrid', 'office'], moscow: ['remote'] },
  employment: ['full', 'part', 'project'],
};
export function validateProfile(value: unknown): Profile {
  if (!value || typeof value !== 'object') throw new Error('Некорректный профиль.');
  const p = value as Profile;
  for (const key of ['name', 'title', 'summary'] as const) {
    if (typeof p[key] !== 'string' || !p[key].trim() || p[key].length > (key === 'summary' ? 6000 : 300)) throw new Error('Проверьте имя, специализацию и описание опыта.');
  }
  const strings = (v: unknown, allowed?: string[]) => Array.isArray(v) && v.length > 0 && v.length <= 100 && v.every(x => typeof x === 'string' && x.trim().length > 0 && x.length <= 100 && (!allowed || allowed.includes(x)));
  if (!strings(p.skills) || !strings(p.roles, ['dotnet', 'fullstack', 'ai'])) throw new Error('Выберите роли и укажите навыки.');
  if (!Number.isInteger(p.minNetSalary) || p.minNetSalary < 1 || p.minNetSalary > 10000000) throw new Error('Зарплата должна быть целым числом от 1 до 10 000 000 ₽.');
  if (typeof p.allowMissingSalary !== 'boolean') throw new Error('Проверьте настройку вакансий без зарплаты.');
  if (!p.locations || !strings(p.locations.spb, ['remote', 'hybrid', 'office']) || !strings(p.locations.moscow, ['remote'])) throw new Error('Проверьте географию и формат работы.');
  if (!strings(p.employment, ['full', 'part', 'project'])) throw new Error('Выберите тип занятости.');
  return {
    name: p.name.trim(), title: p.title.trim(), summary: p.summary.trim(), skills: [...new Set(p.skills.map(x => x.trim()))],
    roles: [...new Set(p.roles)], minNetSalary: p.minNetSalary, allowMissingSalary: p.allowMissingSalary,
    locations: { spb: [...new Set(p.locations.spb)], moscow: [...new Set(p.locations.moscow)] }, employment: [...new Set(p.employment)],
  };
}
