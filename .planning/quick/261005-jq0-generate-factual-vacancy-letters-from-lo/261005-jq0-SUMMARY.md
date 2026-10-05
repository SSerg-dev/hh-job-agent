# Documents connected to local letter drafting

Implemented deterministic vacancy-specific selection of verified candidate facts. Local SQLite candidate_letter_facts contains four curated Russian paragraphs backed by exact source quotations and SHA256 references to the three candidate documents. Personal source material and the catalog stay in ignored output/data directories.

New manual entries receive a document-based draft. Existing cards offer regeneration that replaces and saves the letter; source filenames and factual caveats appear separately. No raw source instructions are followed. Changed hashes or absent quotations exclude the fact. Missing catalog falls back to the short profile with a warning. No external LLM or application submission is involved.

Validation: all 23 tests passed, including relevant fact selection, source-instruction isolation, stale-source exclusion, API generation/regeneration and persistence. TypeScript check and Vite build passed. Local server restarted. Browser visual check remains unperformed in this task.

Usage at last check: 31% five-hour / 74% weekly remaining. Do not initiate further work without rechecking the 30% reserve policy.
