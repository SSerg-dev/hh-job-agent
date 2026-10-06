---
mode: quick
autonomous: true
---

# Explicit language alternatives and optional skills

User decisions: one confirmed language satisfies an explicit alternative. Clearly optional skills are explanatory only; missing bonuses alone do not cause review. Ambiguous wording stays review-only. Do not infer skills or waive separately required languages.

1. Add failing regression tests for Russian/English alternatives, AND/mixed clauses, repeated mandatory language requirements, optional sections and heading resets.
2. Implement conservative deterministic parsing; retain safety gates for salary, geography, seniority, unknown skills, ML requirements and full details. Display missing optional skills separately.
3. Run targeted tests, full tests, typecheck/build and diff checks. Record verified scope and remaining UI UAT in GSD. No commits, agents, cloud or submissions.
