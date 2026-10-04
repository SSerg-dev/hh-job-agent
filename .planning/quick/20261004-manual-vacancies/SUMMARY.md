# Completed manual vacancy workflow
Validated create/list/update API persists source vacancy and editable cover letter in SQLite. Matching uses saved profile and reevaluates on reopening the list. Vacancy and letter screens use manual mode; HH API search is not invoked there. Letters are factual deterministic templates, not LLM generation; no external sends.
13 behavior tests pass, including API create/edit, foreign origin rejection, profile reevaluation and database reopen persistence. TypeScript and production build pass.
Limitations: explicit city/format/salary inputs; no automatic parsing; no editing/deleting vacancy records yet, max100 records; unknown city treated outside approved geography. API integration still unresolved after applicant support discontinuation notice.
