import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultProfile } from '../src/shared/profile.ts';
import { evaluateVacancy } from '../src/shared/matching.ts';
import type { Vacancy } from '../src/shared/types.ts';
const base: Vacancy = { id: '1', name: 'Senior .NET Developer', area: { id: '2', name: 'Санкт-Петербург' }, work_format: [{ id: 'ON_SITE', name: 'Офис' }], description: 'C# .NET Angular REST API', key_skills: [{ name: 'C#' }, { name: '.NET' }], salary_range: { from: 160000, currency: 'RUR', gross: false, mode: { id: 'MONTH' } } };
const decision = (delta: Partial<Vacancy>) => evaluateVacancy({ ...base, ...delta }, defaultProfile).decision;
test('net pay threshold and missing salary are distinct from gross/incomplete/upper-only/hourly pay', () => {
  assert.equal(decision({}), 'eligible'); assert.equal(decision({ salary_range: null }), 'eligible');
  assert.equal(decision({ salary_range: { from: 160000, currency: 'RUR', gross: true } }), 'review');
  assert.equal(decision({ salary_range: { to: 200000, currency: 'RUR', gross: false } }), 'review');
  assert.equal(decision({ salary_range: { from: 130000, to: 150000, currency: 'RUR', gross: false } }), 'rejected');
  assert.equal(decision({ salary_range: {} }), 'review');
  assert.equal(decision({ salary_range: { from: 160000, currency: 'RUR', gross: false, mode: { id: 'HOUR' } } }), 'review');
  assert.equal(evaluateVacancy({ ...base, salary_range: null }, { ...defaultProfile, allowMissingSalary: false }).decision, 'rejected');
});
test('Moscow office/hybrid excluded, remote allowed, ambiguous formats require review', () => {
  const area = { id: '1', name: 'Москва' };
  assert.equal(decision({ area }), 'rejected');
  assert.equal(decision({ area, work_format: [{ id: 'HYBRID', name: 'Гибрид' }] }), 'rejected');
  assert.equal(decision({ area, work_format: [{ id: 'REMOTE', name: 'Удалёнка' }] }), 'eligible');
  assert.equal(decision({ area, work_format: [] }), 'review');
  assert.equal(decision({ area: { id: '3', name: 'Other' } }), 'rejected');
});
test('English/Russian lead and junior roles never qualify, missing detail/skills/test are review-only', () => {
  for (const name of ['Tech Lead .NET', 'Team Lead .NET', 'Тимлид .NET', 'Руководитель разработки .NET', 'Junior .NET Developer']) assert.equal(decision({ name }), 'rejected');
  assert.equal(decision({ name: 'Senior Python Developer', description: 'Python', key_skills: [] }), 'rejected');
  assert.equal(decision({ description: undefined }), 'review');
  assert.equal(decision({ key_skills: [{ name: 'PyTorch' }] }), 'review');
  assert.equal(decision({ has_test: true }), 'review');
  assert.equal(decision({ archived: true }), 'rejected');
});
test('broad skills cannot establish narrow requirements and ML research does not count as LLM integration', () => {
  const p = { ...defaultProfile, skills: ['.NET', 'SQL'] };
  const result = evaluateVacancy({ ...base, key_skills: [{ name: 'ASP.NET Core' }, { name: 'SQL Server' }] }, p);
  assert.equal(result.decision, 'review'); assert.deepEqual(result.gaps, ['ASP.NET Core', 'SQL Server']);
  assert.equal(decision({ name: 'AI Engineer', description: 'Azure. Model training with PyTorch and Python.', key_skills: [] }), 'review');
  assert.equal(decision({ name: 'AI Engineer', description: 'Integrate OpenAI and RAG into enterprise applications on Azure.', key_skills: [] }), 'eligible');
});
