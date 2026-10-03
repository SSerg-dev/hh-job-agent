export type Role = 'dotnet' | 'fullstack' | 'ai';
export interface Profile {
  name: string; title: string; summary: string; skills: string[];
  roles: Role[]; minNetSalary: number; allowMissingSalary: boolean;
  locations: { spb: ('remote' | 'hybrid' | 'office')[]; moscow: ('remote')[] };
  employment: ('full' | 'part' | 'project')[];
}
export interface Health { version: string; accountConnected: boolean; configured: boolean; mode: 'preview' | 'live' }
