export type Role = 'dotnet' | 'fullstack' | 'ai';
export interface Profile {
  name: string; title: string; summary: string; skills: string[];
  roles: Role[]; minNetSalary: number; allowMissingSalary: boolean;
  locations: { spb: ('remote' | 'hybrid' | 'office')[]; moscow: ('remote')[] };
  employment: ('full' | 'part' | 'project')[];
}
export interface Health { version: string; accountConnected: boolean; configured: boolean; mode: 'preview' | 'live' }
export interface HHSalary {
  from?: number | null; to?: number | null; currency?: string; gross?: boolean;
  mode?: { id: string; name?: string }; frequency?: { id: string; name?: string };
}
export interface Vacancy {
  id: string; name: string; alternate_url?: string;
  employer?: { id?: string; name: string }; area: { id: string; name: string };
  salary?: HHSalary | null; salary_range?: HHSalary | null;
  work_format?: { id: string; name: string }[]; schedule?: { id: string; name: string } | null;
  experience?: { id: string; name: string }; employment?: { id: string; name: string };
  description?: string; key_skills?: { name: string }[]; snippet?: { requirement?: string | null; responsibility?: string | null };
  archived?: boolean; has_test?: boolean; published_at?: string;
}
export interface Match {
  decision: 'eligible' | 'review' | 'rejected'; reasons: string[]; matchedSkills: string[]; gaps: string[]; optionalGaps: string[];
  coverage: number | null; salaryLabel: string; formatLabel: string; fullDetails: boolean;
}
export interface VacancyResult { vacancy: Vacancy; match: Match }
export interface SearchResult { items: VacancyResult[]; found: number; pages: number; page: number; perPage: number; query: string; fetchedAt: string }
