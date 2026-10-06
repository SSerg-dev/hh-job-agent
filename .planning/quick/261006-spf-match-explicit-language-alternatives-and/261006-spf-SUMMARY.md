---
status: complete
verification: automated_passed
---

# Explicit language alternatives and optional skills

Follow-up: agent-browser UI checks on 2026-10-06 passed for the separate nonblocking optionalGaps note and the real-source language-alternative explanation. Quick 261006-s8o UI checks also passed and its status is now complete. These observations do not substitute for formal Phase 3/user acceptance. See ../261006-s8o-protect-local-letter-edits-and-reconcile/261006-s8o-UI-CHECKS.md. Earlier pending-UI statements below describe the state before this follow-up.

Implemented the user's confirmed policy inline through local GSD quick mode: one confirmed language satisfies explicit Russian/English OR/one-of lists, including the recorded Napoleon IT list. Waived languages are not added to matchedSkills. AND requirements, bare comma/slash lists, mixed AND/OR clauses, separately required occurrences and contradictory mandatory wording retain review safeguards. Parsing is bounded and conservative, not general language understanding.

Optional sections are split at recognized headings and preserve HTML/newline boundaries. Missing optional listed tags and recognized language/ML-framework names are returned as optionalGaps and displayed in a separate manual-card note. Optional ML mentions do not independently trigger mandatory ML review; mandatory model training still does. Coverage counts remaining individually required tags rather than pretending waived languages are verified experience. Existing broad-to-narrow skill distinctions remain intact.

Regression-first validation: new cases failed on the original implementation. Seven additional test cases now pass; all 32 behavior tests, Node 24.19.0 typecheck and Vite production build pass, as does git diff --check. Cases cover alternatives, repeated mandatory requirements, AND/mixed/slash/comma lists, optional headings/reset, contradictory optional wording, mandatory ML and ordinary lowercase English "go".

Offline evaluation of the saved real Napoleon IT vacancy no longer produces the false Python/ML review reason. Overall decision remains review for Fullstack, SolutionEngineering, LLM, AIAgents, BusinessProcessAutomation and Git tags, which are not silently inferred as proven experience. No new live import or UI acceptance is claimed in this task. Letter confirmation/cancellation and optional note rendering still need manual UI acceptance; earlier quick task 261006-s8o stays incomplete.

Preserved existing uncommitted work and debug material. No agents, commits, cloud changes, server launches, applications or personal database mutations. README, project decisions and continuation state record actual coverage and limitations. Latest capacity: 55% five-hour / 67% weekly remaining. Phase 2 live API search and formal Phase 3 acceptance remain pending.
