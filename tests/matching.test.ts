import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultProfile } from '../src/shared/profile.ts';
import { evaluateVacancy } from '../src/shared/matching.ts';
import type { Vacancy } from '../src/shared/types.ts';
const base: Vacancy = { id: '1', name: 'Senior .NET Developer', area: { id: '2', name: 'Санкт-Петербург' }, work_format: [{ id: 'ON_SITE', name: 'Офис' }], description: 'C# .NET Angular REST API', key_skills: [{ name: 'C#' }, { name: '.NET' }], salary_range: { from: 160000, currency: 'RUR', gross: false, mode: { id: 'MONTH' } } };
const decision = (delta: Partial<Vacancy>) => evaluateVacancy({ ...base, ...delta }, defaultProfile).decision;

test('explicit language alternatives require only one verified language without claiming the others', () => {
  for (const description of ['RAG integration. Python или C#.', 'RAG integration. Python or C#.', 'RAG integration. Один из языков: Python, Java, C#.', 'RAG integration. Python, JavaScript / TypeScript, Java, Kotlin, C#, Go или другом современном языке.']) {
    const match = evaluateVacancy({ ...base, name: 'AI Engineer', description, key_skills: [{ name: 'Python' }, { name: 'C#' }] }, defaultProfile);
    assert.equal(match.decision, 'eligible', description);
    assert.ok(!match.gaps.includes('Python'));
    assert.ok(!match.matchedSkills.includes('Python'));
    assert.ok(match.reasons.some(reason => reason.includes('альтернатив')));
  }
});

test('AND, unsupported alternatives and independently mandatory languages are not waived', () => {
  for (const description of ['RAG integration. Python и C#.', 'RAG integration. Python and C#.', 'RAG integration. Python or Java.', 'RAG integration. Python or C#. Python обязателен отдельно.', 'RAG integration. Python и C# или Java.', 'RAG integration. Python / C#.']) {
    const match = evaluateVacancy({ ...base, name: 'AI Engineer', description, key_skills: [{ name: 'Python' }, { name: 'C#' }] }, defaultProfile);
    assert.equal(match.decision, 'review', description);
    assert.ok(match.gaps.includes('Python'), description);
  }
});

test('optional skill sections do not block matching and are reported separately', () => {
  const match = evaluateVacancy({ ...base, name: 'AI Engineer', description: '<h3>Requirements:</h3><p>RAG and C# integrations.</p><h3>Nice to have:</h3><p>Python, PyTorch, model training.</p>', key_skills: [{ name: 'C#' }, { name: 'Python' }, { name: 'PyTorch' }] }, defaultProfile);
  assert.equal(match.decision, 'eligible'); assert.deepEqual(match.gaps, []);
  assert.deepEqual(match.optionalGaps, ['Python', 'PyTorch']);
  assert.equal(match.coverage, 100);
});

test('mandatory headings and repeated requirements override optional wording', () => {
  for (const description of ['RAG C#\nБудет плюсом:\nPython\nТребования:\nPython обязателен', 'RAG C# Требования: Python. Будет плюсом: Python.', 'RAG C#\nNice to have:\nPython\nRequirements:\nPython']) {
    const match = evaluateVacancy({ ...base, name: 'AI Engineer', description, key_skills: [{ name: 'C#' }, { name: 'Python' }] }, defaultProfile);
    assert.equal(match.decision, 'review', description); assert.ok(match.gaps.includes('Python'));
    assert.ok(!match.optionalGaps.includes('Python'));
  }
});

test('unknown tags, ambiguous bonuses and mandatory ML work retain review decisions', () => {
  for (const description of ['RAG C#. Возможно Python будет плюсом, но также нужен.', 'RAG C#. Model training required.\nБудет плюсом:\nPython', 'RAG C#\nБудет плюсом:\nDocker']) {
    const match = evaluateVacancy({ ...base, name: 'AI Engineer', description, key_skills: [{ name: 'C#' }, { name: 'Python' }] }, defaultProfile);
    assert.equal(match.decision, 'review', description);
  }
});

test('optional sections cannot hide explicit mandatory wording or establish AI integration', () => {
  const contradictory = evaluateVacancy({ ...base, name: 'AI Engineer', description: 'RAG C#\nБудет плюсом:\nPython обязателен.', key_skills: [{ name: 'C#' }, { name: 'Python' }] }, defaultProfile);
  assert.equal(contradictory.decision, 'review'); assert.ok(contradictory.gaps.includes('Python'));
  assert.equal(decision({ name: 'AI Engineer', description: 'C# backend.\nNice to have:\nOpenAI RAG.', key_skills: [{ name: 'C#' }] }), 'review');
});

test('optional stack cannot establish backend or fullstack specialization', () => {
  assert.equal(decision({ name: 'Senior Backend Developer', description: 'Enterprise services.\nNice to have:\nC# .NET.', key_skills: [{ name: 'C#' }, { name: '.NET' }] }), 'rejected');
  assert.equal(decision({ name: 'Senior Fullstack Developer', description: 'Enterprise applications.\nБудет плюсом:\nC# .NET Angular.', key_skills: [{ name: 'C#' }, { name: '.NET' }, { name: 'Angular' }] }), 'rejected');
  assert.equal(decision({ name: 'Senior .NET Fullstack Developer', description: 'C# .NET backend.\nNice to have:\nAngular Vue.', key_skills: [{ name: 'C#' }, { name: 'Angular' }, { name: 'Vue' }] }), 'rejected');
  assert.equal(decision({ description: 'Enterprise services.\nNice to have:\nPython.', key_skills: [{ name: 'C#' }, { name: 'Python' }] }), 'eligible');
});

test('mandatory headings preserve single-language requirements without skill tags', () => {
  for (const heading of ['Requirements:', 'Must have:', 'Требования:', 'Что важно для этой роли:']) {
    const match = evaluateVacancy({ ...base, description: `C# .NET backend.\n${heading}\nPython`, key_skills: [] }, defaultProfile);
    assert.equal(match.decision, 'review', heading);
    assert.ok(match.gaps.includes('Python'), heading);
  }
  const optional = evaluateVacancy({ ...base, description: 'C# .NET backend.\nRequirements:\nC#\nNice to have:\nPython', key_skills: [] }, defaultProfile);
  assert.equal(optional.decision, 'eligible');
  assert.deepEqual(optional.optionalGaps, ['Python']);
});

test('description-only alternatives and independently required languages remain explainable', () => {
  assert.equal(decision({ description: 'C# .NET. Required: Python or Java.', key_skills: [] }), 'review');
  const match = evaluateVacancy({ ...base, description: 'C# .NET. Required: Python or C#.', key_skills: [{ name: 'Python' }] }, defaultProfile);
  assert.equal(match.decision, 'eligible'); assert.equal(match.coverage, null);
  assert.deepEqual(match.gaps, []); assert.ok(!match.matchedSkills.includes('Python'));
  assert.equal(decision({ description: 'C# .NET. Required: Python and C#.', key_skills: [] }), 'review');
  for (const description of ['C# .NET. Python, C#, Java.', 'C# .NET. Python / C#.', 'C# .NET. Python and C#.']) assert.equal(decision({ description, key_skills: [] }), 'review');
  assert.equal(decision({ description: 'C# .NET. Must go to the office.', key_skills: [] }), 'eligible');
});
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
